const fs = require('fs')
const { MongoClient } = require('mongodb')

const client = new MongoClient('URLKU')

async function migrateData() {
    try {
        await client.connect()
        console.log('Connected to MongodDB')
        const db = client.db('ePhoneDB')
        const collection = db.collection('users')

        const rawData = fs.readFileSync('database.json', 'utf8')
        const data = JSON.parse(rawData)
        const result = await collection.insertMany(data)
        console.log(`${result.insertedCount} records insterted into MongoDB`)
    } catch(error) {
        console.log(error.message)
    } finally {
        await client.close()
    }
}

migrateData()