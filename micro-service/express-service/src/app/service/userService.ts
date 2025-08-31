import { VALIDATION } from "../../validation/validation"
import { userValidation } from "../../validation/userValidation"
import { registerUser } from "../model/userModel";
import { prismaClient } from "../../database/prisma";
import { ResponseError } from "../../error/respon-error";
import { toResponseUser } from "../resource/ResourceUser"

export class userService{
    static register(data:any){
        const validatedData = VALIDATION.validation(userValidation.REGISTER, data as registerUser);

        const checkEmailWithCountUser = prismaClient.user.count({
            where: {
                email: validatedData.email
            }
        })
        if(!checkEmailWithCountUser){
            throw new ResponseError(409,'Email already exists')
        }

        const createUser = prismaClient.user.create({
            data: validatedData
        })
        return toResponseUser(createUser)
    }
}