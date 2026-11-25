import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  actualizarOrden,
  crearOrden,
  listarOrdenes,
  resumen,
  seguimiento,
} from "../src/controllers/order.controller.js";

const prisma = new PrismaClient();
const telefono = `QA-${Date.now()}`;
let codigo;

function respuesta() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function siguiente(error) {
  if (error) throw error;
}

function asegurar(condicion, mensaje) {
  if (!condicion) throw new Error(`Prueba fallida: ${mensaje}`);
}

try {
  const crear = respuesta();
  await crearOrden(
    {
      body: {
        cliente: { nombre: "QA Automatizado", telefono },
        marca: "Prueba",
        modelo: "QA-1",
        danoReportado: "Validación automatizada del sistema",
        notaAvance: "Orden creada para QA",
        valorTotal: 0,
        pagado: false,
      },
    },
    crear,
    siguiente,
  );
  asegurar(crear.statusCode === 201, "la orden debe crearse");
  asegurar(/^REP-\d{4}$/.test(crear.body.codigo), "el código debe ser REP-XXXX");
  codigo = crear.body.codigo;

  const publico = respuesta();
  await seguimiento({ params: { codigo } }, publico, siguiente);
  asegurar(publico.statusCode === 200, "el seguimiento público debe responder");
  asegurar(publico.body.modelo === "QA-1", "el seguimiento debe mostrar el equipo");

  const entregaSinPago = respuesta();
  await actualizarOrden(
    { params: { id: crear.body.id }, body: { estado: "ENTREGADO" } },
    entregaSinPago,
    siguiente,
  );
  asegurar(
    entregaSinPago.statusCode === 400,
    "no se debe entregar una orden sin pago",
  );

  const entregaPagada = respuesta();
  await actualizarOrden(
    {
      params: { id: crear.body.id },
      body: {
        estado: "ENTREGADO",
        valorTotal: 150000,
        metodoPago: "NEQUI",
        pagado: true,
        notaAvance: "Equipo entregado y pagado.",
      },
    },
    entregaPagada,
    siguiente,
  );
  asegurar(entregaPagada.statusCode === 200, "la orden pagada debe entregarse");
  asegurar(entregaPagada.body.pagado, "el pago debe quedar registrado");

  const lista = respuesta();
  await listarOrdenes({}, lista, siguiente);
  asegurar(
    lista.body.some((orden) => orden.codigo === codigo),
    "la orden debe aparecer en el panel",
  );

  const totales = respuesta();
  await resumen({}, totales, siguiente);
  asegurar(typeof totales.body.cobradoHoy === "number", "el resumen debe calcular cobros");

  console.log("QA correcto: creación, seguimiento, pago, entrega y resumen.");
} finally {
  if (codigo) await prisma.orden.deleteMany({ where: { codigo } });
  await prisma.cliente.deleteMany({ where: { telefono } });
  await prisma.$disconnect();
}
