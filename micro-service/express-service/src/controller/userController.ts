import { NextFunction, Request, Response } from "express";
import { userService } from "../app/service/userService";
import { registerUser } from "../app/model/userModel";

export class userController{
    static async register(req: Request, res:Response, next: NextFunction){
        try {
            console.log("memulai controller")
            const data = await userService.register(req.body as registerUser);
            console.log("selesai")
            res.status(201).json(data);
        } catch (e) {
            next(e)
        }
    }
}