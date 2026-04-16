import Message from "../models/Message.js";

const roomUsers = {};

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on("join-room", (roomId, user) => {
      socket.join(roomId);
      console.log(`User ${user._id} joined room: ${roomId}`);
      
      if (!roomUsers[roomId]) roomUsers[roomId] = [];
      const userIndex = roomUsers[roomId].findIndex((u) => u._id === user._id);
      if (userIndex === -1) {
        roomUsers[roomId].push({ ...user, socketId: socket.id });
      } else {
        roomUsers[roomId][userIndex].socketId = socket.id;
      }
      
      io.to(roomId).emit("room-users-update", roomUsers[roomId]);

      socket
        .to(roomId)
        .emit("user-joined", { userId: user._id, message: "A user joined the room" });
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
    socket.on("typing", ({ roomId, userName }) => {
      socket.to(roomId).emit("user-typing", userName);
    });

    socket.on("stop-typing", ({ roomId }) => {
      socket.to(roomId).emit("user-stopped-typing");
    });

    socket.on("leave-room", (roomId, userId) => {
      socket.leave(roomId);
      
      if (roomUsers[roomId]) {
        roomUsers[roomId] = roomUsers[roomId].filter((u) => u._id !== userId);
        io.to(roomId).emit("room-users-update", roomUsers[roomId]);
      }

      socket
        .to(roomId)
        .emit("user-left", { userId, message: "A user left the room" });
    });
    
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Clean up user from global roster if they disconnect abruptly
      for (const roomId in roomUsers) {
        const index = roomUsers[roomId].findIndex(u => u.socketId === socket.id);
        if (index !== -1) {
           roomUsers[roomId].splice(index, 1);
           io.to(roomId).emit("room-users-update", roomUsers[roomId]);
        }
      }
    });
  });
};
export default chatSocket;
