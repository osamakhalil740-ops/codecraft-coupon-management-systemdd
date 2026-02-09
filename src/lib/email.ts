import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors when env vars are not set
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@kobonz.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const verificationUrl = `${APP_URL}/auth/verify-email?token=${token}`;

  await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Verify your Kobonz account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Kobonz</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to Kobonz, ${name}!</h2>
            
            <p>Thank you for signing up. Please verify your email address to activate your account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will expire in 24 hours. If you didn't create an account with Kobonz, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kobonz. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

  await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset your Kobonz password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Kobonz</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            
            <p>Hi ${name},</p>
            
            <p>We received a request to reset your password for your Kobonz account. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kobonz. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * Send welcome email (after verification)
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Welcome to Kobonz!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Kobonz</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Kobonz!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
            
            <p>Your account has been successfully verified! You're now part of the Kobonz community.</p>
            
            <h3 style="color: #667eea;">What's Next?</h3>
            
            <ul style="line-height: 2;">
              <li>🔍 Browse amazing deals from local stores</li>
              <li>💰 Save money with exclusive coupons</li>
              <li>⭐ Save your favorite deals</li>
              <li>📱 Get personalized recommendations</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/marketplace" 
                 style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Start Exploring Deals
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Need help? Visit our <a href="${APP_URL}/help" style="color: #667eea;">Help Center</a> or contact our support team.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kobonz. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * Send password changed notification
 */
export async function sendPasswordChangedEmail(email: string, name: string): Promise<void> {
  await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Your Kobonz password has been changed',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Kobonz</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Changed Successfully</h2>
            
            <p>Hi ${name},</p>
            
            <p>This is a confirmation that your password has been changed successfully.</p>
            
            <p style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <strong>⚠️ Security Notice:</strong><br>
              If you didn't make this change, please contact our support team immediately.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/support" 
                 style="background: #dc3545; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Report Unauthorized Access
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Kobonz. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  });
}
