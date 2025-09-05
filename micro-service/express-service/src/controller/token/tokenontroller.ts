import { Request, Response, NextFunction} from "express"
import { createToken } from "../../utils/token";
import { toResponseUser } from "../../app/resource/ResourceUser";
import { sessionTimeOut } from "../../app/resource/sessionTimeOut";
import { DecodedUser } from "../../app/model/DecodeUser";

const RedisClient = require('../../config/RedisClient.js')

export class token{
    static async refreshToken(req: Request, res:Response, next: NextFunction){
        try {
            const refreshToken = req.cookies?.refreshToken;
          if(!refreshToken){
              return res.status(401).json({message: "Unauthorized"})
          }

          const decoded = await createToken.verify(refreshToken, process.env.JWT_SECRET_TOKEN!) as DecodedUser
          
          const checkExRefreshTokenInRedis = await RedisClient.get(`user:${decoded.id}`)

          if(!checkExRefreshTokenInRedis){
            return sessionTimeOut(res, false, 401, "your session has expired, please login again")
          }
          const newAccessToken = await createToken.token(
                { id: decoded.id, name: decoded.name },
                process.env.JWT_SECRET_TOKEN,
                "15m"
              );
          
          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 hari
          });
      
          req.user = decoded as DecodedUser
          await RedisClient.set(`user:${decoded.id}`, refreshToken, 30 * 24 * 60 * 60)
      
          return toResponseUser(res,true,201, "Token refreshed successfully", {
            id: decoded.id,
            name: decoded.name,
          }, newAccessToken);
        } catch (error) {
          next(error)
        }
    }
}