const correo = document.querySelector("#email");
const clave = document.querySelector("#password");
const mensaje = document.querySelector("#mensaje");

document.querySelector("#login").onsubmit = async (event) => {
  event.preventDefault();
  const respuesta = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: correo.value, password: clave.value }),
  });
  const datos = await respuesta.json();

  if (respuesta.ok) {
    location = "dashboard.html";
    return;
  }
  mensaje.textContent = datos.error;
};
