// # Handles Login, Register, Verify
// src/handlers/authHandler.js
const { sendEmail } = require("../services/emailService");

const handleAuthEvent = async (event) => {
  const { type, payload } = event;

  switch (type) {
    case "USER_REGISTRATION_INITIATED":
      await sendEmail(
        payload.email,
        "Verify your Email",
        `<h3>Welcome, ${payload.name}!</h3>
         <p>Please click the link below to verify your account:</p>
         <a href="${payload.verificationLink}">Verify Email</a>
         <p>This link expires in 15 minutes.</p>`
      );
      break;

    case "USER_REGISTERED_SUCCESS":
      await sendEmail(
        payload.email,
        "Welcome to Zomato Clone 🎉",
        `<h3>Account Created Successfully!</h3>
         <p>Hi ${payload.name}, you can now order food or manage your restaurant.</p>`
      );
      break;

    case "USER_LOGGED_IN":
      await sendEmail(
        payload.email,
        "Login Alert 🚨",
        `<p>New login detected on your account at ${new Date().toLocaleString()}.</p>`
      );
      break;

    // FORGOT PASSWORD FLOW 
    case "RESET_PASSWORD_INITIATED":
      await sendEmail(
        payload.email,
        "Reset Your Password 🔐",
        `<h3>Password Reset Request</h3>
         <p>We received a request to reset your password.</p>
         <p>Click the link below to set a new password:</p>
         <a href="${payload.verificationLink}">Reset Password</a>
         <p>This link expires in 15 minutes.</p>
         <p>If you did not request this, you can safely ignore this email.</p>`
      );
      break;

    case "PASSWORD_RESET_SUCCESS":
      await sendEmail(
        payload.email,
        "Password Changed Successfully ",
        `<h3>Your password has been updated</h3>
         <p>This is a confirmation that your account password was changed successfully.</p>
         <p>If this wasn't you, please contact support immediately.</p>`
      );
      break;

    //DEFAULT
    default:
      console.log(` Unknown Auth Event Type: ${type}`);
  }
};





module.exports = handleAuthEvent;