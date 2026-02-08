// # Generic 'sendEmail' function
// src/services/emailService.js
const transporter = require("../config/transporter");

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: `"BiteGo" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html: htmlContent, 
    });
    console.log(` Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error(` Failed to send email to ${to}:`, error.message);
  }
};

module.exports = { sendEmail };