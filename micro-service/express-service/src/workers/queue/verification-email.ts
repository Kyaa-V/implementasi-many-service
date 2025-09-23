import { logger } from "../../logging/Logging"

export async function verificationEmail(channel: any){
    try {
        const msg = await channel.consume('verification_email', (msg:any)=>{
           if(msg !== null){
               logger.info(`Received message from verification_email: ${msg.content.toString()}`)
               
               const data = JSON.parse(msg.content.toString())
               logger.info(`Email: ${data.email}, Name: ${data.name}, Time: ${data.time}`)

               channel.ack(msg)
           }
        })
    } catch (error) {
        logger.error("Failed to Process Verification Email")
    }
}