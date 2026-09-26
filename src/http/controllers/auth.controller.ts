import type { Request, Response, NextFunction } from "express";
import { authService } from "../../services";
import type { registerSchema, loginSchema } from "../schemas/auth.schemas";
import type { z } from "zod";

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.validated.body as z.infer<typeof registerSchema>;
      const result = await authService.register(body.email, body.password, body.name);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.validated.body as z.infer<typeof loginSchema>;
      const result = await authService.login(body.email, body.password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};