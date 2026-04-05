import Message from "../models/Message.js";

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on("join-room", (roomId, userId) => {
      socket.join(roomId);
      console.log(`User ${userId} joined room: ${roomId}`);

      socket
        .to(roomId)
        .emit("user-joined", { userId, message: "A user joined the room" });
    });
    socket.on("send-message", async (data) => {
      const { roomId, senderId, text } = data;
      try {
        const newMessage = await Message.create({ roomId, senderId, text });
        await newMessage.populate("senderId", "name avatar");
        io.to(roomId).emit("receive-message", newMessage);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });
    socket.on("leave-room", (roomId, userId) => {
      socket.leave(roomId);
      socket
        .to(roomId)
        .emit("user-left", { userId, message: "A user left the room" });
    });
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
export default chatSocket;
