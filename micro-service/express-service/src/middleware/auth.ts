import { NextFunction, Request, Response } from "express";
import { createToken } from "../utils/token";
import { toResponseUser } from "../app/resource/ResourceUser";
import { sessionTimeOut } from "../app/resource/sessionTimeOut";
import { prismaClient } from "../database/prisma";
import { DecodedUser } from "../app/model/DecodeUser";
import { logger } from "../logging/Logging";

const RedisClient = require('../config/RedisClient.js')

export class AuthRequest{

  static async authRoles(req: Request, res: Response, next: NextFunction){
    try {
      const headers = req.headers["authorization"] as string;

      if (!headers || !headers.startsWith('Bearer ')) {
        return sessionTimeOut(res, false, 401, "No token provided or invalid format");
      }

      const token = headers && headers.split(" ")[1];

      if(!token){
        return sessionTimeOut(res,false,401, "No token provided")
      }

      const decoded = await createToken.verify(token) as DecodedUser

        const searchUserById = await prismaClient.user.findUnique({
          where:{
            id: decoded.id
          },
          include: {
            roles: true
          }
        })

        logger.info(`search user by id: ${JSON.stringify(searchUserById)}`)

        if(!searchUserById){
          return sessionTimeOut(res, false, 404, "User not found")
        }

        logger.info(`user roles: ${searchUserById.roles.map((role: any)=> role.name)}`)

        if(!searchUserById.roles.some((role: any) => role.name === 'ADMIN')){
          return sessionTimeOut(res, false, 404, "you dont have access to this resource")
        }

        req.user = decoded

        next()

    } catch (error) {
      next(error)
    }
  }

  static async authentication(req: Request, res: Response, next: NextFunction) {

    const authHeader= req.headers["authorization"] as string;
    const token = authHeader && authHeader.split(" ")[1];

    // try {
      
      if (token) {
        try {
          const decoded = await createToken.verify(token) as DecodedUser
          logger.info(`userId: ${decoded.id}`)

          req.user = decoded as DecodedUser;
          (req as any).token = token

          logger.info(`decoded token userId: ${req.user?.id}`)
          logger.info('access token still valid...')
          return next()
        } catch (error) {
          logger.info("access token invalid/expired, trying refresh")
        }
      }else{
        logger.info("no access token, trying refresh...")
      }

      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        return sessionTimeOut(res, false, 401, "No token Provided")
      }

      const decoded = await createToken.verify(refreshToken) as DecodedUser
      logger.info(`decoded refresh token UserId: ${decoded.id}`)

      const storedRefreshToken = await RedisClient.get(`user:refreshToken:${decoded.id}`)

      logger.info(`refresh token: ${refreshToken}, token refresh in redis: ${storedRefreshToken}`)
      if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
          return sessionTimeOut(res, false, 401, "Sesi Anda telah berakhir, silakan login kembali")
      }

        const newAccessToken = await createToken.token(
          { id: decoded.id, name: decoded.name, roles: decoded.roles },
          "15m"
        );
        res.setHeader("Authorization", `Bearer ${newAccessToken}`);

        
        logger.info(`userId: ${decoded.id}`)
        req.user = decoded as DecodedUser;

        (req as any).token = newAccessToken;
        return next();

    // } catch (error) {
    //   return sessionTimeOut(res,false, 401, "Your session has expired, please login again")
    // }

  };
}

