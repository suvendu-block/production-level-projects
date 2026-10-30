import { getAuth } from "@clerk/express";
import { Router, type Request, type Response } from "express";

const router = Router();

router.get("/profile", (req: Request, res: Response) => {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }

    return res.status(200).json({
        success: true,
        userId,
    });
});

export default router;