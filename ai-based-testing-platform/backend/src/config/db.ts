import mongoose from "mongoose";

const db = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGODB_URI ?? process.env.MONGO_URL;

        if (!mongoURI) {
            throw new Error("MONGODB_URI or MONGO_URL is missing from environment variables");
        }

        await mongoose.connect(mongoURI);

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
};

export default db;