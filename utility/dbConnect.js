import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()
const connectToDatabase =async()=>{
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL
        if (!mongoUri) {
            console.error('MongoDB connection string is not set. Please define MONGO_URI in .env')
            process.exit(1)
        }
        await mongoose.connect(mongoUri)
        console.log("database connected")
    } catch (error) {
        console.log(error)
    }
}

export default connectToDatabase