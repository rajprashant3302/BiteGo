const Message = require("../models/Message");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", (chatId) => {
      socket.join(chatId);
    });

    socket.on("sendMessage", async (data) => {
      const { chatId, senderId, receiverId, message } = data;

      const newMessage = await Message.create({
        chatId,
        senderId,
        receiverId,
        message
      });

      io.to(chatId).emit("receiveMessage", newMessage);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};