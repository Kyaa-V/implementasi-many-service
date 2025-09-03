import { Request, Response, NextFunction } from "express";
import { logger } from './src/logging/Logging'

const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const api = require('./src/routes/api.ts')
const { initRabbitMq } = require('./src/utils/initRabbitMq.ts')
const startWorker = require('./src/workers/index.ts');
const { MiddlewareError } = require('./src/middleware/middlewareError');
const app = express();
const port = 3000;
require('dotenv').config()

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

app.use('/v1', api )

app.use(MiddlewareError)

// Morgan untuk HTTP logging
app.use(morgan('combined', {
  stream: { write: (message: string) => logger.info(message.trim()) }
}));

// Custom middleware logging
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use((req:Request, res: Response)=>{
    res.status(404).json({ error: 'Page Not Found' })
})

app.use((err: Error, req: Request, res: Response, next: NextFunction)=>{
    logger.error(`Error from internal error: ${err.message}`)
    res.status(500).json({ error: 'Internal Server Error'})
})


async function startServer(){
    try {
        await initRabbitMq()
        startWorker()

        app.listen(port, () =>{
            logger.info(`server is running on http://localhost:${port}`)
        })
    } catch (error) {
        logger.error(`Error starting server: ${error}`)
        process.exit(1)
    }
}
startServer()