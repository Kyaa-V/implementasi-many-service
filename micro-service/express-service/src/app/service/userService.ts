const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

import { createToken } from "../../utils/token"
import { VALIDATION } from "../../validation/validation"
import { userValidation } from "../../validation/userValidation"
import { registerUser } from "../model/userModel";
import { prismaClient } from "../../database/prisma";
import { ResponseError } from "../../error/respon-error";
const { getChannel } = require("../../utils/initRabbitMq");
import { logger } from '../../logging/Logging'
export class userService{
    static async register(data:any){
        try {
            const channel = getChannel()
            logger.info("memulai proses validasi di service")
            const validatedData = VALIDATION.validation(userValidation.REGISTER, data as registerUser);

            const checkEmailWithCountUser = await prismaClient.user.count({
                where: {
                    email: validatedData.email
                }
            })
            if(checkEmailWithCountUser > 0){
                throw new ResponseError(409,'Email already exists')
            }

            logger.info("memulai proses pembuatan user di service")

            const hashedPassword = await bcrypt.hash(validatedData.password, 10)
            const createUser = await prismaClient.user.create({
                data: {
                    ...validatedData,
                    password: hashedPassword
                }
            })

            const token = await createToken.token({ id: createUser.id, name: createUser.name, email:createUser.email},
                process.env.JWT_SECRET_TOKEN, '15m')
            const refreshToken = await createToken.token({ id: createUser.id, name: createUser.name, email:createUser.email},
                process.env.JWT_SECRET_TOKEN, '30d')

            channel.sendToQueue('notification_register', Buffer.from(JSON.stringify({
                email: createUser.email,
                name: createUser.name
            })))

            return {
                createUser, token, refreshToken
            }
        } catch (error) {
            logger.error("Error occurred during user registration", error)
            throw new ResponseError(500, 'Internal Server Error')
        }
    }
}