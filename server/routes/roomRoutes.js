import express from 'express';
import { createRoom, getPublicRooms, getRoomById, joinRoom , getRoomMessages, getRoomNote } from '../controllers/roomController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getPublicRooms);
router.post('/', authMiddleware, createRoom);

router.get('/:id', authMiddleware, getRoomById);
router.post('/:id/join', authMiddleware, joinRoom);
router.get('/:id/messages', authMiddleware, getRoomMessages);
router.get('/:id/note', authMiddleware, getRoomNote);
export default router;