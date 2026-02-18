import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validation.js';
import { getDb } from '../db/connection.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
});

router.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const departments = db.prepare('SELECT * FROM departments ORDER BY name').all();
  res.json(departments);
});

router.post('/', validate(createSchema), (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('INSERT INTO departments (name) VALUES (?)').run(req.body.name);
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(dept);
});

export default router;
