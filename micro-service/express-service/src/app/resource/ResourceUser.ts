import {Response } from "express"
import { ResponseApi } from "../model/ResponseModel"
import { MultiUserResponse, SingleUserResponse } from "../model/UserModel"

export function toResponseAllUser(
    res: Response,
    success:boolean,
    statusCode:number,
    message:string,
    user:any[],
){
    const response : ResponseApi<MultiUserResponse>={
         payload:{
            success: success,
            message: message,
            data:{
                users: user.map(data => ({
                    id: data.id,
                    name: data.name,
                    created_at: data.created_at,
                    updated_at: data.updated_at,
                    roles: data.roles
                }))
            }
        }
    }
    return res.status(statusCode).json(response)
}

export function toResponseUser(
    res: Response,
    success:boolean,
    statusCode:number,
    message:string,
    user:any,
    token:string = '',
){
    const response : ResponseApi<SingleUserResponse> = {
            payload:{
            success: success,
            message: message,
            data:{
                user:{
                    id: user.id,
                    name: user.name,
                    roles: user.roles,
                    created_at: user.created_at,
                    updated_at: user.updated_at
                },
                token: token,
            },
        }
    }
    return res.status(statusCode).json(response)
}