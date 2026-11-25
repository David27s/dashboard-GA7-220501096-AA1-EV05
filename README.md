# Sistema de gestión de reparación de celulares

MVP web para un taller de un administrador. Incluye recepción, estados, cobro único en COP, consulta pública con código y resumen de recaudo.

## Puesta en marcha

Inicie con `npm run dev` desde `backend/` y abra `http://localhost:3000` para seguimiento público o `http://localhost:3000/admin/login.html` para el panel.

## Pendiente antes de producción

- Ejecutar una prueba manual completa desde un celular: recepción, pago, entrega y consulta pública.
- Elegir el proveedor de alojamiento y configurar sus variables secretas fuera del repositorio.
- Definir una rutina de copias de seguridad para PostgreSQL.
- Cambiar periódicamente la contraseña del administrador y conservar el secreto JWT fuera del código.
