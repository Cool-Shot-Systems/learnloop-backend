/**
 * Email Verification Utilities
 * 
 * Provides token generation and email sending functionality for email verification.
 * For development/testing, emails are logged to console instead of being sent.
 */

import crypto from 'crypto';
import { sendEmail } from './emailService.js';

/**
 * Hash a token using SHA-256
 * 
 * @param {string} token - Plain text token
 * @returns {string} Hashed token
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a secure random verification token
 * 
 * @returns {string} A 32-character hexadecimal token
 */
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate token expiration time
 * 
 * @param {number} minutes - Minutes until expiration (default: 15)
 * @returns {Date} Expiration timestamp
 */
export function getTokenExpiration(minutes = 15) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  return expiresAt;
}

/**
 * Check if a token has expired
 * 
 * @param {Date} expiresAt - Token expiration timestamp
 * @returns {boolean} True if token has expired
 */
export function isTokenExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

/**
 * Send verification email
 * 
 * Sends email with verification link via SMTP or logs to console if not configured.
 * 
 * @param {string} email - Recipient email address
 * @param {string} username - User's username
 * @param {string} token - Verification token
 * @returns {Promise<boolean>} True if email was sent successfully
 */
export async function sendVerificationEmail(email, username, token) {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const subject = 'Verify your LearnLoop account';
  
  // Plain text version
  const text = `Hi ${username},

Thank you for registering with LearnLoop!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 15 minutes.

If you did not create an account, please ignore this email.

Best regards,
Cool Shot Systems
The LearnLoop Team`;

  // HTML version - Responsive mobile-first design
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Verify your LearnLoop account</title>
      <!--[if mso]>
      <style type="text/css">
        body, table, td {font-family: Arial, sans-serif !important;}
      </style>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <!-- Wrapper table for email client compatibility -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
        <tr>
          <td style="padding: 40px 20px;" align="center">
            <!-- Main content card -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 48px 40px;">
                  <!-- Logo/Brand section -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-bottom: 32px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 64px; height: 64px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                          <span style="color: white; font-size: 32px; font-weight: bold;">L</span>
                        </div>
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                          Welcome to LearnLoop!
                        </h1>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #718096;">
                          by Cool Shot Systems
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Greeting -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="padding: 24px 0;">
                        <p style="margin: 0 0 16px 0; font-size: 16px; color: #2d3748; line-height: 1.6;">
                          Hi <strong>${username}</strong>,
                        </p>
                        <p style="margin: 0 0 16px 0; font-size: 16px; color: #2d3748; line-height: 1.6;">
                          Thank you for joining our learning community! We're excited to have you on board.
                        </p>
                        <p style="margin: 0 0 24px 0; font-size: 16px; color: #2d3748; line-height: 1.6;">
                          To get started, please verify your email address by clicking the button below:
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 16px 0 32px 0;">
                        <a href="${verificationUrl}" 
                           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #4299e1 50%, #38b2ac 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                          Verify my email
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Alternative link -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="padding: 0 0 24px 0; border-bottom: 1px solid #e2e8f0;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #718096; line-height: 1.5;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #4299e1; word-break: break-all; line-height: 1.5;">
                          ${verificationUrl}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Expiry notice -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="padding: 24px 0; background: #fef5e7; border-radius: 8px; margin-top: 24px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td align="center" style="padding: 0 20px;">
                              <p style="margin: 0; font-size: 14px; color: #975a16; line-height: 1.5;">
                                <span style="font-size: 18px;">⏱️</span> <strong>Important:</strong> This verification link will expire in <strong>15 minutes</strong>.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Security disclaimer -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="padding: 24px 0 0 0;">
                        <p style="margin: 0 0 12px 0; font-size: 14px; color: #718096; line-height: 1.5;">
                          <span style="font-size: 16px;">🔒</span> <strong>Security Notice:</strong>
                        </p>
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #718096; line-height: 1.5;">
                          • If you didn't create a LearnLoop account, please ignore this email.
                        </p>
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #718096; line-height: 1.5;">
                          • Never share this verification link with anyone.
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #718096; line-height: 1.5;">
                          • This link is for one-time use only and will be invalidated after verification.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Footer -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="padding: 32px 0 0 0; border-top: 1px solid #e2e8f0; margin-top: 32px;">
                        <p style="margin: 16px 0 0 0; font-size: 14px; color: #4a5568; line-height: 1.5;">
                          Best regards,<br>
                          <strong>Cool Shot Systems</strong><br>
                          <span style="color: #718096;">The LearnLoop Team</span>
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Company info -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 24px 0 0 0;">
                        <p style="margin: 0; font-size: 12px; color: #a0aec0; line-height: 1.5;">
                          © ${new Date().getFullYear()} Cool Shot Systems. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Mobile optimization note -->
            <!--[if mso]>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
              <tr>
                <td style="padding: 20px 0;">
                  <p style="font-size: 12px; color: #ffffff; text-align: center;">
                    Best viewed in mobile email clients
                  </p>
                </td>
              </tr>
            </table>
            <![endif]-->
          </td>
        </tr>
      </table>

      <!-- Mobile-specific styles -->
      <style type="text/css">
        @media only screen and (max-width: 600px) {
          .content-wrapper {
            padding: 24px !important;
          }
          h1 {
            font-size: 24px !important;
          }
          .button {
            padding: 14px 32px !important;
            font-size: 15px !important;
          }
        }
      </style>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({ to: email, subject, text, html });
    
    if (!result.success) {
      console.error(`[Email Verification] Failed to send verification email to ${email}`);
      // Don't throw error - allow registration to continue even if email fails
    }
    
    return result.success;
  } catch (error) {
    console.error('[Email Verification] Error sending verification email:', error.message);
    // Don't throw error - allow registration to continue even if email fails
    return false;
  }
}

/**
 * Send verification success email
 * 
 * Notifies user that their email has been verified.
 * 
 * @param {string} email - Recipient email address
 * @param {string} username - User's username
 * @returns {Promise<boolean>} True if email was sent successfully
 */
export async function sendVerificationSuccessEmail(email, username) {
  const subject = 'Email verified successfully';
  
  // Plain text version
  const text = `Hi ${username},

Your email address has been verified successfully!

You can now access all features of LearnLoop. Start exploring, learning, and connecting with our community.

Best regards,
Cool Shot Systems
The LearnLoop Team`;

  // HTML version
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verified</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin: 20px 0;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 48px;">✅</span>
        </div>
        
        <h2 style="color: #2c3e50; text-align: center; margin-top: 0;">Email Verified!</h2>
        
        <p>Hi ${username},</p>
        
        <p>Great news! Your email address has been verified successfully.</p>
        
        <p>You can now access all features of LearnLoop, including:</p>
        <ul style="color: #555;">
          <li>Creating and sharing posts</li>
          <li>Commenting and engaging with the community</li>
          <li>Saving your favorite content</li>
          <li>And much more!</li>
        </ul>
        
        <p>Start exploring, learning, and connecting with our community today.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #999;">
          Best regards,<br>
          <strong>Cool Shot Systems</strong><br>
          The LearnLoop Team
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({ to: email, subject, text, html });
    
    if (!result.success) {
      console.error(`[Email Verification] Failed to send success email to ${email}`);
      // Don't throw error - verification is already complete
    }
    
    return result.success;
  } catch (error) {
    console.error('[Email Verification] Error sending success email:', error.message);
    // Don't throw error - verification is already complete
    return false;
  }
}
