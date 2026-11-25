import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./src/routes/auth.routes.js";
import orderRoutes from "./src/routes/orders.routes.js";
import publicRoutes from "./src/routes/public.routes.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/ordenes", orderRoutes);
app.use("/api/publico", publicRoutes);
const sinCache = {
  setHeaders: (res) => res.setHeader("Cache-Control", "no-store"),
};
app.use(
  "/admin",
  express.static(path.join(__dirname, "../frontend/admin"), sinCache),
);
app.use(express.static(path.join(__dirname, "../frontend/public"), sinCache));
app.get("/salud", (req, res) => res.json({ ok: true }));
app.use(errorHandler);
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Taller listo en http://localhost:${port}`));
