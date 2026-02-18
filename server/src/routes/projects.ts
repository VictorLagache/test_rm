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

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await projectService.getAllProjects());
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.getProjectById(Number(req.params.id));
    if (!project) return next(new AppError(404, 'Project not found'));
    res.json(project);
  } catch (err) { next(err); }
});

router.post('/', validate(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.createProject(req.body);
    res.status(201).json(project);
  } catch (err) { next(err); }
});

router.put('/:id', validate(updateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.updateProject(Number(req.params.id), req.body);
    if (!project) return next(new AppError(404, 'Project not found'));
    res.json(project);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await projectService.deleteProject(Number(req.params.id));
    if (!deleted) return next(new AppError(404, 'Project not found'));
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
