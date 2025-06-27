/**
 * Plunk Email Service Integration
 *
 * This module provides transactional email functionality for user authentication flows:
 * - Email verification emails with verification links
 * - Password reset emails with reset links  
 * - User signup event tracking
 *
 * EMAIL TEMPLATES:
 * - Modern shadcn-inspired designs with responsive layout
 * - Branded with Polar SaaS Kit styling
 * - Clear call-to-action buttons with verification links
 * - Professional styling using system fonts and modern colors
 *
 * CONFIGURATION:
 * Required environment variables:
 * - PLUNK_SECRET_KEY: Your Plunk API secret key
 *
 * USAGE:
 * ```typescript
 * // Send email verification link
 * const result = await sendEmailVerificationLink("user@example.com", "https://app.com/verify?token=...");
 *
 * // Send password reset link
 * const result = await sendPasswordResetLink("user@example.com", "https://app.com/reset?token=...");
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
 * These functions are automatically called by better-auth's email verification
 * and password reset systems.
 */

import { getPlunkClient } from "./client";
import type { PlunkResponse } from "./client";

/**
 * Generate modern HTML email template for email verification with link
 * @param verificationUrl The verification URL to include in the email
 * @returns HTML email template with shadcn-style design
 */
function generateEmailVerificationHTML(verificationUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Polar SaaS Kit</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #020817;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: #ffffff;
            border-radius: 12px;
            padding: 48px 40px;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
            border: 1px solid #e2e8f0;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 8px;
            letter-spacing: -0.025em;
        }
        .title {
            font-size: 32px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 8px;
            line-height: 1.2;
            letter-spacing: -0.025em;
        }
        .subtitle {
            color: #64748b;
            font-size: 16px;
            margin-bottom: 0;
        }
        .content {
            margin: 32px 0;
        }
        .description {
            color: #475569;
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 32px;
        }
        .button-container {
            text-align: center;
            margin: 40px 0;
        }
        .verify-button {
            display: inline-block;
            background: #0f172a;
            color: #ffffff;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.2s ease;
            border: 1px solid #0f172a;
        }
        .verify-button:hover {
            background: #1e293b;
            border-color: #1e293b;
        }
        .alternative-link {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
        }
        .alternative-link p {
            margin: 0 0 12px 0;
            color: #475569;
            font-size: 14px;
        }
        .link-text {
            word-break: break-all;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 12px;
            color: #3730a3;
            background: #ffffff;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        .security-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 32px 0;
            border-radius: 8px;
        }
        .security-notice h4 {
            color: #92400e;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
        }
        .security-notice p {
            color: #a16207;
            font-size: 14px;
            margin: 0;
            line-height: 1.5;
        }
        .footer {
            text-align: center;
            margin-top: 48px;
            padding-top: 32px;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            color: #64748b;
            font-size: 14px;
            margin: 8px 0;
        }
        .footer-links {
            margin-top: 16px;
        }
        .footer-link {
            color: #64748b;
            text-decoration: none;
            font-size: 14px;
            margin: 0 16px;
        }
        .footer-link:hover {
            color: #0f172a;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 32px 24px;
            }
            .title {
                font-size: 28px;
            }
            .verify-button {
                padding: 12px 24px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 Polar SaaS Kit</div>
            <h1 class="title">Verify Your Email</h1>
            <p class="subtitle">Welcome! Please verify your email address to continue</p>
        </div>

        <div class="content">
            <p class="description">
                Thanks for signing up for Polar SaaS Kit! To complete your account setup and start building amazing SaaS applications, please verify your email address by clicking the button below.
            </p>

            <div class="button-container">
                <a href="${verificationUrl}" class="verify-button">
                    Verify Email Address
                </a>
            </div>

            <div class="alternative-link">
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <div class="link-text">${verificationUrl}</div>
            </div>

            <div class="security-notice">
                <h4>🔒 Security Notice</h4>
                <p>This verification link will expire in 15 minutes for your security. If you didn't create an account with us, please ignore this email.</p>
            </div>
        </div>

        <div class="footer">
            <p class="footer-text">Welcome to the future of modern SaaS development!</p>
            <p class="footer-text">Built with Next.js 15, Better Auth, and Polar.sh</p>
            <div class="footer-links">
                <a href="#" class="footer-link">Privacy Policy</a>
                <a href="#" class="footer-link">Terms of Service</a>
                <a href="#" class="footer-link">Support</a>
            </div>
            <p class="footer-text" style="margin-top: 24px;">© 2024 Polar SaaS Kit. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
}

/**
 * Generate modern HTML email template for password reset with link
 * @param resetUrl The password reset URL to include in the email
 * @returns HTML email template with shadcn-style design
 */
function generatePasswordResetHTML(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Polar SaaS Kit</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #020817;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: #ffffff;
            border-radius: 12px;
            padding: 48px 40px;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
            border: 1px solid #e2e8f0;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 8px;
            letter-spacing: -0.025em;
        }
        .title {
            font-size: 32px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 8px;
            line-height: 1.2;
            letter-spacing: -0.025em;
        }
        .subtitle {
            color: #64748b;
            font-size: 16px;
            margin-bottom: 0;
        }
        .content {
            margin: 32px 0;
        }
        .description {
            color: #475569;
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 32px;
        }
        .button-container {
            text-align: center;
            margin: 40px 0;
        }
        .reset-button {
            display: inline-block;
            background: #dc2626;
            color: #ffffff;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.2s ease;
            border: 1px solid #dc2626;
        }
        .reset-button:hover {
            background: #b91c1c;
            border-color: #b91c1c;
        }
        .alternative-link {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
        }
        .alternative-link p {
            margin: 0 0 12px 0;
            color: #475569;
            font-size: 14px;
        }
        .link-text {
            word-break: break-all;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 12px;
            color: #3730a3;
            background: #ffffff;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        .security-notice {
            background: #fef2f2;
            border: 1px solid #ef4444;
            border-left: 4px solid #ef4444;
            padding: 20px;
            margin: 32px 0;
            border-radius: 8px;
        }
        .security-notice h4 {
            color: #991b1b;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
        }
        .security-notice p {
            color: #b91c1c;
            font-size: 14px;
            margin: 0;
            line-height: 1.5;
        }
        .info-notice {
            background: #eff6ff;
            border: 1px solid #3b82f6;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 32px 0;
            border-radius: 8px;
        }
        .info-notice h4 {
            color: #1d4ed8;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
        }
        .info-notice p {
            color: #1e40af;
            font-size: 14px;
            margin: 0;
            line-height: 1.5;
        }
        .footer {
            text-align: center;
            margin-top: 48px;
            padding-top: 32px;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            color: #64748b;
            font-size: 14px;
            margin: 8px 0;
        }
        .footer-links {
            margin-top: 16px;
        }
        .footer-link {
            color: #64748b;
            text-decoration: none;
            font-size: 14px;
            margin: 0 16px;
        }
        .footer-link:hover {
            color: #0f172a;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 32px 24px;
            }
            .title {
                font-size: 28px;
            }
            .reset-button {
                padding: 12px 24px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 Polar SaaS Kit</div>
            <h1 class="title">Reset Your Password</h1>
            <p class="subtitle">We received a request to reset your password</p>
        </div>

        <div class="content">
            <p class="description">
                Someone (hopefully you!) requested a password reset for your Polar SaaS Kit account. If this was you, click the button below to reset your password and regain access to your account.
            </p>

            <div class="button-container">
                <a href="${resetUrl}" class="reset-button">
                    Reset My Password
                </a>
            </div>

            <div class="alternative-link">
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <div class="link-text">${resetUrl}</div>
            </div>

            <div class="info-notice">
                <h4>⏱️ Time Limit</h4>
                <p>This password reset link will expire in 5 minutes for your security. After that, you'll need to request a new reset link.</p>
            </div>

            <div class="security-notice">
                <h4>🔒 Security Notice</h4>
                <p>If you didn't request a password reset, please ignore this email. Your account remains secure and no changes have been made.</p>
            </div>
        </div>

        <div class="footer">
            <p class="footer-text">Need help? Contact our support team for assistance.</p>
            <div class="footer-links">
                <a href="#" class="footer-link">Privacy Policy</a>
                <a href="#" class="footer-link">Terms of Service</a>
                <a href="#" class="footer-link">Support</a>
            </div>
            <p class="footer-text" style="margin-top: 24px;">© 2024 Polar SaaS Kit. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
}

/**
 * Send email verification link as transactional email
 * @param email User's email address
 * @param verificationUrl The verification URL containing the token
 * @returns Promise<PlunkResponse> Success/failure result with error details
 */
export async function sendEmailVerificationLink(
  email: string,
  verificationUrl: string,
): Promise<PlunkResponse> {
  try {
    console.log(`Sending email verification link to ${email}`);
    const plunk = getPlunkClient();

    const result = await plunk.sendEmail({
      to: email,
      subject: "Verify Your Email - Polar SaaS Kit",
      body: generateEmailVerificationHTML(verificationUrl),
      type: "html",
      from: "noreply@prosamik.in",
      name: "Polar SaaS Kit",
      subscribed: false, // Email verification emails don't affect subscription status
    });

    if (result.success) {
      console.log(`Email verification link sent successfully to ${email}`);
    } else {
      console.error(
        `Failed to send email verification link to ${email}:`,
        result.error,
      );
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Failed to send email verification link to ${email}:`,
      errorMessage,
    );
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send password reset link as transactional email
 * @param email User's email address
 * @param resetUrl The password reset URL containing the token
 * @returns Promise<PlunkResponse> Success/failure result with error details
 */
export async function sendPasswordResetLink(
  email: string,
  resetUrl: string,
): Promise<PlunkResponse> {
  try {
    console.log(`Sending password reset link to ${email}`);
    const plunk = getPlunkClient();

    const result = await plunk.sendEmail({
      to: email,
      subject: "Reset Your Password - Polar SaaS Kit",
      body: generatePasswordResetHTML(resetUrl),
      type: "html",
      from: "noreply@prosamik.in",
      name: "Polar SaaS Kit",
      subscribed: false, // Password reset emails don't affect subscription status
    });

    if (result.success) {
      console.log(`Password reset link sent successfully to ${email}`);
    } else {
      console.error(
        `Failed to send password reset link to ${email}:`,
        result.error,
      );
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Failed to send password reset link to ${email}:`,
      errorMessage,
    );
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Track user signup event for analytics
 * @param email User's email address
 * @param fullName User's full name (optional)
 * @returns Promise<PlunkResponse> Success/failure result with error details
 */
export async function trackUserSignup(
  email: string,
  fullName?: string,
): Promise<PlunkResponse> {
  try {
    console.log(`Tracking user signup for ${email}`);
    const plunk = getPlunkClient();

    const result = await plunk.trackEvent({
      event: "user-signup",
      email: email,
      subscribed: true, // New users are subscribed by default
      data: fullName
        ? {
            fullName: fullName,
          }
        : {},
    });

    if (result.success) {
      console.log(`User signup tracked successfully for ${email}`);
    } else {
      console.error(
        `Failed to track user signup for ${email}:`,
        result.error,
      );
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Failed to track user signup for ${email}:`,
      errorMessage,
    );
    return {
      success: false,
      error: errorMessage,
    };
  }
}

 