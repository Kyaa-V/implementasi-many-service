import { checkQueue } from "./checkQueue"
const { getChannel } = require('../utils/initRabbitMq.ts')

async function startWorker() {
    const channel = getChannel();

    checkQueue(channel);
}

module.exports = startWorker;