import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  crearOrden,
  listarOrdenes,
  actualizarOrden,
  resumen,
} from "../controllers/order.controller.js";
const router = Router();
router.use(requireAuth);
router.get("/", listarOrdenes);
router.post("/", crearOrden);
router.patch("/:id", actualizarOrden);
router.get("/resumen", resumen);
export default router;
