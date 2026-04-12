import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      unique: true, 
    },
    content: {
      type: String,
      default: "<p>Start taking notes...</p>", 
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const Note = mongoose.model("Note", noteSchema);
export default Note;
