import { logger } from '../../logging/Logging'

export async function checkQueue(channel: any) {
    try {
        const msg = await channel.consume('test-queue', (msg: any) => {
            if(msg !== null){
                logger.info(`Received message test-queue: ${msg.content.toString()}`)
                channel.ack(msg)
            }
        })
    } catch (error) {
        logger.error(`Error consuming message from RabbitMQ:${error}`)
    }

    logger.info('Succes Connect to test Queue worker')
}
