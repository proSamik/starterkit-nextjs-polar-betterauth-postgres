"use client";

import { createAuthClient } from "better-auth/react";

import { toast } from "sonner";
import { handleErrorWithToast } from "ui/shared-toast";
import { polarClient } from "@polar-sh/better-auth";
import { emailHarmony } from "better-auth-harmony";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "",
  plugins: [
    polarClient(),
    emailHarmony(),
  ],
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        toast.error("Too many requests. Please try again later.");
        return;
      }
      
      // Filter out specific errors that shouldn't show toasts
      if (
        e.error.code === "ORDERS_LIST_FAILED" || 
        e.error.message?.includes("Orders list failed") ||
        e.error.code === "CUSTOMER_PORTAL_CREATION_FAILED" ||
        e.error.message?.includes("Customer portal creation failed")
      ) {
        // Log for debugging but don't show toast to user
        console.log("Filtered error (no toast):", e.error);
        return;
      }
      
      handleErrorWithToast(e.error);
    },
  },
});

export type AuthClient = typeof authClient;
