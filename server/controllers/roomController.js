import Room from "../models/Room.js";

// @desc    Create a new room
// @route   POST /api/rooms
export const createRoom = async (req, res) => {
  try {
    const { name, topic, isPrivate, accessCode } = req.body;

    const room = await Room.create({
      name,
      topic,
      createdBy: req.user._id,
      members: [req.user._id],
      isPrivate: isPrivate || false,
      accessCode: isPrivate ? accessCode : "",
    });

    res.status(201).json(room);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create room", error: error.message });
  }
};

// @desc    Get all public rooms
// @route   GET /api/rooms
export const getPublicRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate("createdBy", "name avatar")
      .populate("members", "name avatar")
      .sort({ createdAt: -1 });

    res.json(rooms);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch rooms", error: error.message });
  }
};

// @desc    Join a room (handles both public and private logic)
// @route   POST /api/rooms/:id/join
export const joinRoom = async (req, res) => {
  try {
    const { accessCode } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.isPrivate && room.accessCode !== accessCode) {
      return res.status(401).json({ message: "Invalid access code" });
    }

    if (room.members.includes(req.user._id)) {
      return res.status(400).json({ message: "You are already in this room" });
    }

    room.members.push(req.user._id);
    await room.save();

    res.json({ message: "Successfully joined the room", room });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to join room", error: error.message });
  }
};
