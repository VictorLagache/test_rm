import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validation.js';
import * as bookingService from '../services/bookingService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const createSchema = z.object({
  resource_id: z.number().int().positive(),
  project_id: z.number().int().positive().nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours_per_day: z.number().min(0.5).max(24).optional(),
  booking_type: z.enum(['project', 'leave']),
  leave_type: z.enum(['vacation', 'sick', 'personal', 'other']).nullable().optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await bookingService.getAllBookings());
  } catch (err) { next(err); }
});

router.get('/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return next(new AppError(400, 'start and end query parameters are required'));
    }
    res.json(await bookingService.getSchedule(start as string, end as string));
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.getBookingById(Number(req.params.id));
    if (!booking) return next(new AppError(404, 'Booking not found'));
    res.json(booking);
  } catch (err) { next(err); }
});

router.post('/', validate(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.createBooking(req.body);
    res.status(201).json(booking);
  } catch (err) { next(err); }
});

router.put('/:id', validate(updateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.updateBooking(Number(req.params.id), req.body);
    if (!booking) return next(new AppError(404, 'Booking not found'));
    res.json(booking);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await bookingService.deleteBooking(Number(req.params.id));
    if (!deleted) return next(new AppError(404, 'Booking not found'));
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
