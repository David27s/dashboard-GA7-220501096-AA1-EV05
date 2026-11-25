import { z } from "zod";
import { PrismaClient, EstadoOrden } from "@prisma/client";

const prisma = new PrismaClient();
const estados = [
  "RECIBIDO",
  "EN_REPARACION",
  "TERMINADO",
  "ENTREGADO",
  "NO_REPARADO",
];
const metodos = ["EFECTIVO", "TRANSFERENCIA", "NEQUI", "DAVIPLATA"];

const crearSchema = z.object({
  cliente: z.object({
    nombre: z.string().trim().min(2).max(100),
    telefono: z.string().trim().min(7).max(25),
  }),
  marca: z.string().trim().min(1).max(60),
  modelo: z.string().trim().min(1).max(80),
  danoReportado: z.string().trim().min(3).max(1000),
  notaAvance: z.string().trim().max(1000).optional(),
  fechaEstimada: z.string().datetime().optional(),
  valorTotal: z.number().int().min(0).max(100000000).default(0),
  metodoPago: z.enum(metodos).optional(),
  pagado: z.boolean().optional().default(false),
});
const actualizarSchema = z.object({
  estado: z.enum(estados).optional(),
  notaAvance: z.string().trim().max(1000).optional(),
  fechaEstimada: z.string().datetime().nullable().optional(),
  valorTotal: z.number().int().min(0).max(100000000).optional(),
  metodoPago: z.enum(metodos).nullable().optional(),
  pagado: z.boolean().optional(),
});

function codigo() {
  return `REP-${Math.floor(1000 + Math.random() * 9000)}`;
}
async function codigoDisponible() {
  for (let i = 0; i < 10; i++) {
    const value = codigo();
    if (!(await prisma.orden.findUnique({ where: { codigo: value } })))
      return value;
  }
  throw new Error("No se pudo generar código");
}
function formato(orden) {
  return {
    ...orden,
    estado: orden.estado,
    fechaEstimada: orden.fechaEstimada?.toISOString() ?? null,
  };
}

export async function crearOrden(req, res, next) {
  try {
    const data = crearSchema.parse(req.body);
    if (data.pagado && (!data.metodoPago || data.valorTotal <= 0))
      return res
        .status(400)
        .json({ error: "Un pago requiere valor y método de pago." });
    const cliente = await prisma.cliente.upsert({
      where: { telefono: data.cliente.telefono },
      update: { nombre: data.cliente.nombre },
      create: data.cliente,
    });
    const orden = await prisma.orden.create({
      data: {
        ...data,
        cliente: undefined,
        clienteId: cliente.id,
        codigo: await codigoDisponible(),
        fechaEstimada: data.fechaEstimada ? new Date(data.fechaEstimada) : null,
        fechaPago: data.pagado ? new Date() : null,
      },
      include: { cliente: true },
    });
    res.status(201).json(formato(orden));
  } catch (error) {
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ error: "Datos inválidos.", details: error.flatten() });
    next(error);
  }
}

export async function listarOrdenes(req, res, next) {
  try {
    const ordenes = await prisma.orden.findMany({
      include: { cliente: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json(ordenes.map(formato));
  } catch (e) {
    next(e);
  }
}

export async function actualizarOrden(req, res, next) {
  try {
    const data = actualizarSchema.parse(req.body);
    const actual = await prisma.orden.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!actual) return res.status(404).json({ error: "Orden no encontrada." });
    const estado = data.estado ?? actual.estado,
      pagado = data.pagado ?? actual.pagado,
      valorTotal = data.valorTotal ?? actual.valorTotal,
      metodoPago =
        data.metodoPago === undefined ? actual.metodoPago : data.metodoPago;
    if (estado === EstadoOrden.ENTREGADO && !pagado)
      return res
        .status(400)
        .json({ error: "Para entregar la orden debe estar pagada." });
    if (pagado && (!metodoPago || valorTotal <= 0))
      return res
        .status(400)
        .json({ error: "Un pago requiere valor total y método de pago." });
    const orden = await prisma.orden.update({
      where: { id: actual.id },
      data: {
        ...data,
        fechaEstimada:
          data.fechaEstimada === undefined
            ? undefined
            : data.fechaEstimada
              ? new Date(data.fechaEstimada)
              : null,
        fechaPago:
          pagado && !actual.pagado
            ? new Date()
            : data.pagado === false
              ? null
              : undefined,
      },
      include: { cliente: true },
    });
    res.json(formato(orden));
  } catch (error) {
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ error: "Datos inválidos.", details: error.flatten() });
    next(error);
  }
}

export async function resumen(req, res, next) {
  try {
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);
    const inicioMes = new Date(
      inicioDia.getFullYear(),
      inicioDia.getMonth(),
      1,
    );
    const [porEstado, dia, mes] = await Promise.all([
      prisma.orden.groupBy({ by: ["estado"], _count: { _all: true } }),
      prisma.orden.aggregate({
        _sum: { valorTotal: true },
        where: { pagado: true, fechaPago: { gte: inicioDia } },
      }),
      prisma.orden.aggregate({
        _sum: { valorTotal: true },
        where: { pagado: true, fechaPago: { gte: inicioMes } },
      }),
    ]);
    res.json({
      porEstado: Object.fromEntries(
        porEstado.map((x) => [x.estado, x._count._all]),
      ),
      cobradoHoy: dia._sum.valorTotal ?? 0,
      cobradoMes: mes._sum.valorTotal ?? 0,
    });
  } catch (e) {
    next(e);
  }
}

export async function seguimiento(req, res, next) {
  try {
    const orden = await prisma.orden.findUnique({
      where: { codigo: req.params.codigo.toUpperCase() },
      select: {
        codigo: true,
        marca: true,
        modelo: true,
        estado: true,
        notaAvance: true,
        fechaEstimada: true,
      },
    });
    if (!orden)
      return res
        .status(404)
        .json({ error: "No encontramos una orden con ese código." });
    res.json(formato(orden));
  } catch (e) {
    next(e);
  }
}
