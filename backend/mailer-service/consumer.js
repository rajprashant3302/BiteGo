require("dotenv").config();
const { Kafka } = require("kafkajs");
const nodemailer = require("nodemailer");
const { handleSendInviteEmail } = require("./src/handlers/authHandler");

const kafka = new Kafka({
  clientId: "mailer-service",
  brokers: ["kafka:9092"]
});

const consumer = kafka.consumer({ groupId: "mailer-group" });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const sendMail = async (to, subject, text) => {
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    text
  });
};

const start = async () => {
  await consumer.connect();
  
  // Subscribe to both topics
  await consumer.subscribe({ topic: "auth-events", fromBeginning: true });
  await consumer.subscribe({ topic: "send-invite-email", fromBeginning: true });

  console.log("Mailer Service Listening...");

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const payloadString = message.value.toString();
      const data = JSON.parse(payloadString);

      // Handle auth-events topic
      if (topic === "auth-events") {
        const event = data;

        if (event.type === "USER_REGISTERED") {
          await sendMail(
            event.payload.email,
            "Welcome 🎉",
            "Your account has been created successfully!"
          );
        }

        if (event.type === "USER_LOGGED_IN") {
          await sendMail(
            event.payload.email,
            "Login Alert",
            "You just logged in to your account."
          );
        }
      }

      // Handle send-invite-email topic
      if (topic === "send-invite-email") {
        await handleSendInviteEmail(data);
      }
    }
  });
};

start();