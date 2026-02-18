import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validation.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
});

router.get('/', async (_req: Request, res: Response) => {
  const { data } = await supabase.from('Department').select('*').order('name');
  res.json(data ?? []);
});

router.post('/', validate(createSchema), async (req: Request, res: Response) => {
  const { data } = await supabase.from('Department').insert({ name: req.body.name }).select('*').single();
  res.status(201).json(data);
});

export default router;
