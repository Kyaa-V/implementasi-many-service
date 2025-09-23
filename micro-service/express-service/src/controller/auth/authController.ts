import { NextFunction, Request, Response } from "express";
import { authService } from "../../app/service/auth/authService";
import { LoginUser, registerUser } from "../../app/model/AuthModel";
import { toResponseUser } from "../../app/resource/ResourceUser";
import { logger } from '../../logging/Logging'
import { userValidation } from "../../validation/userValidation";
const RedisClient = require('../../config/RedisClient.js')

export class authController{
    static async register(req: Request, res:Response, next: NextFunction){
        try {

            logger.info(`database register use type: ${req.databaseType}`)
            logger.info("memulai controller")
            const { createUser, token, refreshToken} = await authService.register(req.body as registerUser);
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            })

            await RedisClient.set(`user:refreshToken:${createUser.id}`, refreshToken, 30* 24 * 60 * 60) // Set cache refresh token for 30 days
            logger.info("selesai create user")
            logger.info(createUser)
            return await toResponseUser(res, true, 201, 'User created Succesfully',createUser, token)
        } catch (e) {
            logger.error(`Error occurred in userController.register:${e}`)
            next(e)
        }
    }
    static async login(req: Request, res: Response, next: NextFunction){
        logger.info(`database login use type: ${req.databaseType}`)
        logger.info("memulai process login di controller")
        const {user, token, refreshToken} = await authService.login(req.body as LoginUser)

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        })

        await RedisClient.set(`user:refreshToken:${user.id}`, refreshToken, 30* 24 * 60 * 60) // Set cache refresh token for 30 days
        logger.info("selesai login user")
        logger.info(user)
        return await toResponseUser(res, true, 200, 'User login Succesfully',user, token)
    }
    static async logout(req: Request, res: Response, next: NextFunction){
        return
    }
    static async forgotPassword(req: Request, res: Response, next: NextFunction){
        return
    }
    static async resetPassword(req: Request, res: Response, next: NextFunction){
        return
    }
}