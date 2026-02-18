import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import resourceRoutes from './routes/resources.js';
import projectRoutes from './routes/projects.js';
import bookingRoutes from './routes/bookings.js';
import departmentRoutes from './routes/departments.js';
import reportRoutes from './routes/reports.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/resources', resourceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

export default app;
