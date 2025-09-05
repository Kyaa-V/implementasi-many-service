import { NextFunction, Request, Response } from "express";
import { getPrismaClient } from "../../lib/database";
import { logger } from "../../logging/Logging";
import { UserService } from "../../app/service/user/userService";

export class userController{
    static async getAllUser(req: Request, res: Response, next: NextFunction){

        const data = UserService.all(req.user)
        
        logger.info(`database get all user use type:${req.databaseType}`)
        console.log(`data from get all user: ${data}`)
        return
    }
    static async getUserMe(req: Request, res: Response, next: NextFunction){
        return
    }
    static async getUserById(req: Request, res: Response, next: NextFunction){
        return
    }
    static async updateUser(req: Request, res: Response, next: NextFunction){
        return
    }
    static async changePassword(req: Request, res: Response, next: NextFunction){
        return
    }
    static async changeEmail(req: Request, res: Response, next: NextFunction){
        return
    }
    static async deleteUserById(req: Request, res: Response, next: NextFunction){
        return
    }
}