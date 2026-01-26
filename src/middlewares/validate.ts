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
        const errorMessage = validationResult.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ');

        return res.status(400).json({
          success: false,
          error: {
            message: '요청 데이터가 유효하지 않습니다',
            details: errorMessage,
          },
        });
      }

      const data = validationResult.data as any;
      if (data.body) {
        req.body = data.body;
      }
      if (data.query) {
        req.query = data.query;
      }
      if (data.params) {
        req.params = data.params;
      }

      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: '요청 검증 중 오류가 발생했습니다',
        },
      });
    }
  };
}
