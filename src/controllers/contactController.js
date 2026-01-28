/**
 * Contact Form Controller
 * 
 * Handles contact form submissions via email.
 */

import nodemailer from 'nodemailer';

/**
 * Submit contact form
 * 
 * POST /api/contact
 * 
 * Body:
 * - name: string (required)
 * - email: string (required, valid email format)
 * - subject: string (required)
 * - message: string (required)
 * 
 * Sends email to CONTACT_EMAIL_TO address.
 * Does not store messages in database.
 */
export async function submitContactForm(req, res) {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'All fields (name, email, subject, message) are required'
      });
    }

    // Trim inputs
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    // Validate non-empty after trimming
    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'All fields must contain non-empty values'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    // Check for CONTACT_EMAIL_TO environment variable
    const contactEmailTo = process.env.CONTACT_EMAIL_TO;
    if (!contactEmailTo) {
      console.error('CONTACT_EMAIL_TO environment variable not set');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Contact form is not properly configured. Please try again later.'
      });
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Email options
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: contactEmailTo,
      subject: `[LearnLoop Contact] ${trimmedSubject}`,
      text: `Name: ${trimmedName}\nEmail: ${trimmedEmail}\n\nMessage:\n${trimmedMessage}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Name:</strong> ${trimmedName}</p>
            <p><strong>Email:</strong> ${trimmedEmail}</p>
          </div>
          <div style="background-color: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <h3 style="color: #555; margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap;">${trimmedMessage}</p>
          </div>
        </div>
      `
    };

    // Send email
    try {
      await transporter.sendMail(mailOptions);
      
      res.status(200).json({
        success: true,
        message: 'Your message has been sent successfully. We will get back to you soon.'
      });
    } catch (emailError) {
      console.error('Error sending contact form email:', emailError);
      
      return res.status(500).json({
        error: 'Email sending failed',
        message: 'Unable to send your message at this time. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
}
