async function checkQueue(channel){
    try {
        const msg = await channel.consume('test-queue', (msg)=>{
            console.log('Received message:', msg.content.toString())
            channel.ack(msg)
        })
    } catch (error) {
        console.error('Error consuming message from RabbitMQ:', error)
    }

    console.log('Succes Connect to checkQueue worker')
}

module.exports = checkQueue
