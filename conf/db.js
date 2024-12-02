const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://amin-mdx:aqkjDMEwJVn7NKWV@m00847012.7u9f0.mongodb.net/?retryWrites=true&w=majority&appName=M00847012";
const client = new MongoClient(uri);

let db;

async function connectToDB() {
    try {
        await client.connect();
        db = client.db('schoolApp'); // database name
        console.log('Connected to MongoDB');
        console.log('Connected to database:', db.databaseName); // Log the database name
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

function getDB() {
    if (!db) throw new Error('Database not initialized');
    return db;
}

module.exports = { connectToDB, getDB };
