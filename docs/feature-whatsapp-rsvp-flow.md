# Feature: WhatsApp RSVP Confirmation Flow
> Fecha: 2026-03-04

## Resumen
Sistema de confirmación de asistencia vía WhatsApp para eventos del OpenClaw Meetup. Los asistentes que se registran en Luma deben confirmar su asistencia respondiendo un mensaje de WhatsApp, lo que verifica su número de teléfono y reduce no-shows.

## Flujo Completo

### 1. Registro en Luma
- Usuario se registra en el evento de Luma
- Provee: nombre, email, número de teléfono
- Luma dispara trigger "Guest Registered"

### 2. Webhook: Luma → OpenClaw Meetups
- Luma envía evento de nuevo guest a nuestro webhook
- `POST /api/webhooks/luma`
- Payload incluye: name, email, phone

### 3. Procesamiento en OpenClaw Meetups
- Si el usuario ya existe en DB → agregar teléfono, NO pisar datos existentes
- Si es nuevo → crear registro de usuario
- Estado inicial:
  - `phone_verified: false`
  - `email_verified: false`
- Crear registro de asistente para el **evento específico**:
  - `attendance_confirmed: false`

### 4. Envío de WhatsApp vía WaSenderAPI
- Nuestro servicio hace `POST` a WaSenderAPI
- Envía mensaje al número de teléfono del usuario
- Mensaje: "Hola {nombre}! ¿Confirmás tu asistencia al {evento}? Respondé SÍ para confirmar."
- WaSenderAPI maneja la entrega del mensaje

### 5. Usuario Confirma por WhatsApp
- Usuario recibe el mensaje y responde SÍ
- WaSenderAPI recibe la respuesta
- WaSenderAPI dispara webhook a nuestro servicio

### 6. Webhook: WaSenderAPI → OpenClaw Meetups
- `POST /api/webhooks/wasender`
- Payload incluye: número de teléfono del remitente + texto de respuesta
- Nuestro servicio parsea la respuesta

### 7. Confirmación en Nuestro Servicio
Al recibir confirmación positiva:
1. Marcar `attendance_confirmed: true` + `confirmed_at: timestamp` en la tabla de asistentes del evento específico
2. Marcar `phone_verified: true` en el usuario
3. Enviar **email de confirmación** al usuario
4. Hacer `POST` a **API de Luma** para marcar al guest como asistente confirmado (update guest status)

## Modelo de Datos

### Tabla: users
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| name | text | Nombre |
| email | text | Email (unique) |
| phone | text | Número de teléfono |
| email_verified | boolean | default false |
| phone_verified | boolean | default false |
| created_at | timestamp | |
| updated_at | timestamp | |

### Tabla: event_attendees
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| event_id | text | ID del evento en Luma |
| attendance_confirmed | boolean | default false |
| confirmed_at | timestamp | Momento de confirmación |
| luma_guest_id | text | API ID del guest en Luma |
| created_at | timestamp | |

## Servicios Externos
| Servicio | Uso | Auth |
|----------|-----|------|
| Luma API | Recibir registros + actualizar estado de guest | `x-luma-api-key` header |
| WaSenderAPI | Enviar WhatsApp + recibir respuestas | Bearer token |
| Gmail SMTP | Enviar email de confirmación | App password |

## Consideraciones
- Luma no tiene webhooks nativos → usar Zapier como puente O polling periódico
- WaSenderAPI requiere sesión de WhatsApp activa (QR scan)
- El mensaje de WhatsApp debe ser amigable y corto
- Manejar respuestas ambiguas (no solo "SÍ" textual)
- Rate limits de WaSenderAPI
- Reintentos si el mensaje no se entrega
