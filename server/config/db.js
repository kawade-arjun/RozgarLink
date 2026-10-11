const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const DEFAULT_URI = "mongodb+srv://1arjunk2:Arjun123@cluster0.jxff9c9.mongodb.net/rozgarlink?retryWrites=true&w=majority&appName=Cluster0";

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    throw err;
  }
}

module.exports = { connectDB };
