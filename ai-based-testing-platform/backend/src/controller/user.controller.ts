import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import User from "../models/user.model.ts";









/// request and response 
export const syncUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const user = await User.findOneAndUpdate(
      { clerkUserId: userId },
      {
        $setOnInsert: {
          clerkUserId: userId,
          email: "placeholder@example.com",
        },
      },
      {
        new: true, 
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Sync user error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};