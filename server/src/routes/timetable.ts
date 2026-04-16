import { Router, Response } from 'express';
import { pool } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM timetable_slots WHERE user_id = $1 ORDER BY day_of_week, start_time',
      [req.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { title, day_of_week, start_time, end_time, color } = req.body;
  if (!title || !start_time || !end_time) return res.status(400).json({ error: 'title, start_time, end_time required' });
  try {
    const result = await pool.query(
      `INSERT INTO timetable_slots (user_id, title, day_of_week, start_time, end_time, color)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, title, day_of_week, start_time, end_time, color || '#6366f1']
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const { title, day_of_week, start_time, end_time, color } = req.body;
  try {
    const result = await pool.query(
      `UPDATE timetable_slots SET
        title = COALESCE($1, title),
        day_of_week = COALESCE($2, day_of_week),
        start_time = COALESCE($3, start_time),
        end_time = COALESCE($4, end_time),
        color = COALESCE($5, color)
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [title, day_of_week, start_time, end_time, color, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Slot not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM timetable_slots WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
