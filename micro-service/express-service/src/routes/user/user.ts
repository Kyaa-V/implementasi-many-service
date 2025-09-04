import { Request, Response } from "express"
import { AuthRequest } from "../../middleware/auth"
import { userController } from "../../controller/user/userController"


const express = require('express')
const { getChannel } = require('../../utils/initRabbitMq.ts')
const RedisClient = require('../../config/RedisClient.js')
const router = express.Router()

// router.get('/', authentication ,async (req:Request,res:Response)=> {
//     const channel = getChannel();
//     channel.sendToQueue('test-queue', Buffer.from('Hello from Express Service! channel Rabbitmq'))
//     const cacheRedis = await RedisClient.get('cache')
//     console.log(`Redis cache value: ${cacheRedis}`)
//     res.send("hello world testing ok sip");
// })
// router.get('/hello', authentication ,async (req: Request,res: Response)=> {
//     await RedisClient.set('cache', 'hello world from redis in express service path /hello');
//     res.send("testing");
// })

router.get('/get-all-user', AuthRequest.authentication, userController.getAllUser)
router.get('/get-user-me', AuthRequest.authentication, userController.getUserMe)
router.get('/get-user/:id', AuthRequest.authentication, userController.getUserById)
router.put('/update-user/:id', AuthRequest.authentication, userController.updateUser)
router.post('/change-password', AuthRequest.authentication, userController.changePassword)
router.post('/change-email', AuthRequest.authentication, userController.changeEmail)
router.delete('/delete-user/:id', AuthRequest.authentication, userController.deleteUserById)

module.exports = router;