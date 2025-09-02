import { logger } from '../../logging/Logging'

export async function sendQueue(channel:any){
    try {
        const msg = channel.consume('send-queue', (msg: any)=>{
            if(msg !== null){
                logger.info(`Received content from laravel: ${msg.content.toString()}`);
                channel.ack(msg);
            }
        });
    } catch (error) {
        logger.error(error);
    }
    logger.info('succes connect to send queue')
}