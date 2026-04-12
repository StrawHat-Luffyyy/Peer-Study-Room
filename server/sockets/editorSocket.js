import Note from "../models/Note.js";

const editorSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("send-changes", async (data) => {
      const { roomId, content, userId } = data;

      socket.to(roomId).emit("receive-changes", content);
    });

    socket.on("save-document", async (data) => {
      const { roomId, content, userId } = data;
      try {
        await Note.findOneAndUpdate(
          { roomId },
          { content, lastUpdatedBy: userId },
          { upsert: true, new: true },
        );
      } catch (error) {
        console.error("Failed to save document:", error);
      }
    });
  });
};

export default editorSocket;
