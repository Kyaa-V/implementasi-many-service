import { ResponseError } from "../../error/respon-error"

export async function notification(channel: any){
    try {
        const msg = await channel.consume('notification_register',(msg: any)=>{
            console.log('Received message:', msg.content.toString())
            const data = JSON.parse(msg.content.toString())
            console.log(`Email: ${data.email}, Name: ${data.name}`)
            channel.ack(msg)
        })
    } catch (error) {
        throw new ResponseError(500, 'Failed to Pocess Notification')
    }
    console.log('Succes Connect to notification_register worker')
}