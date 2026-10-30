import mongoose, { Schema, Document } from "mongoose";




//// ts data type 

export interface IUser extends Document {
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}




/// userSchema 
const userSchema = new Schema<IUser>(
  {
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    firstName: String,
    lastName: String,
    imageUrl: String,
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;