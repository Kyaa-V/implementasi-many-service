import { NextFunction, Request, Response } from "express";
import { userService } from "../app/service/userService";
import { registerUser } from "../app/model/userModel";

export class userController{
    static register(req: Request, res:Response, next: NextFunction){
        try {
            const data = userService.register(req.body as registerUser);
            console.log(data)
        } catch (e) {
            next(e)
        }
    }
}