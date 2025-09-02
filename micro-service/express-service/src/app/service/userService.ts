import { v4 as uuidv4 } from 'uuid';
import { VALIDATION } from "../../validation/validation"
import { userValidation } from "../../validation/userValidation"
import { registerUser } from "../model/userModel";
import { prismaClient } from "../../database/prisma";
import { ResponseError } from "../../error/respon-error";
import { toResponseUser } from "../resource/ResourceUser"
const { getChannel } = require("../../utils/initRabbitMq");

export class userService{
    static async register(data:any){
        const uuid = uuidv4();
        console.log(uuid)
        const channel = getChannel()
        console.log("memulai proses validasi di service")
        const validatedData = VALIDATION.validation(userValidation.REGISTER, data as registerUser);

        const checkEmailWithCountUser = await prismaClient.user.count({
            where: {
                email: validatedData.email
            }
        })
        if(checkEmailWithCountUser > 0){
            throw new ResponseError(409,'Email already exists')
        }

        console.log("memulai proses pembuatan user di service")

        const createUser = await prismaClient.user.create({
            data: validatedData
        })

        channel.sendToQueue('notification_register', Buffer.from(JSON.stringify({
            email: createUser.email,
            name: createUser.name
        })))

        return toResponseUser(201,'User created Succesfully',createUser)
    }
}