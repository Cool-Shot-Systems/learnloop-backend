/**
 * Email Verification Utilities
 * 
 * Provides token generation and email sending functionality for email verification.
 * For development/testing, emails are logged to console instead of being sent.
 */

import crypto from 'crypto';
import { sendEmail } from './emailService.js';

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
 * @param {number} hours - Hours until expiration (default: 24)
 * @returns {Date} Expiration timestamp
 */
export function getTokenExpiration(hours = 24) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);
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

This link will expire in 24 hours.

If you did not create an account, please ignore this email.

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
      <title>Verify your email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin: 20px 0;">
        <h2 style="color: #2c3e50; margin-top: 0;">Welcome to LearnLoop!</h2>
        
        <p>Hi ${username},</p>
        
        <p>Thank you for registering with LearnLoop! We're excited to have you join our learning community.</p>
        
        <p>Please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #999; word-break: break-all;">${verificationUrl}</p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          <strong>⏱️ This link will expire in 24 hours.</strong>
        </p>
        
        <p style="font-size: 14px; color: #666;">
          If you did not create an account, please ignore this email.
        </p>
        
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
