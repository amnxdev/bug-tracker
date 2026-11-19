import 'dotenv/config';
import dns from 'node:dns';
import app from './src/app.js';
import mongoose from 'mongoose';

// Fix for Windows & ISP-specific querySrv ECONNREFUSED with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Fall back to system DNS
}

const PORT = process.env.PORT || 5000;

// Helper: Safely sanitize MongoDB URI to encode special characters in password
// and strip any accidental whitespace/pasted text
export const sanitizeMongoUri = (rawUri) => {
  if (!rawUri) return rawUri;
  let uri = rawUri.trim().split(/\s+/)[0]; // strip trailing spaces or chat text
  
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.*)@([^/?#]+)(.*)$/);
  if (match) {
    const [, protocol, username, rawPassword, host, rest] = match;
    let decodedPassword = rawPassword;
    try {
      decodedPassword = decodeURIComponent(rawPassword);
    } catch {}
    const safePassword = encodeURIComponent(decodedPassword);
    let safeRest = rest;
    if (!safeRest || safeRest === '/' || safeRest === '') {
      safeRest = '/bugtracker?retryWrites=true&w=majority';
    }
    return `${protocol}${username}:${safePassword}@${host}${safeRest}`;
  }
  return uri;
};

// 1. ALWAYS start HTTP server so clients are never rejected with connection refused
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 2. Connect to MongoDB with sanitized URI
const connectDB = async () => {
  const cleanUri = sanitizeMongoUri(process.env.MONGO_URI);
  try {
    await mongoose.connect(cleanUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('Mongo Connection Error:', err.message);
    console.error('-> Tip: In MongoDB Atlas Dashboard, make sure user "amxn" has password "SrZF_F\"2:=*Pa9J" saved.');
  }
};

connectDB();
