import { Request, Response } from "express"
import { userController } from "../../controller/userController"

const express = require('express')
const { getChannel } = require('../../utils/initRabbitMq.ts')
const RedisClient = require('../../config/RedisClient.js')
const router = express.Router()

router.get('/', async (req:Request,res:Response)=> {
    const channel = getChannel();
    channel.sendToQueue('test-queue', Buffer.from('Hello from Express Service!'))
    const cacheRedis = await RedisClient.get('cache')
    console.log(`Redis cache value: ${cacheRedis}`)
    res.send("hello world testing ok sip");
})
router.get('/hello', async (req: Request,res: Response)=> {
    await RedisClient.set('cache', 'hello world from redis in express service path /hello')
    res.send("testing");
})

router.post('/register', userController.register)

module.exports = router;