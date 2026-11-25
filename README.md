# Sistema de gestión de reparación de celulares

MVP web para un taller de un administrador. Incluye recepción, estados, cobro único en COP, consulta pública con código y resumen de recaudo.

## Puesta en marcha

1. Copie `.env.example` como `.env` dentro de `backend/` y defina la conexión PostgreSQL y las credenciales del administrador.
2. Desde `backend/`, ejecute `npm install`.
3. Ejecute `npm run prisma:push` y después `npm run prisma:generate`.
4. Inicie con `npm run dev` y abra `http://localhost:3000` para seguimiento público o `http://localhost:3000/admin/login.html` para el panel.

En producción, configure las mismas variables de entorno en Render o Railway y use `npm start` como comando de inicio.

## Despliegue en Render

El archivo `render.yaml` crea un servicio web Node.js y una base de datos PostgreSQL. Para desplegar:

1. Suba este proyecto a un repositorio privado en GitHub.
2. En Render, elija **New +** → **Blueprint** y conecte el repositorio.
3. Render detectará `render.yaml`. Antes de confirmar, defina `ADMIN_EMAIL` y `ADMIN_PASSWORD` con los valores del taller. `JWT_SECRET` se genera automáticamente.
4. Cuando termine el despliegue, abra la URL que Render muestra. La comprobación de salud estará disponible en `/salud`.

El comando de compilación crea o actualiza las tablas con el esquema del MVP. En producción con datos importantes, use migraciones versionadas antes de cambiar el modelo de datos.
