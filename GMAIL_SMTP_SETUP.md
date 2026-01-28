# Gmail SMTP Email Verification Setup Guide

This guide explains how to configure Gmail SMTP for email verification in the LearnLoop backend.

## Overview

The email verification system uses Gmail SMTP to send verification emails to users upon registration. The system is modular and can be easily replaced with other email services like SendGrid, AWS SES, or Resend in the future.

## Features

- ✅ Secure token hashing (SHA-256)
- ✅ 15-minute token expiration
- ✅ One active token per user
- ✅ Responsive HTML email templates
- ✅ Mobile-first design
- ✅ Graceful error handling
- ✅ Console fallback for development
- ✅ Login blocked until email verified

## Gmail SMTP Configuration

### Step 1: Enable 2-Step Verification

1. Go to your Google Account: https://myaccount.google.com/security
2. Navigate to "2-Step Verification"
3. Follow the prompts to enable it if not already enabled

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other" as the device and enter "LearnLoop Backend"
4. Click "Generate"
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 3: Configure Environment Variables

Create a `.env` file in the project root (or update your existing one):

```bash
# Gmail SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-16-char-app-password"
SMTP_FROM_NAME="Cool Shot Systems"
SMTP_FROM_EMAIL="your-email@gmail.com"

# Frontend URL for verification links
FRONTEND_URL="http://localhost:3000"

# Required for Prisma and JWT
DATABASE_URL="postgresql://user:password@localhost:5432/learnloop?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
```

**Important:** Never commit the `.env` file to version control. It's already in `.gitignore`.

## Email Verification Flow

### 1. User Registration

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "message": "Verification email sent. Please check your inbox.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "emailVerified": false,
    "isVerified": false
  }
}
```

**What happens:**
- User account created with `emailVerified: false`
- Verification token generated (32-byte random hex)
- Token hashed with SHA-256 and stored in database
- Email sent with verification link
- Token expires in 15 minutes

### 2. Email Verification

Users receive an email with a verification link:
```
http://localhost:3000/verify-email?token=abc123...
```

Frontend calls:
```http
GET /api/auth/verify-email?token=abc123...
```

Or:
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "abc123..."
}
```

**Response on success:**
```json
{
  "message": "Email verified successfully"
}
```

**What happens:**
- Token is hashed and looked up in database
- If valid and not expired:
  - User's `emailVerified` set to `true`
  - Token marked as used (`usedAt` timestamp set)
  - Success email sent to user

### 3. Login (Requires Verification)

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**If email not verified:**
```json
{
  "error": "Please verify your email to continue"
}
```
Status: 403 Forbidden

**If email verified:**
```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "emailVerified": true
  }
}
```

### 4. Resend Verification Email

```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verification email sent. Please check your inbox."
}
```

**What happens:**
- Old tokens for user are deleted
- New token generated and sent
- Ensures only one active token per user

## Database Schema

### User Model
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  username      String   @unique
  emailVerified Boolean  @default(false)
  isVerified    Boolean  @default(false)
  // ... other fields
}
```

### VerificationToken Model
```prisma
model VerificationToken {
  id        Int       @id @default(autoincrement())
  userId    String    @db.Uuid
  token     String    @unique  // SHA-256 hashed
  expiresAt DateTime
  usedAt    DateTime? // Set when token is used
  createdAt DateTime  @default(now())
  user      User      @relation(...)
}
```

## Development Mode

If SMTP credentials are not configured, emails are logged to console instead:

```
[Email Service] SMTP not configured - emails will be logged to console

========== EMAIL (Console Mode) ==========
From: Cool Shot Systems
To: user@example.com
Subject: Verify your LearnLoop account
---
Hi johndoe,
...
==========================================
```

This allows development without Gmail configuration.

## Security Features

### Token Hashing
- Plain tokens sent via email (32-byte hex = 64 characters)
- Hashed tokens stored in database (SHA-256)
- If database compromised, attackers can't use tokens

### Token Expiration
- Tokens expire in 15 minutes
- Expired tokens return clear error message
- Users must request new token after expiration

### One Active Token
- Creating new token deletes old ones
- Prevents token accumulation
- Ensures fresh tokens on resend

### Used Token Tracking
- `usedAt` field tracks when token was consumed
- Already-used tokens return "already verified" message
- Prevents token reuse

### Rate Limiting
- All auth endpoints rate-limited: 5 requests per 15 minutes
- Prevents abuse and brute force attacks
- Configured in `src/middleware/rateLimiters.js`

## Email Template

The verification email features:
- **Gradient background** (purple to violet)
- **Centered white card** with rounded corners
- **Gradient button** (purple → blue → teal)
- **Mobile-responsive** design
- **Security disclaimer** and expiry notice
- **Cool Shot Systems** branding

Preview text version:
```
Hi johndoe,

Thank you for registering with LearnLoop!

Please verify your email address by clicking the link below:
http://localhost:3000/verify-email?token=abc123...

This link will expire in 15 minutes.

Best regards,
Cool Shot Systems
The LearnLoop Team
```

## Error Handling

The email service handles errors gracefully:

```javascript
// Email sending never crashes the server
try {
  const result = await sendEmail({ to, subject, text, html });
  if (!result.success) {
    console.error('Failed to send email');
    // Registration continues - user can resend later
  }
} catch (error) {
  console.error('Email error:', error.message);
  // Registration continues - user can resend later
}
```

**Benefits:**
- Server stays up even if SMTP fails
- Users can always request resend
- Errors logged for debugging

## Testing

### Manual Test
```bash
# Start the server
npm start

# In another terminal, run the test script
node test-email-verification.js
```

### Test with Real Email

1. Configure Gmail SMTP in `.env`
2. Register with your real email
3. Check inbox for verification email
4. Click verification link
5. Login should now work

### Test Scenarios Covered

- ✅ Registration creates unverified user
- ✅ Login blocked for unverified users
- ✅ Invalid token rejected
- ✅ Missing token rejected
- ✅ Expired token rejected
- ✅ Resend verification works
- ✅ Already verified user handled gracefully
- ✅ Non-existent email doesn't reveal user existence (security)

## Replacing with Another Email Service

The email service is modular. To switch to SendGrid, AWS SES, or Resend:

### Option 1: Update `src/utils/emailService.js`

Replace the `sendEmail` function with your service's API:

```javascript
import sgMail from '@sendgrid/mail';

export async function sendEmail({ to, subject, text, html }) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  try {
    await sgMail.send({
      to,
      from: process.env.SMTP_FROM_EMAIL,
      subject,
      text,
      html
    });
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    return { success: false, error: error.message };
  }
}
```

### Option 2: Create New Service File

1. Create `src/utils/sendgridService.js`
2. Update imports in `emailVerification.js`
3. Keep both services for A/B testing

## Troubleshooting

### "Can't reach database server"
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run migrations: `npx prisma migrate dev`

### "SMTP connection failed"
- Verify App Password (not regular Gmail password)
- Check 2-Step Verification is enabled
- Ensure `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587`
- Check firewall isn't blocking port 587

### "Token expired"
- Tokens expire in 15 minutes
- Request new verification email
- Check system clock is correct

### Emails not sending
- Check console for errors
- Verify SMTP credentials
- Test with: `node -e "require('./src/utils/emailService.js').verifyConnection()"`

## Production Deployment

### Environment Variables

Set these on your hosting platform (Render, Railway, Vercel):

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME="Cool Shot Systems"
FRONTEND_URL=https://your-app.com
DATABASE_URL=postgresql://...
JWT_SECRET=random-secret-key
NODE_ENV=production
```

### Database Migration

Run migrations on production:
```bash
npx prisma migrate deploy
```

### Monitoring

Monitor email sending:
- Check application logs for email errors
- Set up alerts for failed email sends
- Track verification rates

## Support

For issues or questions:
- Check the troubleshooting section above
- Review error logs in console
- Ensure all environment variables are set correctly

---

**Built with ❤️ by Cool Shot Systems**
