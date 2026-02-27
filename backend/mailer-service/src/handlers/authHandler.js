// # Handles Login, Register, Verify
const { sendEmail } = require("../services/emailService");

const handleAuthEvent = async (event) => {
  const { type, payload } = event;

  const containerStyle = "font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 24px; line-height: 1.6; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px;";
  const btnStyle = "display: inline-block; padding: 14px 28px; background-color: #FF651D; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px; margin-bottom: 16px; text-align: center;";
  const footerStyle = "font-size: 13px; color: #888; margin-top: 32px; border-top: 1px solid #eaeaea; padding-top: 16px;";

  switch (type) {
    case "USER_REGISTRATION_INITIATED":
      await sendEmail(
        payload.email,
        "Verify your email for BiteGo 🍔",
        `<div style="${containerStyle}">
          <h2 style="color: #111; margin-bottom: 16px;">Welcome to BiteGo, ${payload.name}!</h2>
          <p>We're thrilled to have you. To start exploring the best local restaurants and getting your favorite food delivered hot to your door, we just need to verify your email address.</p>
          <a href="${payload.verificationLink}" style="${btnStyle}">Verify My Email</a>
          <div style="${footerStyle}">
            <p>This secure link will expire in 15 minutes.</p>
            <p>If you didn't create an account with BiteGo, you can safely ignore this email.</p>
          </div>
        </div>`
      );
      break;

    case "USER_REGISTERED_SUCCESS":
      await sendEmail(
        payload.email,
        "Welcome to BiteGo! 🎉",
        `<div style="${containerStyle}">
          <h2 style="color: #111; margin-bottom: 16px;">You're all set, ${payload.name}!</h2>
          <p>Your BiteGo account has been successfully verified.</p>
          <p>Whether you're craving a late-night snack, a healthy lunch, or managing your own restaurant menu, we've got you covered.</p>
          <p style="margin-top: 24px;"><strong>Hungry?</strong> Open the app and order your first meal now!</p>
          <div style="${footerStyle}">
            <p>Thank you for choosing BiteGo.</p>
          </div>
        </div>`
      );
      break;

    case "USER_LOGGED_IN":
      await sendEmail(
        payload.email,
        "New login to your BiteGo account",
        `<div style="${containerStyle}">
          <h2 style="color: #111; margin-bottom: 16px;">Security Alert 🚨</h2>
          <p>Hi there,</p>
          <p>We noticed a new login to your BiteGo account on <strong>${new Date().toLocaleString()}</strong>.</p>
          <p>If this was you, you're good to go! No further action is required.</p>
          <div style="${footerStyle}">
            <p style="color: #d93025; font-weight: 600;">If you did not authorize this login, please reset your password immediately to secure your account.</p>
          </div>
        </div>`
      );
      break;

    // FORGOT PASSWORD FLOW 
    case "RESET_PASSWORD_INITIATED":
      await sendEmail(
        payload.email,
        "Reset your BiteGo password 🔐",
        `<div style="${containerStyle}">
          <h2 style="color: #111; margin-bottom: 16px;">Password Reset Request</h2>
          <p>Hi there,</p>
          <p>It happens to the best of us! We received a request to reset the password for your BiteGo account.</p>
          <a href="${payload.verificationLink}" style="${btnStyle}">Reset My Password</a>
          <div style="${footerStyle}">
            <p>This secure link will expire in 15 minutes.</p>
            <p>If you didn't request a password reset, your account is safe and you can safely ignore this email.</p>
          </div>
        </div>`
      );
      break;

    case "PASSWORD_RESET_SUCCESS":
      await sendEmail(
        payload.email,
        "Your BiteGo password has been updated ✅",
        `<div style="${containerStyle}">
          <h2 style="color: #111; margin-bottom: 16px;">Password Updated!</h2>
          <p>Hi there,</p>
          <p>This is a quick confirmation that the password for your BiteGo account has been successfully changed.</p>
          <p>You can now log in using your new credentials to continue ordering.</p>
          <div style="${footerStyle}">
            <p>If you did not make this change, please contact our support team immediately.</p>
          </div>
        </div>`
      );
      break;

    // DEFAULT
    default:
      console.log(`❌ Unknown Auth Event Type: ${type}`);
  }
};

module.exports = handleAuthEvent;