import { checkQueue } from "./queue/checkQueue"
import { notification } from "./queue/notification"
import { sendQueue } from "./queue/sendQueue";
import { verificationEmail } from "./queue/verification-email";
const { getChannel } = require('../utils/initRabbitMq.ts')

async function startWorker() {
    const channel = getChannel();

    checkQueue(channel);
    //notification(channel);
    sendQueue(channel)
    verificationEmail(channel)
}

module.exports = startWorker;