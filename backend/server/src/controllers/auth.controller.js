import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import db from "../lib/db.js";


function setAuthCookie(res, token) {
    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
    });
}


async function onboard(req, res) {
    try {
        const { company, user } = req.body || {};

        if (!company || !user) {
            return res.status(400).json({
                success: false,
                message: "Both company and user objects are required",
            });
        }

        const { legalName, gstin, domain, website, industryCategory } = company;
        let { fullName, email, password, role } = user;

        if (!legalName) {
            return res.status(400).json({ success: false, message: "Company legalName is required" });
        }
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "User email and password are required",
            });
        }

        email = email.toLowerCase();
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        // Check user email already exists
        const existingUser = await db.query(
            "SELECT id FROM users WHERE email = $1 LIMIT 1",
            [email]
        );
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ success: false, message: "User with this email already exists" });
        }

        // Optionally check GSTIN uniqueness
        if (gstin) {
            const existingCompany = await db.query(
                "SELECT id FROM companies WHERE gstin = $1 LIMIT 1",
                [gstin]
            );
            if (existingCompany.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "A company with this GSTIN already exists",
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction
        await db.query("BEGIN");

        const companyResult = await db.query(
            `INSERT INTO companies (legal_name, gstin, domain, website, industry_category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, legal_name, gstin, domain, website, industry_category`,
            [legalName, gstin || null, domain || null, website || null, industryCategory || null]
        );

        const createdCompany = companyResult.rows[0];

        const userResult = await db.query(
            `INSERT INTO users (company_id, email, password, full_name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role, company_id`,
            [createdCompany.id, email, hashedPassword, fullName || null, role || "admin", "active"]
        );

        const createdUser = userResult.rows[0];

        await db.query("COMMIT");

        // JWT + cookie
        const token = jwt.sign(
            {
                id: createdUser.id,
                email: createdUser.email,
                role: createdUser.role,
                companyId: createdCompany.id,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
        );

        setAuthCookie(res, token);

        return res.status(201).json({
            success: true,
            company: createdCompany,
            user: createdUser,
        });
    } catch (err) {
        console.error("ONBOARD_ERROR", err);
        await db.query("ROLLBACK").catch(() => {});
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}


async function signin(req, res) {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "email and password are required",
            });
        }

        email = email.toLowerCase();

        const result = await db.query(
            "SELECT id, email, password, full_name, role, company_id FROM users WHERE email = $1 LIMIT 1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.company_id,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
        );

        setAuthCookie(res, token);

        return res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                companyId: user.company_id,
            },
        });
    } catch (err) {
        console.error("SIGNIN_ERROR", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}


async function signout(_req, res) {
    res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
    });

    return res.json({
        success: true,
        message: "Signed out",
    });
}


async function signup(req, res) {
    try {
        const authUser = req.user;

        if (!authUser || !authUser.companyId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated or company not found",
            });
        }

        if (authUser.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can create new users",
            });
        }

        let { email, password, fullName, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "email and password are required",
            });
        }

        email = email.toLowerCase();
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        const existing = await db.query(
            "SELECT id FROM users WHERE email = $1 LIMIT 1",
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: "User already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);

        const result = await db.query(
            `INSERT INTO users (company_id, email, password, full_name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role, company_id`,
            [authUser.companyId, email, hashed, fullName || null, role || "sales", "active"]
        );

        const created = result.rows[0];

        return res.status(201).json({
            success: true,
            user: created,
        });
    } catch (err) {
        console.error("SIGNUP_ERROR", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export { onboard, signin, signout, signup };