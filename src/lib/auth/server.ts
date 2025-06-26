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
import {
  AccountSchema,
  SessionSchema,
  UserSchema,
  VerificationSchema,
} from "lib/db/pg/schema.pg";
import logger from "logger";
import {
  sendPasswordResetOTP,
  trackUserSignup,
  sendEmailVerificationOTP,
} from "@/lib/plunk/events";
import { emailOTP } from "better-auth/plugins";

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
              slug: "monthly",
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
    emailOTP({
      /**
       * Send OTP via email for different authentication flows
       * @param email - User's email address
       * @param otp - 6-digit OTP code
       * @param type - Type of OTP: "sign-in", "email-verification", or "forget-password"
       */
      async sendVerificationOTP({ email, otp, type }) {
        try {
          let result;

          // Send transactional emails with OTP based on type
          if (type === "forget-password") {
            result = await sendPasswordResetOTP(email, otp);
          } else if (type === "email-verification") {
            result = await sendEmailVerificationOTP(email, otp);
          } else {
            console.warn(`Unknown OTP type: ${type}, skipping email send`);
            return;
          }

          // Log result for monitoring
          if (result && !result.success) {
            console.error(
              `Failed to send ${type} OTP to ${email}:`,
              result.error,
            );
            // In production, you might want to send to a fallback email service
            // or add to a retry queue here
          }
        } catch (error) {
          console.error(
            `Critical error in sendVerificationOTP for ${type}:`,
            error,
          );
          // Don't throw error to prevent breaking the auth flow
          // Better-auth expects this function to not throw
        }
      },
      otpLength: 6, // 6-digit OTP
      expiresIn: 300, // 5 minutes
      allowedAttempts: 3, // Maximum 3 attempts before OTP becomes invalid
      sendVerificationOnSignUp: true, // Send OTP when user signs up
    }),
    emailHarmony(),
  ],
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
            // Track user signup event
            await trackUserSignup(user.email, user.name);
          } catch (error) {
            console.error("Error tracking user signup:", error);
            // Don't throw error to prevent breaking user creation
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
