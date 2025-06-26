"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useObjectState } from "@/hooks/use-object-state";
import { useResendCooldown } from "@/hooks/use-resend-cooldown";
import { Loader } from "lucide-react";
import { safe } from "ts-safe";
import { authClient } from "auth/client";
import { toast } from "sonner";

/**
 * Forgot Password Page Component
 * Allows users to request a password reset OTP and reset their password
 */
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [state, setState] = useObjectState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
    loading: false,
  });

  const { isOnCooldown, formatCooldownTime, startCooldown } =
    useResendCooldown();

  /**
   * Handle sending OTP to user's email
   */
  const handleSendOTP = () => {
    if (!state.email) {
      toast.error("Please enter your email address");
      return;
    }

    setState({ loading: true });

    safe(() =>
      authClient.emailOtp.sendVerificationOtp(
        {
          email: state.email,
          type: "forget-password",
        },
        {
          onError(ctx) {
            toast.error(
              ctx.error.message || "Failed to send verification code",
            );
          },
          onSuccess() {
            toast.success("Verification code sent to your email!");
            setStep("otp");
            startCooldown(); // Start the 2-minute cooldown
          },
        },
      ),
    )
      .watch(() => setState({ loading: false }))
      .unwrap();
  };

  /**
   * Handle resending OTP
   */
  const handleResendOTP = () => {
    if (isOnCooldown) return;

    setState({ loading: true });

    safe(() =>
      authClient.emailOtp.sendVerificationOtp(
        {
          email: state.email,
          type: "forget-password",
        },
        {
          onError(ctx) {
            toast.error(
              ctx.error.message || "Failed to resend verification code",
            );
          },
          onSuccess() {
            toast.success("Verification code resent!");
            startCooldown(); // Restart the cooldown
          },
        },
      ),
    )
      .watch(() => setState({ loading: false }))
      .unwrap();
  };

  /**
   * Handle OTP verification and password reset
   */
  const handleResetPassword = () => {
    if (!state.otp) {
      toast.error("Please enter the verification code");
      return;
    }

    if (!state.password) {
      toast.error("Please enter a new password");
      return;
    }

    if (state.password !== state.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (state.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setState({ loading: true });

    safe(() =>
      authClient.emailOtp.resetPassword(
        {
          email: state.email,
          otp: state.otp,
          password: state.password,
        },
        {
          onError(ctx) {
            toast.error(
              ctx.error.message ||
                "Invalid verification code or password reset failed",
            );
          },
          onSuccess() {
            toast.success(
              "Password reset successfully! You can now sign in with your new password.",
            );
            // Redirect to sign-in page
            window.location.href = "/sign-in";
          },
        },
      ),
    )
      .watch(() => setState({ loading: false }))
      .unwrap();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === "email" && "Reset your password"}
            {step === "otp" && "Enter verification code"}
            {step === "password" && "Set new password"}
          </CardTitle>
          <CardDescription>
            {step === "email" &&
              "Enter your email address and we'll send you a verification code"}
            {step === "otp" && `We sent a 6-digit code to ${state.email}`}
            {step === "password" && "Enter your new password"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "email" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={state.email}
                  onChange={(e) => setState({ email: e.target.value })}
                  disabled={state.loading}
                />
              </div>
              <Button
                onClick={handleSendOTP}
                disabled={state.loading || !state.email}
                className="w-full"
              >
                {state.loading && (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send verification code
              </Button>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-left">
                  Enter verification code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={state.otp}
                  onChange={(e) =>
                    setState({
                      otp: e.target.value.replace(/\D/g, "").slice(0, 6),
                    })
                  }
                  disabled={state.loading}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isOnCooldown || state.loading}
                  className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOnCooldown
                    ? `Resend in ${formatCooldownTime()}`
                    : "Didn't receive the code? Resend"}
                </button>
              </div>
              <Button
                onClick={() => setStep("password")}
                disabled={state.loading || state.otp.length !== 6}
                className="w-full"
              >
                {state.loading && (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                )}
                Verify code
              </Button>
            </>
          )}

          {step === "password" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={state.password}
                  onChange={(e) => setState({ password: e.target.value })}
                  disabled={state.loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={state.confirmPassword}
                  onChange={(e) =>
                    setState({ confirmPassword: e.target.value })
                  }
                  disabled={state.loading}
                />
              </div>
              <Button
                onClick={handleResetPassword}
                disabled={
                  state.loading ||
                  !state.password ||
                  !state.confirmPassword ||
                  state.password !== state.confirmPassword ||
                  state.password.length < 8
                }
                className="w-full"
              >
                {state.loading && (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reset password
              </Button>
            </>
          )}

          <div className="text-center">
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
