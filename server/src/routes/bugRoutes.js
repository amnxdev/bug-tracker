import express from 'express';
import { getBugs, createBug, updateBug, deleteBug, assignBug, retriage } from '../controllers/bugController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/projects/:projectId/bugs', verifyToken, getBugs);
router.post('/projects/:projectId/bugs', verifyToken, createBug);
router.put('/bugs/:id', verifyToken, updateBug);
router.delete('/bugs/:id', verifyToken, deleteBug);

// Bug assignment (admin assigns to a user)
router.put('/bugs/:id/assign', verifyToken, assignBug);

// On-demand AI re-triage
router.post('/bugs/:id/retriage', verifyToken, retriage);

export default router;