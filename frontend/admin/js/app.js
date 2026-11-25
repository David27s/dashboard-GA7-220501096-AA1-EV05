const $ = (s) => document.querySelector(s),
  dinero = (n) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n),
  escapar = (v) =>
    String(v ?? "").replace(
      /[&<>'"]/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[c],
    ),
  nombres = {
    RECIBIDO: "Recibido",
    EN_REPARACION: "En reparación",
    TERMINADO: "Terminado",
    ENTREGADO: "Entregado",
    NO_REPARADO: "No reparado",
  };
let ordenActual = null;
async function api(url, options = {}) {
  const r = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (r.status === 401) {
    location = "login.html";
    throw Error("Sesión vencida");
  }
  const d = await r.json();
  if (!r.ok) throw Error(d.error || "No se pudo completar");
  return d;
}
async function cargar() {
  try {
    const [ordenes, res] = await Promise.all([
      api("/api/ordenes"),
      api("/api/ordenes/resumen"),
    ]);
    window.ordenesActuales = ordenes;
    $("#resumen").innerHTML =
      ["RECIBIDO", "EN_REPARACION", "TERMINADO", "ENTREGADO", "NO_REPARADO"]
        .map(
          (e) =>
            `<div class="campo">${nombres[e]}<span class="numero">${res.porEstado[e] || 0}</span></div>`,
        )
        .join("") +
      `<div class="campo">Cobrado hoy<span class="numero">${dinero(res.cobradoHoy)}</span></div><div class="campo">Cobrado este mes<span class="numero">${dinero(res.cobradoMes)}</span></div>`;
    $("#ordenes").innerHTML = ordenes
      .map(
        (o) =>
          `<tr><td><b>${escapar(o.codigo)}</b><br>${escapar(o.cliente.nombre)}</td><td>${escapar(o.marca)} ${escapar(o.modelo)}</td><td><span class="etiqueta">${nombres[o.estado]}</span></td><td>${o.pagado ? "Pagado" : "Pendiente"}<br>${dinero(o.valorTotal)}</td><td><button data-id="${o.id}" class="editar">Gestionar</button></td></tr>`,
      )
      .join("");
  } catch (e) {
    $("#aviso").textContent = e.message;
    $("#aviso").className = "error";
  }
}
$("#nuevaOrden").onsubmit = async (e) => {
  e.preventDefault();
  const f = new FormData(e.target),
    v = Object.fromEntries(f);
  const body = {
    cliente: { nombre: v.nombre, telefono: v.telefono },
    marca: v.marca,
    modelo: v.modelo,
    danoReportado: v.danoReportado,
    notaAvance: v.notaAvance,
    valorTotal: Number(v.valorTotal || 0),
    metodoPago: v.metodoPago || undefined,
    pagado: f.get("pagado") === "on",
  };
  try {
    const o = await api("/api/ordenes", {
      method: "POST",
      body: JSON.stringify(body),
    });
    $("#aviso").textContent = `Orden creada: ${o.codigo}`;
    $("#aviso").className = "exito";
    e.target.reset();
    cargar();
  } catch (err) {
    $("#aviso").textContent = err.message;
    $("#aviso").className = "error";
  }
};
$("#ordenes").onclick = (e) => {
  const b = e.target.closest(".editar");
  if (!b) return;
  ordenActual = window.ordenesActuales.find(
    (o) => o.id === Number(b.dataset.id),
  );
  if (!ordenActual) return;
  const f = $("#formGestion");
  $("#tituloGestion").textContent =
    `Gestionar ${ordenActual.codigo} · ${ordenActual.marca} ${ordenActual.modelo}`;
  f.estado.value = ordenActual.estado;
  f.valorTotal.value = ordenActual.valorTotal;
  f.metodoPago.value = ordenActual.metodoPago || "";
  f.notaAvance.value = ordenActual.notaAvance || "";
  f.pagado.checked = ordenActual.pagado;
  f.fechaEstimada.value = ordenActual.fechaEstimada
    ? ordenActual.fechaEstimada.slice(0, 10)
    : "";
  $("#avisoGestion").textContent = "";
  $("#gestor").showModal();
};
$("#formGestion").onsubmit = async (e) => {
  e.preventDefault();
  if (!ordenActual) return;
  const datos = new FormData(e.target),
    fecha = datos.get("fechaEstimada");
  const body = {
    estado: datos.get("estado"),
    valorTotal: Number(datos.get("valorTotal")),
    metodoPago: datos.get("metodoPago") || null,
    notaAvance: datos.get("notaAvance"),
    pagado: datos.get("pagado") === "on",
    fechaEstimada: fecha ? new Date(`${fecha}T12:00:00`).toISOString() : null,
  };
  try {
    await api(`/api/ordenes/${ordenActual.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    $("#gestor").close();
    $("#aviso").textContent = `Cambios guardados para ${ordenActual.codigo}.`;
    $("#aviso").className = "exito";
    cargar();
  } catch (err) {
    $("#avisoGestion").textContent = err.message;
    $("#avisoGestion").className = "error";
  }
};
$("#cerrarGestor").onclick = () => $("#gestor").close();
$("#cancelarGestor").onclick = () => $("#gestor").close();
$("#formGestion").elements.fechaEstimada.addEventListener("click", (e) => {
  if (e.target.showPicker) e.target.showPicker();
});
$("#recargar").onclick = cargar;
$("#salir").onclick = async () => {
  await api("/api/auth/logout", { method: "POST" });
  location = "login.html";
};
cargar();
