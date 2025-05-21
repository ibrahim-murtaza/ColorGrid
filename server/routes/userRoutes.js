import express from 'express';
import { register, loginUser, updateUserProfile, getUserbyId } from '../controllers/userController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', loginUser);
router.put('/update', updateUserProfile);
router.get('/:id', getUserbyId);

export default router;