import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import todoRoutes from './routes/todos';
import timetableRoutes from './routes/timetable';
import habitRoutes from './routes/habits';
import integrationRoutes from './routes/integrations';
import notificationRoutes from './routes/notifications';
import { startAlarmScheduler } from './services/alarmScheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startAlarmScheduler();
});

export default app;
