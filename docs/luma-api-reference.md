# Luma API — Referencia Técnica
> Fuente: docs.lu.ma, NuGet SDK, Zapier integration docs

## Overview
API REST JSON para gestionar eventos y guests en lu.ma.

## Requisitos
- **Luma Plus** (plan pago) para acceder a la API
- API Key generada en: https://lu.ma/personal/settings/options

## Auth
- Header: `x-luma-api-key: YOUR_API_KEY`

## Base URL
```
https://public-api.luma.com/v1
```

> ⚠️ Hay dos base URLs en la documentación. El actual (2026) es `public-api.luma.com`. El legacy `api.lu.ma/public/v1` puede seguir funcionando.

## Test de conexión
```bash
curl -X GET https://public-api.luma.com/v1/event/get \
  -H "x-luma-api-key: YOUR_API_KEY"
```

## Endpoints de Eventos

### Crear Evento
```
POST /public/v1/event/create
```
```json
{
  "name": "OpenClaw Meetup #3",
  "start_at": "2026-04-03T21:00:00Z",
  "end_at": "2026-04-03T23:00:00Z",
  "timezone": "America/Buenos_Aires",
  "require_rsvp_approval": true,
  "meeting_url": "https://..."
}
```

### Obtener Evento
```
GET /public/v1/event/get?api_id=EVENT_ID
```

### Actualizar Evento
```
POST /public/v1/event/update
```

### Listar Eventos del Calendario
```
GET /public/v1/calendar/list-events
```
Params: `before`, `after` (ISO 8601 dates)

## Endpoints de Guests

### Listar Guests de un Evento
Ref: https://docs.luma.com/reference/get_v1-event-get-guests
```
GET /v1/event/get-guests?event_api_id=EVENT_ID
```
Params opcionales:
- `approval_status` — filtrar por estado (approved, pending, etc.)
- `sort_column` — columna de ordenamiento
- `sort_direction` — asc/desc

### Obtener Guest Específico
```
GET /public/v1/event/get-guest
```
Params (uno de):
- `event_api_id` + `api_id` (Guest API ID)
- `event_api_id` + `email`
- `event_api_id` + `proxy_key`

### Agregar Guest
```
POST /public/v1/event/add-guest
```
Agrega un guest con status "Going" directamente.

### Actualizar Estado de Guest
Ref: https://docs.luma.com/reference/post_v1-event-update-guest-status
```
POST /v1/event/update-guest-status
```
Usado para aprobar/rechazar/cambiar estado de un guest.

```bash
curl -X POST https://public-api.luma.com/v1/event/update-guest-status \
  -H "x-luma-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event_api_id": "EVENT_ID", "guest_api_id": "GUEST_ID", "status": "approved"}'
```

### Agregar Host
```
POST /public/v1/event/add-host
```

## Endpoints de Calendario

### Listar Eventos
```
GET /public/v1/calendar/list-events
```

### Importar Personas
```
POST /public/v1/calendar/import-people
```
Importa personas al calendario para invitarlas a eventos y newsletters.

## Webhooks (vía Zapier)

Luma no tiene webhooks nativos directos, pero sí triggers vía Zapier:
- **Guest Registered** — cuando alguien se registra (nuevo)
- **Guest Updated** — cuando cambia un guest existente
- **Ticket Registered** — por cada ticket comprado
- **Event Updated** — cuando se actualiza un evento

### Alternativa sin Zapier
Polling: consultar `/event/get-guests` periódicamente para detectar nuevos registros.

### Alternativa con Zapier
Trigger "Guest Registered" → Webhook action → POST a nuestro servicio

## Cupones

### Crear Cupón
```
POST /public/v1/event/create-coupon
```

### Actualizar Cupón
```
POST /public/v1/event/update-coupon
```

## Modelo de Datos

### Event
```typescript
interface LumaEvent {
  api_id: string;
  name: string;
  start_at: string;        // ISO 8601
  end_at: string;           // ISO 8601
  timezone: string;
  description: string;
  url: string;              // lu.ma URL
  cover_url: string;
  geo_address_json: object;
  require_rsvp_approval: boolean;
}
```

### Guest (EventEntry)
```typescript
interface LumaGuest {
  api_id: string;           // Guest unique ID
  event_api_id: string;
  name: string;
  email: string;
  phone_number?: string;
  approval_status: string;  // "approved", "pending_approval", "declined"
  registered_at: string;    // ISO 8601
}
```

## Notas Importantes
- **Luma Plus requerido** para API access
- No tiene webhooks nativos (requiere Zapier o polling)
- Rate limits no documentados públicamente
- Todos los requests son JSON
- Paginación: los endpoints de lista devuelven cursor-based pagination
