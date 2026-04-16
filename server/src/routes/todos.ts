import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET all todos
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM todos WHERE user_id = $1 ORDER BY scheduled_at ASC NULLS LAST, created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create todo
router.post('/',
  body('title').notEmpty(),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, scheduled_at, duration_minutes, priority, category } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO todos (user_id, title, description, scheduled_at, duration_minutes, priority, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [req.userId, title, description, scheduled_at, duration_minutes || 30, priority || 'medium', category]
      );
      res.status(201).json(result.rows[0]);
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PATCH update todo
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, scheduled_at, duration_minutes, completed, priority, category } = req.body;
  try {
    const result = await pool.query(
      `UPDATE todos SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        scheduled_at = COALESCE($3, scheduled_at),
        duration_minutes = COALESCE($4, duration_minutes),
        completed = COALESCE($5, completed),
        completed_at = CASE WHEN $5 = true THEN NOW() ELSE completed_at END,
        priority = COALESCE($6, priority),
        category = COALESCE($7, category),
        updated_at = NOW()
       WHERE id = $8 AND user_id = $9 RETURNING *`,
      [title, description, scheduled_at, duration_minutes, completed, priority, category, id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Todo not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE todo
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM todos WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
