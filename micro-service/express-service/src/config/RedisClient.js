const redis = require('redis')

class RedisClient {
    constructor(){
        this.client = null
        this.connect()
    }

    async connect() {
        try {
                this.client = redis.createClient({
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: process.env.REDIS_PORT || 6379
                },
                password: process.env.REDIS_PASSWORD || undefined
                })

            this.client.on('connect', () => {
                console.log('Connected to redis')
            })
            this.client.on('error', (error)=>{
                console.log('Error connecting to redis:', error)
            })
            this.client.connect()
        } catch (error) {
            console.error('Error connecting to redis:', error)
        }
    }

    async get(keys){
        try {
            const data = await this.client.get(keys)

            return data ? JSON.parse(data) : null
        } catch (error) {
            console.error('Error getting data from redis:', error)
            return null
        }
    }

    async set(key, value, expirationInSeconds = 3600){
        try {
            await this.client.set(key, JSON.stringify(value), {
                EX: expirationInSeconds
            })
        } catch (error) {
            console.error('Error setting data in redis:', error)
        }
    }

    async del(keys){
        try {
            await this.client.del(keys)
        } catch (error) {
            console.error('Error deleting data from redis:', error)
        }
    }
}

module.exports = new RedisClient()