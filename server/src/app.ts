import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';
import resourceRoutes from './routes/resources.js';
import projectRoutes from './routes/projects.js';
import bookingRoutes from './routes/bookings.js';
import departmentRoutes from './routes/departments.js';
import reportRoutes from './routes/reports.js';

const app = express();

app.use(cors());
app.use(express.json());

// Public
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Protected
app.use('/api/resources', requireAuth, resourceRoutes);
app.use('/api/projects', requireAuth, projectRoutes);
app.use('/api/bookings', requireAuth, bookingRoutes);
app.use('/api/departments', requireAuth, departmentRoutes);
app.use('/api/reports', requireAuth, reportRoutes);

app.use(errorHandler);

export default app;
