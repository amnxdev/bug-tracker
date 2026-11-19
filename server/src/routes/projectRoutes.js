import express from 'express';
import { 
  getProjects, 
  getProjectById, 
  createProject, 
  deleteProject, 
  updateProject 
} from '../controllers/projectController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Routes
router.get('/', verifyToken, getProjects);
router.post('/', verifyToken, adminOnly, createProject);
router.get('/:id', verifyToken, getProjectById);
router.delete('/:id', verifyToken, adminOnly, deleteProject);
router.put('/:id', verifyToken, adminOnly, updateProject);

export default router;
