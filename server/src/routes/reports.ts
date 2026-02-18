import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import * as reportService from '../services/reportService.js';

const router = Router();

router.get('/utilization', (req: Request, res: Response, next: NextFunction) => {
  const { start, end } = req.query;
  if (!start || !end) {
    return next(new AppError(400, 'start and end query parameters are required'));
  }
  res.json(reportService.getUtilizationReport(start as string, end as string));
});

router.get('/projects', (req: Request, res: Response, next: NextFunction) => {
  const { start, end } = req.query;
  if (!start || !end) {
    return next(new AppError(400, 'start and end query parameters are required'));
  }
  res.json(reportService.getProjectReport(start as string, end as string));
});

export default router;
