import { checkQueue } from "./queue/checkQueue"
import { notification } from "./queue/notification"
import { sendQueue } from "./queue/sendQueue";
const { getChannel } = require('../utils/initRabbitMq.ts')

async function startWorker() {
    const channel = getChannel();

    checkQueue(channel);
    notification(channel);
    sendQueue(channel)
}

module.exports = startWorker;