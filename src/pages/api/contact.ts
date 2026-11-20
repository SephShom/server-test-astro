import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const prerender = false;

const SERVICES = new Set([
  'Contabilidad integral',
  'Estados financieros',
  'Cumplimiento tributario',
  'Planillas y seguridad social',
  'Asesoría en formalización'
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  service?: unknown;
  message?: unknown;
  website?: unknown;
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.replace(/[\r\n]+/g, ' ').trim().slice(0, maxLength) : '';
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entities[char];
  });
}

export const POST: APIRoute = async ({ request }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ ok: false, error: 'Solicitud inválida.' }, 415);
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return json({ ok: false, error: 'No pudimos leer los datos del formulario.' }, 400);
  }

  // Campo oculto para bots: si se llena, respondemos como si todo estuviera bien.
  if (typeof payload.website === 'string' && payload.website.length > 0) {
    return json({ ok: true, message: 'Mensaje enviado.' });
  }

  const name = clean(payload.name, 100);
  const email = clean(payload.email, 150).toLowerCase();
  const phone = clean(payload.phone, 40);
  const service = clean(payload.service, 80);
  const message = clean(payload.message, 3000);

  if (name.length < 2) {
    return json({ ok: false, error: 'Escribe tu nombre.' }, 400);
  }
  if (!EMAIL_PATTERN.test(email)) {
    return json({ ok: false, error: 'Escribe un correo electrónico válido.' }, 400);
  }
  if (message.length < 10) {
    return json({ ok: false, error: 'Cuéntanos un poco más sobre tu consulta.' }, 400);
  }
  if (service && !SERVICES.has(service)) {
    return json({ ok: false, error: 'Selecciona uno de los servicios listados.' }, 400);
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM,
    CONTACT_TO_EMAIL
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM || !CONTACT_TO_EMAIL) {
    return json(
      {
        ok: false,
        error: 'El formulario todavía no está configurado. Revisa las variables de entorno SMTP.'
      },
      503
    );
  }

  const port = Number(SMTP_PORT ?? 587);
  const secure = SMTP_SECURE === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number.isFinite(port) ? port : 587,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
  });

  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    phone: escapeHtml(phone),
    service: escapeHtml(service || 'No especificado'),
    message: escapeHtml(message).replace(/\n/g, '<br>')
  };

  const text = [
    `Nombre: ${name}`,
    `Correo: ${email}`,
    phone ? `Teléfono / WhatsApp: ${phone}` : null,
    `Servicio de interés: ${service || 'No especificado'}`,
    '',
    message
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0b2545; line-height: 1.6;">
      <h2 style="margin: 0 0 16px; font-size: 20px;">Nueva consulta desde la web</h2>
      <p style="margin: 0 0 8px;"><strong>Nombre:</strong> ${safe.name}</p>
      <p style="margin: 0 0 8px;"><strong>Correo:</strong> ${safe.email}</p>
      ${phone ? `<p style="margin: 0 0 8px;"><strong>Teléfono / WhatsApp:</strong> ${safe.phone}</p>` : ''}
      <p style="margin: 0 0 20px;"><strong>Servicio de interés:</strong> ${safe.service}</p>
      <p style="margin: 0; padding-top: 16px; border-top: 1px solid #d9dee4;">${safe.message}</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: CONTACT_TO_EMAIL,
      replyTo: email,
      subject: `Consulta web de ${name} — Probus Consultores`,
      text,
      html
    });

    return json({ ok: true, message: 'Mensaje enviado. Te responderemos pronto.' });
  } catch (error) {
    console.error('No se pudo enviar el correo de contacto:', error);
    return json(
      { ok: false, error: 'No pudimos enviar tu mensaje. Inténtalo de nuevo o escríbenos por WhatsApp.' },
      502
    );
  }
};
