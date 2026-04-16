import cron from 'node-cron';
import webpush from 'web-push';
import { pool } from '../db';

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'admin@todoapp.com'),
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export function startAlarmScheduler() {
  // Runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
      const sixMinutesLater = new Date(now.getTime() + 6 * 60 * 1000);

      // Find todos scheduled in the next 5-6 minutes that haven't had alarm sent
      const result = await pool.query(
        `SELECT t.id, t.title, t.scheduled_at, u.push_subscription
         FROM todos t
         JOIN users u ON t.user_id = u.id
         WHERE t.scheduled_at >= $1
           AND t.scheduled_at < $2
           AND t.completed = false
           AND t.alarm_sent = false
           AND u.push_subscription IS NOT NULL`,
        [fiveMinutesLater, sixMinutesLater]
      );

      for (const todo of result.rows) {
        try {
          const subscription = todo.push_subscription;
          const payload = JSON.stringify({
            title: '⏰ Task Due Soon',
            body: `"${todo.title}" is due in 5 minutes!`,
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            data: { todoId: todo.id },
          });

          await webpush.sendNotification(subscription, payload);
          await pool.query('UPDATE todos SET alarm_sent = true WHERE id = $1', [todo.id]);
          console.log(`Alarm sent for todo: ${todo.title}`);
        } catch (err) {
          console.error(`Failed to send alarm for todo ${todo.id}:`, err);
        }
      }
    } catch (err) {
      console.error('Alarm scheduler error:', err);
    }
  });

  console.log('Alarm scheduler started');
}
