import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import * as reportService from '../services/reportService.js';

const router = Router();

router.get('/utilization', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return next(new AppError(400, 'start and end query parameters are required'));
    }
    res.json(await reportService.getUtilizationReport(start as string, end as string));
  } catch (err) { next(err); }
});

router.get('/projects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return next(new AppError(400, 'start and end query parameters are required'));
    }
    res.json(await reportService.getProjectReport(start as string, end as string));
  } catch (err) { next(err); }
});

export default router;
