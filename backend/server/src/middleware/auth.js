import jwt from "jsonwebtoken";

function protectRoute(req, res, next) {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            companyId: decoded.companyId,
        };

        next();
    } catch (err) {
        console.error("protectRoute error:", err);
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
}

export default protectRoute;