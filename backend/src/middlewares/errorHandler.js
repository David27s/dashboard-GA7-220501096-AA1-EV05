export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === "P2002")
    return res
      .status(409)
      .json({ error: "Ya existe un registro con esos datos." });
  res.status(500).json({ error: "Ocurrió un error inesperado." });
}
