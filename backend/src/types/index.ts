import { Request, Response, NextFunction } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface CoordinateQuery {
  lat?: number;
  lng?: number;
  radius?: number;
}

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;
