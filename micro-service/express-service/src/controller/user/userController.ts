
import { NextFunction, Request, Response } from "express";
import { logger } from "../../logging/Logging";
import { UserService } from "../../app/service/user/userService";
import { success } from "zod";
import { toResponseAllUser, toResponseUser } from "../../app/resource/ResourceUser";
import { DecodedUser } from "../../app/model/DecodeUser";

export class userController{
    static async getAllUser(req: Request, res: Response, next: NextFunction){

        logger.info(req.user)
        const token = (req as any).token
        logger.info(`token in next request middleware: ${token}`)
        
        const data = await UserService.all()
        
        logger.info(`database get all user use type:${req.databaseType}`)
        return await toResponseAllUser(res, true, 200, 'Get all user succesfully', data)
    }
    static async getUserMe(req: Request, res: Response, next: NextFunction){

        const userId = (req.user as DecodedUser).id
        const token = (req as any).token
        logger.info(`token in next request middleware: ${token}`)

        logger.info(`userId from url: ${userId}`)

        const { data } = await UserService.findById(userId)

        return await toResponseUser(res, true, 200, 'Get user by id succesfullty',  data, token)
    }
    static async getUserById(req: Request, res: Response, next: NextFunction){
        const userId = req.params.id
        const token = (req as any).token
        logger.info(`token in next request middleware: ${token}`)
        logger.info(`userId form params: ${userId}`)

        const { data } = await UserService.findById(userId)

        return await toResponseUser(res, true, 200, 'Get user by id succesfullty',  data, token)

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