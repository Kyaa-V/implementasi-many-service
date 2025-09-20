import { User } from "@prisma/client"
import { getPrismaClient } from "../../../lib/database"
import { logger } from "../../../logging/Logging"

export class UserService{
    static async all(): Promise<User[]>{
        
        const prisma = getPrismaClient('read')

        const data = await prisma.user.findMany({
            include: { roles: true }
        })
        logger.info(data)
        return data
    }
}