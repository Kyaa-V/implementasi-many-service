const express = require('express');
const api = require('./src/routes/api.js')
const { initRabbitMq } = require('./src/utils/initRabbitMq.js')
const startWorker = require('./src/workers')
const app = express();
const port = 3000;
require('dotenv').config()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/v1', api )

app.use((req,res)=>{
    res.status(404).json({ error: 'Page Not Found' })
})

app.use((err, req, res, next)=>{
    console.error('Error :', err)
    res.status(500).json({ error: 'Internal Server Error'})
})


async function startServer(){
    try {
        await initRabbitMq()
        startWorker()

        app.listen(port, () =>{
            console.log(`server is running on http://localhost:${port}`)
        })
    } catch (error) {
        console.error('Error starting server:', error)
        process.exit(1)
    }
}
startServer()