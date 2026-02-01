import { Router } from 'express';
import authRoutes from './auth.routes';
import guidesRoutes from './guides.routes';
import usersRoutes from './users.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/guides', guidesRoutes);
router.use('/users', usersRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Steam Ally API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
