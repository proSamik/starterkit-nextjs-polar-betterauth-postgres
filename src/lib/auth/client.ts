"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { toast } from "sonner";
import { handleErrorWithToast } from "ui/shared-toast";
import { polarClient } from "@polar-sh/better-auth";
import { emailHarmony } from "better-auth-harmony";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "",
  plugins: [
    polarClient(),
    emailOTPClient(), // Enable OTP functionality on client side
    emailHarmony(),
  ],
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        toast.error("Too many requests. Please try again later.");
        return;
      }
      handleErrorWithToast(e.error);
    },
  },
});

export type AuthClient = typeof authClient;
