const express = require('express')
const { getChannel } = require('../../utils/initRabbitMq.js')
const router = express.Router()

router.get('/', (req,res)=> {
    const channel = getChannel();
    channel.sendToQueue('test-queue', Buffer.from('Hello from Express Service!'))
    res.send("hello world testing ok sip");
})
router.get('/hello', (req,res)=> {
    res.send("testing");
})

module.exports = router;