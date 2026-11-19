import express from 'express';
import { addComment, getComments, deleteComment } from '../controllers/commentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/bugs/:bugId/comments', verifyToken, addComment);
router.get('/bugs/:bugId/comments', verifyToken, getComments);
router.delete('/bugs/:bugId/comments/:commentId', verifyToken, deleteComment);

export default router;
