require("dotenv").config();
const { Kafka } = require("kafkajs");
const nodemailer = require("nodemailer");

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
  await consumer.subscribe({ topic: "auth-events", fromBeginning: true });

  console.log("Mailer Service Listening...");

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());

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
  });
};

start();
