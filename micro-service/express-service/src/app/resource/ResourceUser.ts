import {Response } from "express"


export function toResponseUser(
    res: Response,
    success:boolean,
    statusCode:number,
    message:string,
    user:any,
    token:string,
){
    return res.status(statusCode).json({
            success: success,
            message: message,
            data:{
                user:{
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at,
                    updated_at: user.updated_at
                },
                token: token,
            },
    })
}