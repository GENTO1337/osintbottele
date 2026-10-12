const { MongoClient } = require('mongodb')

const client = new MongoClient('URLKU')
let db 

async function connectDB() {
    try {
        await client.connect()
        console.log('Connected to MongoDB')
        db = client.db('ePhoneDB')
    } catch(error) {
        console.log(error.message)
    }
}

function getDB() {
    if (!db) throw new Error('Database not initialized')
        return db
}

module.exports = { connectDB, getDB }