export async function checkQueue(channel: any) {
    try {
        const msg = await channel.consume('test-queue', (msg: any) => {
            console.log('Received message:', msg.content.toString())
            channel.ack(msg)
        })
    } catch (error) {
        console.error('Error consuming message from RabbitMQ:', error)
    }

    console.log('Succes Connect to checkQueue worker')
}
