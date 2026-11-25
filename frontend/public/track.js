const form = document.querySelector("#formulario"),
  codigo = document.querySelector("#codigo"),
  resultado = document.querySelector("#resultado"),
  mensaje = document.querySelector("#mensaje"),
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
    );
const estado = (e) =>
  ({
    RECIBIDO: "Recibido",
    EN_REPARACION: "En reparación",
    TERMINADO: "Terminado",
    ENTREGADO: "Entregado",
    NO_REPARADO: "No reparado",
  })[e] || e;
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensaje.textContent = "";
  resultado.classList.add("oculto");
  try {
    const r = await fetch(
        `/api/publico/seguimiento/${encodeURIComponent(codigo.value.trim().toUpperCase())}`,
      ),
      d = await r.json();
    if (!r.ok) throw Error(d.error);
    resultado.innerHTML = `<h2>${escapar(d.marca)} ${escapar(d.modelo)}</h2><p><span class="etiqueta">${estado(d.estado)}</span></p><p><b>Avance:</b> ${escapar(d.notaAvance || "Aún no hay novedades.")}</p><p><b>Fecha estimada:</b> ${d.fechaEstimada ? new Date(d.fechaEstimada).toLocaleDateString("es-CO") : "Por confirmar"}</p>`;
    resultado.classList.remove("oculto");
  } catch (err) {
    mensaje.textContent = err.message;
  }
});
