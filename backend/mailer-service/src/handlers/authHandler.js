const { sendEmail } = require("../services/emailService");

const ADMIN_URL = process.env.ADMIN_FRONTEND_URL || "http://localhost";

// Standardized Styles for BiteGo Emails
const containerStyle = "font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 24px; line-height: 1.6; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px;";
const btnStyle = "display: inline-block; padding: 14px 28px; background-color: #FF651D; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px; margin-bottom: 16px; text-align: center;";
const footerStyle = "font-size: 13px; color: #888; margin-top: 32px; border-top: 1px solid #eaeaea; padding-top: 16px;";
const badgeStyle = "background: #FFF0E6; color: #FF651D; padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: 600; text-transform: uppercase;";

/**
 * Handles Auth Events (Registration, Login, Password Resets)
 */
const handleAuthEvent = async (event) => {
  const { type, payload } = event;

  let subject = "";
  let html = "";

  switch (type) {
    case "USER_REGISTRATION_INITIATED":
      subject = "Verify your email for BiteGo 🍔";
      html = `<div style="${containerStyle}">
          <h2 style="color: #111; margin-bottom: 16px;">Welcome to BiteGo, ${payload.name}!</h2>
          <p>We're thrilled to have you. To start exploring the best local restaurants, we just need to verify your email address.</p>
          <a href="${payload.verificationLink}" style="${btnStyle}">Verify My Email</a>
          <div style="${footerStyle}">
            <p>This secure link will expire in 15 minutes.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </div>`;
      break;

    case "USER_REGISTERED_SUCCESS":
      subject = "Welcome to BiteGo! 🎉";
      html = `<div style="${containerStyle}">
          <h2 style="color: #111; margin-bottom: 16px;">You're all set, ${payload.name}!</h2>
          <p>Your BiteGo account has been successfully verified.</p>
          <p>Hungry? Open the app and order your first meal now!</p>
          <div style="${footerStyle}">
            <p>Thank you for choosing BiteGo.</p>
          </div>
        </div>`;
      break;

    case "USER_LOGGED_IN":
      subject = "New login to your BiteGo account";
      html = `<div style="${containerStyle}">
          <h2 style="color: #111; margin-bottom: 16px;">Security Alert 🚨</h2>
          <p>We noticed a new login to your BiteGo account on <strong>${new Date().toLocaleString()}</strong>.</p>
          <div style="${footerStyle}">
            <p style="color: #d93025; font-weight: 600;">If you did not authorize this, please reset your password immediately.</p>
          </div>
        </div>`;
      break;

    case "RESET_PASSWORD_INITIATED":
      subject = "Reset your BiteGo password 🔐";
      html = `<div style="${containerStyle}">
          <h2 style="color: #111; margin-bottom: 16px;">Password Reset Request</h2>
          <a href="${payload.verificationLink}" style="${btnStyle}">Reset My Password</a>
          <div style="${footerStyle}">
            <p>This secure link will expire in 15 minutes.</p>
          </div>
        </div>`;
      break;

    case "PASSWORD_RESET_SUCCESS":
      subject = "Your BiteGo password has been updated ✅";
      html = `<div style="${containerStyle}">
          <h2 style="color: #111; margin-bottom: 16px;">Password Updated!</h2>
          <p>Your password has been successfully changed. You can now log in with your new credentials.</p>
        </div>`;
      break;

    // Add this inside your switch (type) block in handleAuthEvent:
    case "ADMIN_INVITE_INITIATED":
      subject = "You're invited — Join BiteGo! 🎉";
      html = `<div style="${containerStyle}">
          <h2 style="color: #111; margin-top:0">You've been invited to BiteGo!</h2>
          <p>An admin has invited you to join the platform with the following role:</p>
          <p><span style="${badgeStyle}">${payload.role}</span></p>
          <p>Click the button below to complete your profile and set your password.</p>
          <a href="${payload.verificationLink}" style="${btnStyle}">Accept Invitation</a>
          <p style="margin-top:24px; font-size:13px; color:#6B7280;">
            This link expires in <strong>48 hours</strong>.
          </p>
          <div style="${footerStyle}">
            <p>If the button doesn't work, copy this link:<br/>${payload.verificationLink}</p>
          </div>
        </div>`;
      break;

    default:
      console.log(`❌ Unknown Auth Event Type: ${type}`);
      return;
  }

  console.log(payload.email)
  console.log(subject)

  await sendEmail( payload.email, subject, html );
};



module.exports = {
  handleAuthEvent
};