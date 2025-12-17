import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import authRoutes from "./routes/auth.routes.js";
import { initDatabase } from "./model/db-init.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

await initDatabase();

app.use("/api/auth", authRoutes);
app.get("/health", (req, res) => {
    res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
