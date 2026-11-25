import { Router } from "express";
import { seguimiento } from "../controllers/order.controller.js";
import { trackingLimiter } from "../middlewares/rateLimit.js";
const router = Router();
router.get("/seguimiento/:codigo", trackingLimiter, seguimiento);
export default router;
