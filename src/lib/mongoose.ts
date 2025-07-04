import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

const uri = process.env.MONGODB_URI;

async function connectToDatabase() {
  try {
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set.');
    }
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
    process.exit(1);
  }
}

export default connectToDatabase;