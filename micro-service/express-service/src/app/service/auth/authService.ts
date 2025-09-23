const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

import { createToken } from "../../../utils/token"
import { VALIDATION } from "../../../validation/validation"
import { userValidation } from "../../../validation/userValidation"

import { prismaClient } from "../../../database/prisma";
import { ResponseError } from "../../../error/respon-error";
const { getChannel } = require("../../../utils/initRabbitMq");
import { logger } from '../../../logging/Logging'
import { LoginUser, registerUser } from "../../model/AuthModel"
import { getPrismaClient } from "../../../lib/database"

export class authService{
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
                    password: hashedPassword,
                    roles:{
                        connect: {name: "USER"}
                    }
                },
                include:{
                    roles: true
                }
            })

            const token = await createToken.token({ id: createUser.id, name: createUser.name, roles: createUser.roles}, '15m')
            const refreshToken = await createToken.token({ id: createUser.id, name: createUser.name, roles: createUser.roles},'30d')

            channel.sendToQueue('notification_register', Buffer.from(JSON.stringify({
                email: createUser.email,
                name: createUser.name
            })))

            return {
                createUser, token, refreshToken
            }
        } catch (error) {
            logger.error("Error occurred during user registration", error)
            throw error;
        }
    }
    static async login(data:any){
        const validation = VALIDATION.validation(userValidation.LOGIN, data as LoginUser)

        const prisma = getPrismaClient('read')

        const user = await prisma.user.findUnique({
            where: { email:validation.email },
            include: {roles: true}
        })

        logger.info(user)

        if(!user){
            throw new ResponseError(404, "Email or password incorrect")
        }
        
        const isPassword = await bcrypt.compare(validation.password, user.password)
        if(!isPassword){
            throw new ResponseError(400, "Email or password incorrect")
        }

        const channel = getChannel()

        channel.sendToQueue('verification_email', Buffer.from(JSON.stringify({
            email: user.email,
            name: user.name,
            time: new Date()
        })))

        const token = await createToken.token({ id: user.id, name: user.name, roles: user.roles},'15m')
        const refreshToken = await createToken.token({ id: user.id, name: user.name, roles: user.roles},'15m')
        return {user, token, refreshToken}
    }
}