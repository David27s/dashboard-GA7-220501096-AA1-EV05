import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { loginLimiter } from "../middlewares/rateLimit.js";
const router = Router();
router.post("/login", loginLimiter, (req, res) => {
  const result = z
    .object({ email: z.string().email(), password: z.string().min(1) })
    .safeParse(req.body);
  if (
    !result.success ||
    result.data.email !== process.env.ADMIN_EMAIL ||
    result.data.password !== process.env.ADMIN_PASSWORD
  )
    return res.status(401).json({ error: "Correo o contraseña incorrectos." });
  const token = jwt.sign({ email: result.data.email }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });
  res
    .cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
    })
    .json({ ok: true });
});
router.post("/logout", (req, res) => {
  res.clearCookie("token").json({ ok: true });
});
export default router;
