const express = require('express')
const { getChannel } = require('../../utils/initRabbitMq.js')
const RedisClient = require('../../config/RedisClient.js')
const router = express.Router()

router.get('/', async (req,res)=> {
    const channel = getChannel();
    channel.sendToQueue('test-queue', Buffer.from('Hello from Express Service!'))
    const cacheRedis = await RedisClient.get('cache')
    console.log(`Redis cache value: ${cacheRedis}`)
    res.send("hello world testing ok sip");
})
router.get('/hello', async (req,res)=> {
    await RedisClient.set('cache', 'hello world from redis in express service path /hello')
    res.send("testing");
})

module.exports = router;