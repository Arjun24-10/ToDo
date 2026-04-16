import { Router, Response } from 'express';
import { pool } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Save push subscription from browser
router.post('/subscribe', async (req: AuthRequest, res: Response) => {
  const { subscription } = req.body;
  if (!subscription) return res.status(400).json({ error: 'subscription required' });
  try {
    await pool.query('UPDATE users SET push_subscription = $1 WHERE id = $2', [subscription, req.userId]);
    res.json({ message: 'Subscribed to push notifications' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/unsubscribe', async (req: AuthRequest, res: Response) => {
  await pool.query('UPDATE users SET push_subscription = NULL WHERE id = $1', [req.userId]);
  res.json({ message: 'Unsubscribed' });
});

// Get VAPID public key for client
router.get('/vapid-key', (_req, res: Response) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

export default router;
