import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';

const app = express();


// dotenv config
dotenv.config();

// port
const PORT = process.env.PORT || 5000;

/// db 
connectDB();


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})