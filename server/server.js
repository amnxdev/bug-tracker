import dns from 'node:dns';
import app from './src/app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Fix for Windows & ISP-specific querySrv ECONNREFUSED with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Fall back to system DNS
}

const PORT = process.env.PORT || 5000;

// 1. ALWAYS start the server so frontend requests are never rejected with connection refused
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 2. Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('Mongo Connection Error:', err.message);
    console.error('-> To fix this, update your password or user in MongoDB Atlas Dashboard.');
  }
};

connectDB();
