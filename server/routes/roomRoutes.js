import express from 'express';
import { createRoom, getPublicRooms, joinRoom , getRoomMessages, getRoomNote } from '../controllers/roomController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply the protect middleware to all room routes
router.route('/')
  .get(authMiddleware, getPublicRooms)
  .post(authMiddleware, createRoom);

router.post('/:id/join', authMiddleware, joinRoom);
router.get('/:id/messages', authMiddleware, getRoomMessages);
router.get('/:id/note', authMiddleware, getRoomNote);
export default router;