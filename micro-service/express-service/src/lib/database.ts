import { PrismaClient } from "@prisma/client"

const createPrismaClient = (url: string) =>{
    return new PrismaClient({
        datasources:{
            db:{
                url:url
            }
        }
    })
}

export const prismaWrite = createPrismaClient(process.env.DATABASE_MASTER_URL!)
export const prismaRead1 = createPrismaClient(process.env.DATABASE_REPLICA1_URL!)
export const prismaRead2 = createPrismaClient(process.env.DATABASE_REPLICA2_URL!)

export const getReadClient = (): PrismaClient => {
  // Simple round-robin load balancing antara dua replica
  const random = Math.random();
  return random < 0.5 ? prismaRead1 : prismaRead2;
};

export const getPrismaClient = (operation: 'read' | 'write' = 'read'): PrismaClient => {
  return operation === 'write' ? prismaWrite : getReadClient();
};