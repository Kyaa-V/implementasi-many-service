import { Response } from "express"

export function sessionTimeOut(res:Response, success:boolean, statusCode: number, message:string){
    return res.status(statusCode).json({
        success: success,
        message: message
    })
}