import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

router.get("/projects", (_req, res) => {
    res.json([
        { name: "demo-org/demo-repo", status: "connected", coverage: 72 },
        { name: "acme/webapp", status: "connected", coverage: 58 },
    ]);
});

router.get("/generations", (_req, res) => {
    res.json([
        { id: "run_001", scope: "endpoint", status: "proposal:draft", cost: "$0.12" },
        { id: "run_002", scope: "file", status: "running", cost: "$0.08" },
    ]);
});

router.get("/api-keys", (_req, res) => {
    res.json([
        { name: "Production", key: "aitp_live_••••••••", created: "2026-10-01" },
        { name: "Staging", key: "aitp_test_••••••••", created: "2026-10-12" },
    ]);
});

router.post("/projects/validate", (req, res) => {
    const { url } = req.body ?? {};
    if (typeof url !== "string" || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(url)) {
        return res.status(400).json({ valid: false, message: "Invalid GitHub repository URL" });
    }
    return res.json({ valid: true, message: "Repository is valid" });
});

export default router;
