import express from "express";

import {onboard, signin, signout, signup} from "../controllers/auth.controller.js";
import protectRoute from "../middleware/auth.js";

const router = express.Router();

// New company + first admin
router.post("/onboarding", onboard);

// Login / Logout
router.post("/signin", signin);
router.post("/signout", signout);

// Additional users under existing company (admin-only)
router.post("/signup", protectRoute, signup);

// Check if authenticated
router.get("/me", protectRoute, (req, res) => {
    res.status(200).json({ success: true, user: req.user });
});

export default router;
