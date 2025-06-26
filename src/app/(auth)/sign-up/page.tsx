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
import { cn } from "lib/utils";
import { ChevronLeft, Loader } from "lucide-react";
import { toast } from "sonner";
import { safe } from "ts-safe";
import { UserZodSchema } from "app-types/user";
import { existsByEmailAction } from "@/app/api/auth/actions";
import { authClient } from "auth/client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function SignUpPage() {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useObjectState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    otp: "",
  });

  const { isOnCooldown, formatCooldownTime, startCooldown } =
    useResendCooldown();

  const steps = [
    "Enter your email to get started",
    "Choose a secure password",
    "Tell us your name",
    "Verify your email address",
  ];

  /**
   * Safe wrapper for async operations with loading state
   */
  const safeWithLoading = (fn: () => Promise<any>) => {
    setIsLoading(true);
    return safe(() => fn()).watch(() => setIsLoading(false));
  };

  /**
   * Go back to previous step
   */
  const goBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleEmailStep = async () => {
    if (!formData.email) {
      toast.error("Please enter your email address");
      return;
    }

    const emailValidation = UserZodSchema.pick({ email: true }).safeParse({
      email: formData.email,
    });

    if (!emailValidation.success) {
      toast.error("Please enter a valid email address");
      return;
    }

    safeWithLoading(async () => {
      const emailExists = await existsByEmailAction(formData.email);
      if (emailExists) {
        toast.error("An account with this email already exists");
        return;
      }
      setStep(2);
    }).unwrap();
  };

  const handlePasswordStep = () => {
    if (!formData.password) {
      toast.error("Please enter a password");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setStep(3);
  };

  const handleNameStep = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setStep(4);
    sendVerificationOTP();
  };

  const sendVerificationOTP = () => {
    setIsLoading(true);

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
            startCooldown(); // Start the 2-minute cooldown
          },
        },
      ),
    )
      .watch(() => setIsLoading(false))
      .unwrap();
  };

  const handleResendOTP = () => {
    if (isOnCooldown) return;

    setFormData({ otp: "" });
    sendVerificationOTP();
  };

  const handleEmailVerification = () => {
    if (!formData.otp || formData.otp.length !== 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setIsLoading(true);

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
            // After email verification, complete the registration
            completeRegistration();
          },
        },
      ),
    )
      .watch(() => setIsLoading(false))
      .unwrap();
  };

  const completeRegistration = () => {
    safe(() =>
      authClient.signUp.email(
        {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          callbackURL: "/app",
        },
        {
          onError(ctx) {
            toast.error(ctx.error.message || "Registration failed");
          },
          onSuccess() {
            toast.success("Account created successfully! Welcome!");
            router.push("/");
          },
        },
      ),
    ).unwrap();
  };

  return (
    <div className="animate-in fade-in duration-1000 w-full h-full flex flex-col p-4 md:p-8 justify-center relative">
      <div className="w-full flex justify-end absolute top-0 right-0">
        <Link href="/sign-in">
          <Button variant="ghost">{t("Auth.SignUp.signIn")}</Button>
        </Link>
      </div>
      <Card className="w-full md:max-w-md bg-background border-none mx-auto gap-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl text-center ">
            {step === 4 ? "Verify Your Email" : t("Auth.SignUp.title")}
          </CardTitle>
          <CardDescription className="py-12">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground text-right">
                Step {step} of {steps.length}
              </p>
              <div className="h-2 w-full relative bg-input">
                <div
                  style={{
                    width: `${(step / 4) * 100}%`,
                  }}
                  className="h-full bg-primary transition-all duration-300"
                ></div>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {step === 1 && (
              <div className={cn("flex flex-col gap-2")}>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  disabled={isLoading}
                  autoFocus
                  value={formData.email}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      e.nativeEvent.isComposing === false
                    ) {
                      handleEmailStep();
                    }
                  }}
                  onChange={(e) => setFormData({ email: e.target.value })}
                  required
                />
              </div>
            )}
            {step === 2 && (
              <div className={cn("flex flex-col gap-2")}>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  disabled={isLoading}
                  autoFocus
                  value={formData.password}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      e.nativeEvent.isComposing === false
                    ) {
                      handlePasswordStep();
                    }
                  }}
                  onChange={(e) => setFormData({ password: e.target.value })}
                  required
                />
              </div>
            )}
            {step === 2 && (
              <div className={cn("flex flex-col gap-2")}>
                <div className="flex items-center">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                </div>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  disabled={isLoading}
                  value={formData.confirmPassword}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      e.nativeEvent.isComposing === false
                    ) {
                      handlePasswordStep();
                    }
                  }}
                  onChange={(e) =>
                    setFormData({ confirmPassword: e.target.value })
                  }
                  required
                />
              </div>
            )}
            {step === 3 && (
              <div className={cn("flex flex-col gap-2")}>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  autoFocus
                  value={formData.name}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      e.nativeEvent.isComposing === false
                    ) {
                      handleNameStep();
                    }
                  }}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  required
                />
              </div>
            )}
            {step === 4 && (
              <div className={cn("flex flex-col gap-4")}>
                <div className="text-center text-sm text-muted-foreground mb-4">
                  We sent a 6-digit verification code to{" "}
                  <strong>{formData.email}</strong>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="otp" className="text-left">
                    Enter verification code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    disabled={isLoading}
                    autoFocus
                    value={formData.otp}
                    onChange={(e) =>
                      setFormData({
                        otp: e.target.value.replace(/\D/g, "").slice(0, 6),
                      })
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        e.nativeEvent.isComposing === false
                      ) {
                        handleEmailVerification();
                      }
                    }}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                    required
                  />
                </div>
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isOnCooldown || isLoading}
                    className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isOnCooldown
                      ? `Resend in ${formatCooldownTime()}`
                      : "Didn't receive the code? Resend"}
                  </button>
                </div>
              </div>
            )}
            <p className="text-muted-foreground text-xs mb-6">
              {steps[step - 1]}
            </p>
            <div className="flex gap-2">
              <Button
                disabled={isLoading}
                className={cn(step === 1 && "opacity-0", "w-1/2")}
                variant="ghost"
                onClick={goBack}
              >
                <ChevronLeft className="size-4" />
                {t("Common.back")}
              </Button>
              <Button
                disabled={isLoading}
                className="w-1/2"
                onClick={() => {
                  if (step === 1) handleEmailStep();
                  if (step === 2) handlePasswordStep();
                  if (step === 3) handleNameStep();
                  if (step === 4) handleEmailVerification();
                }}
              >
                {step === 3
                  ? t("Auth.SignUp.createAccount")
                  : step === 4
                    ? "Verify Email"
                    : t("Common.next")}
                {isLoading && <Loader className="size-4 ml-2" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
