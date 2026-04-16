import { Router, Response, Request } from 'express';
import { google } from 'googleapis';
import { pool } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const googleOAuth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// GET integration status
router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    'SELECT provider, enabled, granted_at FROM integration_permissions WHERE user_id = $1',
    [req.userId]
  );
  res.json(result.rows);
});

// --- GOOGLE ---
router.get('/google/auth-url', authMiddleware, async (req: AuthRequest, res: Response) => {
  const url = googleOAuth.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    state: req.userId,
    prompt: 'consent',
  });
  res.json({ url });
});

router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state: userId } = req.query as { code: string; state: string };
  try {
    const { tokens } = await googleOAuth.getToken(code);
    await pool.query(
      `UPDATE users SET google_access_token = $1, google_refresh_token = $2 WHERE id = $3`,
      [tokens.access_token, tokens.refresh_token, userId]
    );
    await pool.query(
      `INSERT INTO integration_permissions (user_id, provider, enabled, granted_at)
       VALUES ($1, 'google', true, NOW())
       ON CONFLICT (user_id, provider) DO UPDATE SET enabled = true, granted_at = NOW()`,
      [userId]
    );
    res.redirect(`${process.env.CLIENT_URL}/settings?integration=google&status=success`);
  } catch {
    res.redirect(`${process.env.CLIENT_URL}/settings?integration=google&status=error`);
  }
});

router.post('/google/sync', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userResult = await pool.query('SELECT google_access_token, google_refresh_token FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];
    if (!user?.google_access_token) return res.status(403).json({ error: 'Google not connected' });

    googleOAuth.setCredentials({
      access_token: user.google_access_token,
      refresh_token: user.google_refresh_token,
    });

    const calendar = google.calendar({ version: 'v3', auth: googleOAuth });
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: weekLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = events.data.items || [];
    let synced = 0;

    for (const event of items) {
      if (!event.start?.dateTime || !event.end?.dateTime) continue;
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
      const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
      const dayOfWeek = start.getDay();

      await pool.query(
        `INSERT INTO timetable_slots (user_id, title, day_of_week, start_time, end_time, color, source, external_id)
         VALUES ($1, $2, $3, $4, $5, '#10b981', 'google', $6)
         ON CONFLICT DO NOTHING`,
        [req.userId, event.summary || 'Google Event', dayOfWeek, startTime, endTime, event.id]
      );
      synced++;
    }

    res.json({ synced, message: `${synced} events synced from Google Calendar` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync Google Calendar' });
  }
});

// Revoke integration
router.delete('/:provider', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { provider } = req.params;
  await pool.query(
    `UPDATE integration_permissions SET enabled = false, revoked_at = NOW() WHERE user_id = $1 AND provider = $2`,
    [req.userId, provider]
  );
  if (provider === 'google') {
    await pool.query('UPDATE users SET google_access_token = NULL, google_refresh_token = NULL WHERE id = $1', [req.userId]);
  } else if (provider === 'microsoft') {
    await pool.query('UPDATE users SET microsoft_access_token = NULL, microsoft_refresh_token = NULL WHERE id = $1', [req.userId]);
  }
  res.json({ message: `${provider} integration revoked` });
});

export default router;
