import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validation.js';
import * as resourceService from '../services/resourceService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const createSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  role: z.string().optional(),
  department_id: z.number().nullable().optional(),
  capacity_hours: z.number().min(0).max(24).optional(),
  color: z.string().optional(),
});

const updateSchema = createSchema.partial().extend({
  is_active: z.boolean().optional(),
});

router.get('/', (_req: Request, res: Response) => {
  res.json(resourceService.getAllResources());
});

router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const resource = resourceService.getResourceById(Number(req.params.id));
  if (!resource) return next(new AppError(404, 'Resource not found'));
  res.json(resource);
});

router.post('/', validate(createSchema), (req: Request, res: Response) => {
  const resource = resourceService.createResource(req.body);
  res.status(201).json(resource);
});

router.put('/:id', validate(updateSchema), (req: Request, res: Response, next: NextFunction) => {
  const resource = resourceService.updateResource(Number(req.params.id), req.body);
  if (!resource) return next(new AppError(404, 'Resource not found'));
  res.json(resource);
});

router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const deleted = resourceService.deleteResource(Number(req.params.id));
  if (!deleted) return next(new AppError(404, 'Resource not found'));
  res.status(204).send();
});

export default router;
