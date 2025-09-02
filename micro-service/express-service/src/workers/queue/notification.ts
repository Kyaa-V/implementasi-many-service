import { ResponseError } from "../../error/respon-error"
import { logger } from '../../logging/Logging'

export async function notification(channel: any){
    try {
        const msg = await channel.consume('notification_register',(msg: any)=>{
            logger.info(`Received message from notification:${msg.content.toString()}`)
            const data = JSON.parse(msg.content.toString())
            logger.info(`Email: ${data.email}, Name: ${data.name}`)
            channel.ack(msg)
        })
    } catch (error) {
        throw new ResponseError(500, 'Failed to Pocess Notification')
    }
    logger.info('Succes Connect to notification_register worker')
}