import { ResponseError } from "../../error/respon-error";
import { logger } from '../../logging/Logging'

export async function helloQueue(channel:any){
    try {
        const msg = channel.consume('hello', (msg: any)=>{
            if(msg !== null){
                logger.info(" [x] Received '%s'", msg.content.toString());
                channel.ack(msg);
            }
        });
    } catch (error) {
        logger.error(error);
    }
    logger.info('succes connect to hello queue')
}