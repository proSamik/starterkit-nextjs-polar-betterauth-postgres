/**
 * Plunk Email Service Integration
 *
 * This module provides transactional email functionality for user authentication flows:
 * - Password reset emails with OTP codes
 * - Email verification emails with OTP codes
 * - User signup event tracking
 *
 * EMAIL TEMPLATES:
 * - Modern HTML designs with responsive layout
 * - Branded with Next.js Starter Kit styling (blue/white theme)
 * - Clear OTP display with security notices
 * - Professional styling using system fonts
 *
 * CONFIGURATION:
 * Required environment variables:
 * - PLUNK_SECRET_KEY: Your Plunk API secret key
 *
 * USAGE:
 * ```typescript
 * // Send password reset email
 * const result = await sendPasswordResetOTP("user@example.com", "123456");
 *
 * // Send email verification
 * const result = await sendEmailVerificationOTP("user@example.com", "123456");
 *
 * // Check result
 * if (result.success) {
 *   console.log("Email sent successfully");
 * } else {
 *   console.error("Failed to send email:", result.error);
 * }
 * ```
 *
 * BETTER-AUTH INTEGRATION:
 * These functions are automatically called by better-auth's emailOTP plugin
 * when users request password resets or email verification.
 */

import { getPlunkClient } from "./client";
import type { PlunkResponse } from "./client";

/**
 * Generate HTML email template for password reset OTP
 * @param otpCode 6-digit OTP code
 * @returns HTML email template
 */
function generatePasswordResetEmailHTML(otpCode: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #64748b;
            font-size: 16px;
        }
        .otp-container {
            background: #f1f5f9;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #2563eb;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .otp-label {
            color: #64748b;
            font-size: 14px;
            margin-top: 10px;
        }
        .instructions {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Next.js Starter Kit</div>
            <h1 class="title">Reset Your Password</h1>
            <p class="subtitle">We received a request to reset your password</p>
        </div>

        <div class="otp-container">
            <div class="otp-code">${otpCode}</div>
            <div class="otp-label">Your verification code</div>
        </div>

        <div class="instructions">
            <strong>Instructions:</strong>
            <ol>
                <li>Enter this 6-digit code on the password reset page</li>
                <li>Create a new secure password</li>
                <li>The code expires in 5 minutes</li>
            </ol>
        </div>

        <div class="warning">
            <strong>Security Notice:</strong><br>
            If you didn't request a password reset, please ignore this email. Your account remains secure.
        </div>

        <div class="footer">
            <p>This code will expire in 5 minutes for your security.</p>
            <p>If you need help, contact our support team.</p>
            <p>&copy; 2024 Next.js Starter Kit. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
}

/**
 * Generate HTML email template for email verification OTP
 * @param otpCode 6-digit OTP code
 * @returns HTML email template
 */
function generateEmailVerificationHTML(otpCode: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #64748b;
            font-size: 16px;
        }
        .otp-container {
            background: #f1f5f9;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #2563eb;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .otp-label {
            color: #64748b;
            font-size: 14px;
            margin-top: 10px;
        }
        .instructions {
            background: #dcfce7;
            border-left: 4px solid #16a34a;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Next.js Starter Kit</div>
            <h1 class="title">Verify Your Email</h1>
            <p class="subtitle">Welcome! Please verify your email address to continue</p>
        </div>

        <div class="otp-container">
            <div class="otp-code">${otpCode}</div>
            <div class="otp-label">Your verification code</div>
        </div>

        <div class="instructions">
            <strong>Next Steps:</strong>
            <ol>
                <li>Enter this 6-digit code on the verification page</li>
                <li>Complete your account setup</li>
                <li>Start building amazing web applications!</li>
            </ol>
        </div>

        <div class="footer">
            <p>This code will expire in 5 minutes for your security.</p>
            <p>Welcome to the future of modern web development!</p>
            <p>&copy; 2024 Next.js Starter Kit. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
}

/**
 * Send email verification OTP as transactional email
 * @param email User's email address
 * @param otpCode 6-digit OTP code
 * @returns Promise<PlunkResponse> Success/failure result with error details
 */
export async function sendEmailVerificationOTP(
  email: string,
  otpCode: string,
): Promise<PlunkResponse> {
  try {
    console.log(`Sending email verification OTP to ${email}`);
    const plunk = getPlunkClient();

    const result = await plunk.sendEmail({
      to: email,
      subject: "Verify Your Email - Next.js Starter Kit",
      body: generateEmailVerificationHTML(otpCode),
      type: "html",
      from: "noreply@prosamik.in",
      name: "Next.js Starter Kit",
      subscribed: false, // Email verification emails don't affect subscription status
    });

    if (result.success) {
      console.log(`Email verification OTP sent successfully to ${email}`);
    } else {
      console.error(
        `Failed to send email verification OTP to ${email}:`,
        result.error,
      );
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Failed to send email verification OTP to ${email}:`,
      errorMessage,
    );
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send password reset OTP as transactional email
 * @param email User's email address
 * @param otpCode 6-digit OTP code
 * @returns Promise<PlunkResponse> Success/failure result with error details
 */
export async function sendPasswordResetOTP(
  email: string,
  otpCode: string,
): Promise<PlunkResponse> {
  try {
    console.log(`Sending password reset OTP to ${email}`);
    const plunk = getPlunkClient();

    const result = await plunk.sendEmail({
      to: email,
      subject: "Reset Your Password - Next.js Starter Kit",
      body: generatePasswordResetEmailHTML(otpCode),
      type: "html",
      from: "noreply@prosamik.in",
      name: "Next.js Starter Kit",
      subscribed: false, // Password reset emails don't affect subscription status
    });

    if (result.success) {
      console.log(`Password reset OTP sent successfully to ${email}`);
    } else {
      console.error(
        `Failed to send password reset OTP to ${email}:`,
        result.error,
      );
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Failed to send password reset OTP to ${email}:`,
      errorMessage,
    );
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Track user signup event
 * @param email User's email address
 * @param fullName User's full name
 * @param signupDate Date of signup
 * @returns Promise<PlunkResponse>
 */
export async function trackUserSignup(
  email: string,
  fullName?: string,
): Promise<PlunkResponse> {
  try {
    const plunk = getPlunkClient();

    return await plunk.trackEvent({
      event: "user-signup",
      email,
      subscribed: true, // New users are subscribed by default
      data: {
        fullName: fullName,
      },
    });
  } catch (error) {
    console.error("Failed to track user signup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Legacy function names for backward compatibility
/**
 * @deprecated Use sendEmailVerificationOTP instead
 */
export const trackEmailVerificationOTP = sendEmailVerificationOTP;

/**
 * @deprecated Use sendPasswordResetOTP instead
 */
export const trackPasswordResetOTP = sendPasswordResetOTP;
