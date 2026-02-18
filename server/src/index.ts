import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/schema.js';
import { errorHandler } from './middleware/errorHandler.js';
import resourceRoutes from './routes/resources.js';
import projectRoutes from './routes/projects.js';
import bookingRoutes from './routes/bookings.js';
import departmentRoutes from './routes/departments.js';
import reportRoutes from './routes/reports.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/resources', resourceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
