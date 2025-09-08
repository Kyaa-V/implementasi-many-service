import { NextFunction, Request, Response } from "express";
import { createToken } from "../utils/token";
import { toResponseUser } from "../app/resource/ResourceUser";
import { sessionTimeOut } from "../app/resource/sessionTimeOut";
import { prismaClient } from "../database/prisma";
import { DecodedUser } from "../app/model/DecodeUser";

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
          }
        })

        if(!searchUserById){
          return sessionTimeOut(res, false, 404, "User not found")
        }

        // if(searchUserById.role !== 'ADMIN'){
        //   return sessionTimeOut(res, false, 404, "you dont have access to this resource")
        // }

        req.user = decoded

        next()

    } catch (error) {
      next(error)
    }
  }

  static async authentication(req: Request, res: Response, next: NextFunction) {
    const authHeader= req.headers["authorization"] as string;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = await createToken.verify(token) as DecodedUser

        req.user = decoded as DecodedUser;
        return next();
    }

    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return sessionTimeOut(res, false, 401, "No token Provided")
    }

    const decoded = await createToken.verify(token) as DecodedUser

    const checkExRefreshTokenInRedis = await RedisClient.get(`user:${decoded.id}`);
      if(!checkExRefreshTokenInRedis){
        return sessionTimeOut(res, false, 401, "your session has expired, please login again")
      }

      const newAccessToken = await createToken.token(
        { id: decoded.id, name: decoded.name },
        "15m"
      );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 hari
      });

      await RedisClient.set(`user:${decoded.id}`, refreshToken, 30 * 24 * 60 * 60);

      req.user = decoded as DecodedUser;

      return toResponseUser(res, true, 201, "Token refreshed successfully", {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      }, newAccessToken);
  };
}

