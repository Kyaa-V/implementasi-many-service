import { Request, Response, NextFunction} from "express"
import { createToken } from "../../utils/token";
import { toResponseUser } from "../../app/resource/ResourceUser";
import { sessionTimeOut } from "../../app/resource/sessionTimeOut";

export class token{
    static async refreshToken(req: Request, res:Response, next: NextFunction){
        const refreshToken = req.cookies?.refreshToken;
        if(!refreshToken){
            return res.status(401).json({message: "Unauthorized"})
        }

        createToken.verify(refreshToken, process.env.JWT_SECRET_TOKEN, async (err:any, decoded:any)=>{
            if(err){
                return sessionTimeOut(res, false, 401, "Sesi telah Berakhir silhkan login kembali")
            }
            const newAccessToken = await createToken.token(
                  { id: decoded.id, email: decoded.email, name: decoded.name },
                  process.env.JWT_SECRET_TOKEN,
                  "15m"
                );
            
                res.cookie("refreshToken", refreshToken, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === "production",
                  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 hari
                });
            
                req.user = decoded;
            
                return toResponseUser(res,true,201, "Token refreshed successfully", {
                  id: decoded.id,
                  email: decoded.email,
                  name: decoded.name,
                }, newAccessToken);
        })
    }
}