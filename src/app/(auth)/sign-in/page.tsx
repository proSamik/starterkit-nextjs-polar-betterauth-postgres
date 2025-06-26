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

import { Loader } from "lucide-react";
import { safe } from "ts-safe";
import { authClient } from "auth/client";
import { toast } from "sonner";
import { GithubIcon } from "ui/github-icon";
import { GoogleIcon } from "ui/google-icon";
import { useTranslations } from "next-intl";

export default function SignInPage() {
  const t = useTranslations("Auth.SignIn");

  const [loading, setLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  const [formData, setFormData] = useObjectState({
    email: "",
    password: "",
    otp: "",
  });

  const emailAndPasswordSignIn = () => {
    setLoading(true);
    safe(() =>
      authClient.signIn.email(
        {
          email: formData.email,
          password: formData.password,
          callbackURL: "/app",
        },
        {
          onError(ctx) {
            // Check if the error is related to email verification
            if (
              ctx.error.status === 403 ||
              ctx.error.message?.includes("email") ||
              ctx.error.message?.includes("verify")
            ) {
              setShowEmailVerification(true);
              toast.error("Please verify your email address to continue");
              // Send verification OTP
              sendVerificationOTP();
            } else {
              toast.error(ctx.error.message || ctx.error.statusText);
            }
          },
        },
      ),
    )
      .watch(() => setLoading(false))
      .unwrap();
  };

  const sendVerificationOTP = () => {
    safe(() =>
      authClient.emailOtp.sendVerificationOtp(
        {
          email: formData.email,
          type: "email-verification",
        },
        {
          onError(ctx) {
            toast.error(
              ctx.error.message || "Failed to send verification code",
            );
          },
          onSuccess() {
            toast.success("Verification code sent to your email!");
          },
        },
      ),
    ).unwrap();
  };

  const verifyEmailAndSignIn = () => {
    if (!formData.otp || formData.otp.length !== 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    safe(() =>
      authClient.emailOtp.verifyEmail(
        {
          email: formData.email,
          otp: formData.otp,
        },
        {
          onError(ctx) {
            toast.error(ctx.error.message || "Invalid verification code");
          },
          onSuccess() {
            toast.success("Email verified! Signing you in...");
            // After email verification, sign in the user
            emailAndPasswordSignIn();
          },
        },
      ),
    )
      .watch(() => setLoading(false))
      .unwrap();
  };

  const resendVerificationCode = () => {
    setFormData({ otp: "" });
    sendVerificationOTP();
  };

  const googleSignIn = () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
      return toast.warning(t("oauthClientIdNotSet", { provider: "Google" }));
    authClient.signIn
      .social({
        provider: "google",
      })
      .catch((e) => {
        toast.error(e.error);
      });
  };

  const githubSignIn = () => {
    if (!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID)
      return toast.warning(t("oauthClientIdNotSet", { provider: "GitHub" }));
    authClient.signIn
      .social({
        provider: "github",
      })
      .catch((e) => {
        toast.error(e.error);
      });
  };

  // Email verification view
  if (showEmailVerification) {
    return (
      <div className="w-full h-full flex flex-col p-4 md:p-8 justify-center">
        <Card className="w-full md:max-w-md bg-background border-none mx-auto shadow-none animate-in fade-in duration-1000">
          <CardHeader className="my-4">
            <CardTitle className="text-2xl text-center my-1">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              We sent a 6-digit verification code to {formData.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  autoFocus
                  disabled={loading}
                  value={formData.otp}
                  onChange={(e) =>
                    setFormData({
                      otp: e.target.value.replace(/\D/g, "").slice(0, 6),
                    })
                  }
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      verifyEmailAndSignIn();
                    }
                  }}
                />
              </div>

              <Button
                className="w-full"
                onClick={verifyEmailAndSignIn}
                disabled={loading}
              >
                {loading ? (
                  <Loader className="size-4 animate-spin ml-1" />
                ) : (
                  "Verify & Sign In"
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resendVerificationCode}
                  disabled={loading}
                  className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                >
                  Didn&apos;t receive the code? Resend
                </button>
              </div>
            </div>

            <div className="my-8 text-center text-sm text-muted-foreground">
              Want to try a different email?
              <button
                onClick={() => {
                  setShowEmailVerification(false);
                  setFormData({ otp: "" });
                }}
                className="underline-offset-4 text-primary ml-1 hover:underline"
              >
                Go back
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Regular sign-in view
  return (
    <div className="w-full h-full flex flex-col p-4 md:p-8 justify-center">
      <Card className="w-full md:max-w-md bg-background border-none mx-auto shadow-none animate-in fade-in duration-1000">
        <CardHeader className="my-4">
          <CardTitle className="text-2xl text-center my-1">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                autoFocus
                disabled={loading}
                value={formData.email}
                onChange={(e) => setFormData({ email: e.target.value })}
                type="email"
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                disabled={loading}
                value={formData.password}
                placeholder="********"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    emailAndPasswordSignIn();
                  }
                }}
                onChange={(e) => setFormData({ password: e.target.value })}
                type="password"
                required
              />
            </div>
            <Button
              className="w-full"
              onClick={emailAndPasswordSignIn}
              disabled={loading}
            >
              {loading ? (
                <Loader className="size-4 animate-spin ml-1" />
              ) : (
                t("signIn")
              )}
            </Button>
          </div>
          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-accent"></div>
            <span className="px-4 text-sm text-muted-foreground">
              {t("orContinueWith")}
            </span>
            <div className="flex-1 h-px bg-accent"></div>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={googleSignIn}
              className="flex-1 "
            >
              <GoogleIcon className="size-4 fill-foreground" />
              Google
            </Button>
            <Button variant="outline" onClick={githubSignIn} className="flex-1">
              <GithubIcon className="size-4 fill-foreground" />
              GitHub
            </Button>
          </div>

          <div className="my-8 text-center text-sm text-muted-foreground">
            {t("noAccount")}
            <Link href="/sign-up" className="underline-offset-4 text-primary">
              {t("signUp")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
