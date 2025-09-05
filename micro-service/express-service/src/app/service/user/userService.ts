import { getPrismaClient } from "../../../lib/database"

export class UserService{
    static async all(data: any){
        const prisma = getPrismaClient('read')
        return
    }
}