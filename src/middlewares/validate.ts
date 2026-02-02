import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';


export function validate(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!validationResult.success) {
        return next(validationResult.error);
      }

      const data = validationResult.data as any;
      if (data.body) {
        req.body = data.body;
      }
      if (data.query) {

        Object.keys(data.query).forEach((key) => {
          (req.query as any)[key] = data.query[key];
        });
      }
      if (data.params) {
        Object.keys(data.params).forEach((key) => {
          (req.params as any)[key] = data.params[key];
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
