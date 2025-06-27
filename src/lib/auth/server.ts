import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { polar, checkout, portal, usage } from "@polar-sh/better-auth";
import { emailHarmony } from "better-auth-harmony";
import { Polar } from "@polar-sh/sdk";
import { pgDb } from "@/lib/db/pg/db.pg";
import { headers } from "next/headers";
import { toast } from "sonner";
import { eq, sql } from "drizzle-orm";
import {
  AccountSchema,
  SessionSchema,
  UserSchema,
  VerificationSchema,
} from "lib/db/pg/schema.pg";
import logger from "logger";
import {
  sendPasswordResetLink,
  trackUserSignup,
  sendEmailVerificationLink,
} from "@/lib/plunk/events";


// Initialize Polar client
const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN || "",
  // Use 'sandbox' for development, 'production' for live
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

export const auth = betterAuth({
  plugins: [
    nextCookies(),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: process.env.POLAR_MONTHLY_PRODUCT_ID || "",
              slug: "Free",
            },
            {
              productId: process.env.POLAR_YEARLY_PRODUCT_ID || "",
              slug: "yearly",
            },
            {
              productId: process.env.POLAR_LIFETIME_PRODUCT_ID || "",
              slug: "lifetime",
            },
          ],
          successUrl:
            "/dashboard?checkout_success=true&checkout_id={CHECKOUT_ID}",
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
      ],
    }),

          emailHarmony(),
    ],
    emailVerification: {
      /**
       * Send verification email with link for email verification during signup
       * @param user - User object containing email and other details
       * @param url - The verification URL containing the token
       * @param token - The verification token used to complete verification
       */
      async sendVerificationEmail({ user, url, token }, request) {
        try {
          // Send verification email using the modern link-based verification
          const result = await sendEmailVerificationLink(user.email, url);
          
          // Log result for monitoring
          if (result && !result.success) {
            console.error(
              `Failed to send email verification to ${user.email}:`,
              result.error,
            );
          }
        } catch (error) {
          console.error(
            `Critical error in sendVerificationEmail:`,
            error,
          );
          // Don't throw error to prevent breaking the auth flow
        }
      },
      sendOnSignUp: true, // Send verification email on signup
      autoSignInAfterVerification: false, // Don't auto sign in after verification
    },
  database: drizzleAdapter(pgDb, {
    provider: "pg",
    schema: {
      user: UserSchema,
      session: SessionSchema,
      account: AccountSchema,
      verification: VerificationSchema,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: true, // Require email verification before login
    autoSignIn: false, // Don't auto sign in after signup - user must verify email first
    /**
     * Send password reset email with OTP for password reset
     * @param user - User object containing email and other details
     * @param url - The reset URL containing the token
     * @param token - The reset token used to complete password reset
     */
    async sendResetPassword({ user, url, token }, request) {
      try {
        // Send password reset link using the modern link-based function
        const result = await sendPasswordResetLink(user.email, url);
        
        // Log result for monitoring
        if (result && !result.success) {
          console.error(
            `Failed to send password reset to ${user.email}:`,
            result.error,
          );
        }
      } catch (error) {
        console.error(
          `Critical error in sendResetPassword:`,
          error,
        );
        // Don't throw error to prevent breaking the auth flow
      }
    },
    resetPasswordTokenExpiresIn: 300, // 5 minutes
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every day the session expiration is refreshed)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    useSecureCookies:
      process.env.NO_HTTPS == "1"
        ? false
        : process.env.NODE_ENV === "production",
    database: {
      generateId: false,
    },
  },
  account: {
    accountLinking: {
      trustedProviders: ["google", "github"],
    },
  },
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        toast.error("Too many requests. Please try again later.");
      }
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            // Track user signup event for all new users (email/password and social)
            await trackUserSignup(user.email, user.name);
          } catch (error) {
            console.error("Error tracking user signup:", error);
            // Don't throw error to prevent breaking user creation
          }
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          try {
            // Track social signup for new accounts created via OAuth providers
            if (account.providerId === "github" || account.providerId === "google") {
              // Use raw SQL to check if this is a new social signup
              const userResult = await pgDb.select().from(UserSchema).where(eq(UserSchema.id, account.userId)).limit(1);
              const user = userResult[0];
              
              if (user) {
                // Check if this is the user's first account (indicating a new signup)
                const accountCount = await pgDb.select({ count: sql`count(*)` }).from(AccountSchema).where(eq(AccountSchema.userId, account.userId));
                
                // If this is the only account for this user, it's a new social signup
                if (accountCount[0]?.count === 1) {
                  await trackUserSignup(user.email, user.name);
                }
              }
            }
          } catch (error) {
            console.error("Error tracking social signup:", error);
            // Don't throw error to prevent breaking account creation
          }
        },
      },
    },
  },
});

export const getSession = async () => {
  "use server";
  const session = await auth.api
    .getSession({
      headers: await headers(),
    })
    .catch((e) => {
      logger.error(e);
      return null;
    });
  return session;
};

export type Session = typeof auth.$Infer.Session;
