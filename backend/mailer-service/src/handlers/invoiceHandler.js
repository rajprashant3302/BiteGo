// # Handles Invoice Generation
// src/handlers/invoiceHandler.js
const { sendEmail } = require("../services/emailService");

const handleInvoiceEvent = async (event) => {
  const { type, payload } = event;

  if (type === "INVOICE_GENERATED") {
    await sendEmail(
      payload.userEmail,
      `Invoice for Order #${payload.orderId} 🧾`,
      `<h3>Payment Receipt</h3>
       <p>Thank you for your order.</p>
       <p>You can download your invoice here: <a href="${payload.pdfUrl}">Download PDF</a></p>`
    );
  }
};

module.exports = handleInvoiceEvent;