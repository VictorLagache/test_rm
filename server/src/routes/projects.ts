import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validation.js';
import * as projectService from '../services/projectService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  client_name: z.string().optional(),
  color: z.string().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  budget_hours: z.number().nullable().optional(),
});

const updateSchema = createSchema.partial().extend({
  is_active: z.boolean().optional(),
});

router.get('/', (_req: Request, res: Response) => {
  res.json(projectService.getAllProjects());
});

router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const project = projectService.getProjectById(Number(req.params.id));
  if (!project) return next(new AppError(404, 'Project not found'));
  res.json(project);
});

router.post('/', validate(createSchema), (req: Request, res: Response) => {
  const project = projectService.createProject(req.body);
  res.status(201).json(project);
});

router.put('/:id', validate(updateSchema), (req: Request, res: Response, next: NextFunction) => {
  const project = projectService.updateProject(Number(req.params.id), req.body);
  if (!project) return next(new AppError(404, 'Project not found'));
  res.json(project);
});

router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const deleted = projectService.deleteProject(Number(req.params.id));
  if (!deleted) return next(new AppError(404, 'Project not found'));
  res.status(204).send();
});

export default router;
