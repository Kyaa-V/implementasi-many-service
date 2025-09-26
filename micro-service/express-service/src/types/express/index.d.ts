import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';
import { DecodedUser } from '../../app/model/DecodeUser';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
    } | string | JwtPayload;
  }
}
declare global {
  namespace Express {
    interface Request {
      user?: DecodedUser | null;
      prisma?: PrismaClient;
      databaseType: 'write-master' | 'read-replica';
    }
  }
}