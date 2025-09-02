import { logger } from "../logging/Logging";

const amqp = require('amqplib')

let channel: any;

async function initRabbitMq() {
    try {
        const connection = await amqp.connect('amqp://user:password@rabbitmq:5672')
        channel = await connection.createChannel()
        await channel.assertQueue('test-queue')
        await channel.assertQueue('notification_register')
        await channel.assertQueue('send-queue',{durable: false})

        logger.info('Connected to RabbitMQ and queue asserted')
    } catch (error) {
        logger.error('Error connecting to RabbitMQ:', error)
        process.exit(1)
    }
}

module.exports = {
    initRabbitMq,
    getChannel: () => channel
}
