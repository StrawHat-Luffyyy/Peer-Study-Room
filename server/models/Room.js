import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
      }
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    accessCode: {
      type: String,
      default: '', 
    },
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);
export default Room;