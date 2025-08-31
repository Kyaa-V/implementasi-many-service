import { checkQueue } from "./queue/checkQueue"
import { notification } from "./queue/notification"
const { getChannel } = require('../utils/initRabbitMq.ts')

async function startWorker() {
    const channel = getChannel();

    checkQueue(channel);
    notification(channel)
}

module.exports = startWorker;