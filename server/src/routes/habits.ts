import { Router, Response } from 'express';
import { pool } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// --- MUST DO ---
router.get('/must-do', async (req: AuthRequest, res: Response) => {
  const result = await pool.query('SELECT * FROM must_do_habits WHERE user_id = $1 ORDER BY created_at', [req.userId]);
  res.json(result.rows);
});

router.post('/must-do', async (req: AuthRequest, res: Response) => {
  const { title, description, frequency } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const result = await pool.query(
    'INSERT INTO must_do_habits (user_id, title, description, frequency) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.userId, title, description, frequency || 'daily']
  );
  res.status(201).json(result.rows[0]);
});

router.delete('/must-do/:id', async (req: AuthRequest, res: Response) => {
  await pool.query('DELETE FROM must_do_habits WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.status(204).send();
});

// --- MUST NOT DO ---
router.get('/must-not-do', async (req: AuthRequest, res: Response) => {
  const result = await pool.query('SELECT * FROM must_not_do_habits WHERE user_id = $1 ORDER BY created_at', [req.userId]);
  res.json(result.rows);
});

router.post('/must-not-do', async (req: AuthRequest, res: Response) => {
  const { title, description, motivation_video_url, motivation_video_title } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const result = await pool.query(
    `INSERT INTO must_not_do_habits (user_id, title, description, motivation_video_url, motivation_video_title)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.userId, title, description, motivation_video_url, motivation_video_title]
  );
  res.status(201).json(result.rows[0]);
});

router.patch('/must-not-do/:id', async (req: AuthRequest, res: Response) => {
  const { title, description, motivation_video_url, motivation_video_title } = req.body;
  const result = await pool.query(
    `UPDATE must_not_do_habits SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      motivation_video_url = COALESCE($3, motivation_video_url),
      motivation_video_title = COALESCE($4, motivation_video_title)
     WHERE id = $5 AND user_id = $6 RETURNING *`,
    [title, description, motivation_video_url, motivation_video_title, req.params.id, req.userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

router.delete('/must-not-do/:id', async (req: AuthRequest, res: Response) => {
  await pool.query('DELETE FROM must_not_do_habits WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.status(204).send();
});

export default router;
