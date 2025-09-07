import { NextFunction, Request, Response } from "express";
import { logger } from "../../logging/Logging";
import { UserService } from "../../app/service/user/userService";
import { success } from "zod";

export class userController{
    static async getAllUser(req: Request, res: Response, next: NextFunction){

        console.log(req.user)
        const data = await UserService.all()
        
        logger.info(`database get all user use type:${req.databaseType}`)
        return res.status(201).json({
            data:{
                status: "Success",
                message: "Berhasil get all data user",
                user: data
            }
        })
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