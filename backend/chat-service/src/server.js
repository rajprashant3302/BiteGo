require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");



const chatRoutes = require("./routes/chatRoutes");
const initSocket = require("./socket/chatSocket");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());
app.use("/api/chat", chatRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

initSocket(io);

const PORT = process.env.PORT || 5005;

server.listen(PORT, () => {
  console.log(`Chat Service running on port ${PORT}`);
});