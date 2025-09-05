import { getPrismaClient } from "../../../lib/database"

export class UserService{
    static async getAllUser(){
        const prisma = getPrismaClient('read')
        return
    }
}