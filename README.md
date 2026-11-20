# Probus Consultores

Landing page para Probus Consultores: servicios contables, tributarios y de seguridad social en La Paz, Bolivia.

## Desarrollo

```sh
npm install
npm run dev
```

El sitio estará en `http://localhost:4321`.

## Producción

La landing page se prerenderiza como HTML estático y el endpoint del formulario se ejecuta en un servidor Node.

```sh
npm run build
npm start
```

El servidor Node usa `HOST` y `PORT` (por defecto escucha en `0.0.0.0:4321`).

## Formulario de contacto

El formulario envía un correo mediante SMTP con Nodemailer. Copia `.env.example` como `.env` y completa los valores:

| Variable | Descripción |
| --- | --- |
| `SMTP_HOST` | Servidor SMTP (por ejemplo `smtp.gmail.com`) |
| `SMTP_PORT` | Puerto SMTP (`587` para STARTTLS, `465` para SSL) |
| `SMTP_SECURE` | `true` solo para SSL en el puerto 465 |
| `SMTP_USER` | Usuario SMTP |
| `SMTP_PASSWORD` | Contraseña o contraseña de aplicación |
| `SMTP_FROM` | Dirección desde la que se envía el correo |
| `CONTACT_TO_EMAIL` | Bandeja que recibe las consultas |

Sin estas variables el formulario responde con un error claro; la página sigue funcionando normalmente.

El endpoint es `POST /api/contact` y valida nombre, correo, mensaje y servicio. Incluye un campo oculto anti-spam.

## Estructura relevante

- `src/pages/index.astro`: secciones de la landing page.
- `src/components/ContactForm.astro`: formulario y estados de envío.
- `src/pages/api/contact.ts`: endpoint SMTP.
- `src/data/site.ts`: datos de contacto y servicios.
- `src/assets/probus-isotipo.svg`: isotipo limpio, sin fondo blanco.
- `public/*.webp`: fotografías optimizadas para web.

## Notas

- Colores: azul `#0B2545`, dorado `#C9A227`, perla `#F4F6F3`.
- Tipografías locales: Archivo (títulos) y Public Sans (cuerpo), servidas desde `@fontsource-variable`.
- Las imágenes de `public/` se sirven tal cual; ya están redimensionadas y comprimidas en WebP.
