// # Handles Order Placed, Delivered
// src/handlers/orderHandler.js
const { sendEmail } = require("../services/emailService");

const handleOrderEvent = async (event) => {
  const { type, payload } = event;

  switch (type) {
    case "ORDER_PLACED":
      await sendEmail(
        payload.userEmail,
        `Order #${payload.orderId} Placed 🍔`,
        `<h3>Your order is pending!</h3>
         <p>Total: $${payload.amount}</p>
         <p>We are waiting for the restaurant to accept.</p>`
      );
      break;

    case "ORDER_DELIVERED":
      await sendEmail(
        payload.userEmail,
        `Order #${payload.orderId} Delivered 😋`,
        `<h3>Enjoy your meal!</h3>
         <p>Your food has been delivered by ${payload.driverName}.</p>
         <p>Please rate your experience on the app.</p>`
      );
      break;

    default:
      console.log(`⚠️ Unknown Order Event Type: ${type}`);
  }
};

module.exports = handleOrderEvent;