const { getChannel } = require('../utils/initRabbitMq.js')
const checkQueue = require('./checkQueue.js')

async function startWorker() {
    const channel = getChannel();

    checkQueue(channel);
}

module.exports = startWorker;