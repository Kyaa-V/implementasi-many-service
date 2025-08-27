const amqp = require('amqplib')

let channel;

async function initRabbitMq() {
    try {
        const connection = await amqp.connect('amqp://user:password@rabbitmq:5672')
        channel = await connection.createChannel()
        await channel.assertQueue('test-queue')

        console.log('Connected to RabbitMQ and queue asserted')
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error)
    }
}

module.exports = {
    initRabbitMq,
    getChannel: () => channel
}
