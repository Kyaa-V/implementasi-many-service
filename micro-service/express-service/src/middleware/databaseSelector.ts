// middleware/databaseSelector.ts
import { Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../lib/database';

export const databaseSelector = (req: Request, res: Response, next: NextFunction) => {
  // Tentukan jenis operasi berdasarkan HTTP method
  const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  
  // Attach Prisma client yang sesuai ke request object
  req.prisma = getPrismaClient(isWriteOperation ? 'write' : 'read');
  
  // Tambahkan info database yang digunakan untuk debugging
  req.databaseType = isWriteOperation ? 'write-master' : 'read-replica';
  
  next();
};