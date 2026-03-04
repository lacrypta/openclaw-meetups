# WaSenderAPI — Referencia Técnica
> Fuente: wasenderapi.com, PyPI, GitHub (AroraShreshth/wasender)

## Overview
API unofficial de WhatsApp. Se conecta vía WhatsApp Web (QR scan). Sin verificación de Meta Business.

## Auth
- **API Key** (session-specific): Para enviar mensajes, contactos, grupos
- **Personal Access Token (PAT)**: Para gestión de sesiones (crear, listar, eliminar)
- **Webhook Secret**: Para verificar webhooks entrantes
- Header: `Authorization: Bearer <API_KEY>`

## Base URL
```
https://wasenderapi.com/api
```

## SDK (TypeScript)
```bash
npm install wasenderapi
```

### Inicialización
```typescript
import { createWasender } from "wasenderapi";

const wasender = createWasender(
  apiKey,              // Session-specific API key
  personalAccessToken, // Account-level PAT (optional)
  undefined,           // baseUrl (default)
  undefined,           // customFetch (optional)
  retryOptions,        // RetryConfig (optional)
  webhookSecret        // For webhook verification (optional)
);
```

## Endpoints Principales

### Enviar Mensaje de Texto
```
POST /api/send-message
```
```typescript
// Helper method
const result = await wasender.sendText({
  to: "+5491154177572",
  text: "Hola! ¿Confirmás tu asistencia al OpenClaw Meetup?"
});

// Generic method
import { TextOnlyMessage } from "wasenderapi";
const payload: TextOnlyMessage = {
  messageType: "text",
  to: "+1234567890",
  text: "Hello!"
};
const result = await wasender.send(payload);
```

### Tipos de Mensaje Soportados
- `text` — Texto plano
- `image` — Imagen (url + caption)
- `video` — Video (url + caption)
- `document` — Documento (url + filename)
- `audio` — Audio (url)
- `sticker` — Sticker (url)
- `contact` — Tarjeta de contacto
- `location` — Ubicación (lat, lng)

### Enviar Imagen
```typescript
await wasender.sendImage({
  to: "+1234567890",
  url: "https://example.com/image.jpg",
  caption: "Caption opcional"
});
```

## Webhooks

### Setup
- Configurar URL webhook en el dashboard de WaSenderAPI
- Generar Webhook Secret en el dashboard
- El endpoint debe responder con 200 OK rápidamente

### Eventos
| Evento | Descripción |
|--------|-------------|
| `messages.upsert` | Mensaje recibido (nuevo) |
| `messages.update` | Estado de mensaje actualizado |
| `session.status` | Cambio de estado de sesión |

### Payload: Mensaje Recibido (`messages.upsert`)
```json
{
  "event": "messages.received",
  "timestamp": 1633456789,
  "data": {
    "messages": {
      "key": {
        "id": "3EB0X123456789",
        "fromMe": false,
        "remoteJid": "1234567890@s.whatsapp.net",
        "addressingMode": "pn",
        "senderPn": "1234567890@s.whatsapp.net",
        "cleanedSenderPn": "1234567890",
        "senderLid": "555555555@lid"
      },
      "messageBody": "Hello, I have a question",
      "message": {
        "conversation": "Hello, I have a question"
      }
    }
  }
}
```

### Verificación de Webhook
```typescript
import { WasenderWebhookEvent, WasenderWebhookEventType } from "wasenderapi";

// Express.js example
app.post('/webhook/wasender', async (req, res) => {
  const adapter = {
    getHeader: (name) => req.headers[name],
    getRawBody: () => JSON.stringify(req.body),
  };

  try {
    const event = await wasender.handleWebhookEvent(adapter);
    
    switch (event.type) {
      case WasenderWebhookEventType.MessagesUpsert:
        console.log("From:", event.data.key.remoteJid);
        console.log("Text:", event.data.message?.conversation);
        break;
      case WasenderWebhookEventType.SessionStatus:
        console.log("Status:", event.data.status);
        break;
    }
    
    res.status(200).send('OK');
  } catch (error) {
    res.status(400).send('Invalid');
  }
});
```

### Firma del Webhook
- Header: `X-Wasender-Signature`
- Se verifica contra el `webhookSecret` configurado

## Gestión de Sesiones
Requiere **Personal Access Token** (no API Key).

```typescript
// Listar sesiones
const sessions = await wasender.getAllWhatsAppSessions();

// Crear sesión
const session = await wasender.createWhatsAppSession({ name: "mi-sesion" });

// Conectar (obtener QR)
const qr = await wasender.connectSession(sessionId);

// Estado de sesión
const status = await wasender.getSessionStatus(sessionId);
```

## Rate Limits
- Info incluida en cada respuesta: `limit`, `remaining`, `resetTimestamp`
- Retry automático configurable para HTTP 429

```typescript
const retryOptions = {
  enabled: true,
  maxRetries: 3,
};
```

## Error Handling
```typescript
import { WasenderAPIError } from "wasenderapi";

try {
  await wasender.sendText({ to: "...", text: "..." });
} catch (error) {
  if (error instanceof WasenderAPIError) {
    console.log(error.statusCode);    // HTTP status
    console.log(error.apiMessage);    // Error message
    console.log(error.errorDetails);  // Additional details
    console.log(error.rateLimit);     // Rate limit info
  }
}
```

## Pricing
- Desde $9.99/mes
- Sin verificación de Meta Business
- Sin documentación fiscal requerida
- Conecta vía WhatsApp Web (QR scan)
