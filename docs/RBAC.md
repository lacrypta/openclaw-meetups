# RBAC — Role-Based Access Control

> Última actualización: 2026-03-11

## Roles

| Rol | Nivel | Descripción |
|-----|-------|-------------|
| **guest** | 0 | Usuario registrado. Ve su perfil y sus tickets/entradas. |
| **manager** | 1 | Organizador. Crea eventos, campañas, ve asistentes, envía mensajes. |
| **admin** | 2 | Administrador. Acceso total: configuración, integraciones, roles, logs. |

Los roles son jerárquicos: un **admin** puede hacer todo lo que hace un **manager**, y un **manager** puede hacer todo lo que hace un **guest**.

## Usuarios

- Todos los usuarios tienen rol `guest` por defecto.
- El campo `pubkey` (Nostr) es opcional y único. Permite login vía NIP-07 (extensión), NIP-46 (bunker) o nsec.
- Un usuario sin pubkey no puede loguearse al dashboard, pero existe en la base de datos (registrado vía Luma, WhatsApp, etc.).
- Los roles se asignan desde el panel de admin (Users → dropdown de rol por usuario).

## Autenticación

### Flujo de Login

1. Usuario se conecta con su signer Nostr (NIP-07, NIP-46, o nsec).
2. El frontend firma un evento NIP-98 (kind 27235) con la URL y método del endpoint `/api/auth`.
3. El backend verifica la firma, busca al usuario por `pubkey` en la tabla `users`.
4. Si existe → emite JWT con `{ pubkey, role, userId }` (24h de expiración).
5. Si no existe → 403 "Pubkey no registrada".

### JWT

```json
{
  "pubkey": "e5c1a30b...",
  "role": "admin",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1741000000,
  "exp": 1741086400
}
```

### Verificación en cada request

Cada endpoint protegido llama a `requireRole(request, minRole)` que:

1. Extrae y verifica el JWT del header `Authorization: Bearer <token>`.
2. Consulta la DB para confirmar que el usuario existe y su rol vigente.
3. Compara el rol del usuario con el rol mínimo requerido usando la jerarquía.
4. Retorna `AuthUser { pubkey, userId, role }` si autorizado, o `null` si no.

**Importante:** La consulta a DB en cada request garantiza que un cambio de rol surte efecto inmediato, sin esperar que expire el JWT.

## Mapa de Endpoints

### 🔴 Admin (solo admin)

| Endpoint | Métodos | Descripción |
|----------|---------|-------------|
| `/api/settings` | GET, POST | Configuración general |
| `/api/integrations/ai` | GET, POST, PUT | Configuración AI |
| `/api/integrations/ai/verify` | POST | Verificar API key AI |
| `/api/integrations/luma` | GET, POST, PUT | Configuración Luma |
| `/api/integrations/luma/verify` | POST | Verificar API key Luma |
| `/api/integrations/luma/events` | GET | Listar eventos Luma |
| `/api/integrations/wasender` | GET, POST, PUT | Configuración WaSender |
| `/api/integrations/wasender/verify` | POST | Verificar API key WaSender |
| `/api/email-integrations` | GET, POST | Proveedores de email |
| `/api/email-integrations/[id]` | PUT, DELETE | CRUD proveedor email |
| `/api/email-integrations/[id]/test` | POST | Test envío email |
| `/api/webhook-logs` | GET | Logs de webhooks |
| `/api/users/[id]/role` | PATCH | Cambiar rol de usuario |

### 🟠 Manager (manager + admin)

| Endpoint | Métodos | Descripción |
|----------|---------|-------------|
| `/api/events` | GET, POST | CRUD eventos |
| `/api/events/[id]` | GET, PUT, DELETE | Detalle/editar/borrar evento |
| `/api/events/[id]/attendees` | GET, POST, PATCH | Gestión asistentes |
| `/api/events/[id]/attendees/send-confirmation` | POST | Enviar email confirmación |
| `/api/events/[id]/attendees/send-whatsapp` | POST | Enviar WhatsApp confirmación |
| `/api/events/[id]/send-confirmation` | POST | Enviar confirmaciones masivas |
| `/api/events/import-luma` | POST | Importar evento desde Luma |
| `/api/campaigns` | GET, POST | CRUD campañas |
| `/api/campaigns/[id]` | GET, PATCH | Detalle/editar campaña |
| `/api/campaigns/[id]/send` | POST | Enviar campaña |
| `/api/campaigns/[id]/test` | POST | Enviar email de prueba |
| `/api/campaigns/[id]/retry` | POST | Reintentar fallidos |
| `/api/campaigns/[id]/import` | POST | Importar destinatarios |
| `/api/campaigns/[id]/recipients/[sendId]` | DELETE | Eliminar destinatario |
| `/api/emails` | GET | Log global de emails |
| `/api/users` | GET, POST | Lista/crear usuarios |
| `/api/users/[id]/emails` | GET | Historial email del usuario |
| `/api/users/[id]/whatsapp` | GET | Historial WhatsApp del usuario |
| `/api/contacts` | GET, POST | Contactos |
| `/api/messaging-sessions` | GET | Sesiones de WhatsApp |
| `/api/messaging-sessions/[id]/messages` | GET | Mensajes de sesión |
| `/api/messaging-sessions/[id]/assign` | POST | Asignar usuario a sesión |
| `/api/messaging-sessions/[id]/send` | POST | Enviar mensaje WhatsApp |
| `/api/templates` | GET, POST | CRUD templates email |
| `/api/templates/[id]` | GET, PUT, DELETE | Detalle/editar/borrar template |
| `/api/templates/[id]/preview` | POST | Preview de template |
| `/api/layouts` | GET, POST | CRUD layouts email |
| `/api/layouts/[id]` | PUT, DELETE | Editar/borrar layout |
| `/api/master-prompt` | GET, POST | Prompt principal del bot |
| `/api/master-prompts` | GET, POST | CRUD prompts |
| `/api/master-prompts/[id]` | GET, PUT, DELETE | Detalle/editar/borrar prompt |

### 🟢 Guest (cualquier usuario autenticado)

| Endpoint | Métodos | Descripción |
|----------|---------|-------------|
| `/api/me` | GET | Perfil propio del usuario |

### ⚪ Público (sin autenticación)

| Endpoint | Métodos | Descripción |
|----------|---------|-------------|
| `/api/auth` | POST | Login (NIP-98) |
| `/api/confirm/[token]` | POST | Confirmar asistencia por email |
| `/api/webhooks/luma` | POST | Webhook de Luma |
| `/api/webhooks/wasender` | POST | Webhook de WaSender |

## Sidebar por Rol

La navegación del dashboard se filtra según el rol del usuario:

| Sección | Rol mínimo |
|---------|------------|
| Mi Perfil | guest |
| Overview | manager |
| Events | manager |
| Users | admin |
| Campaigns | manager |
| Email Log | manager |
| WhatsApp | manager |
| Templates | manager |
| Logs | admin |
| Settings | admin |

## Base de Datos

```sql
-- Columnas en tabla users
pubkey TEXT UNIQUE           -- Nostr pubkey (hex)
role TEXT NOT NULL DEFAULT 'guest'
  CHECK (role IN ('guest', 'manager', 'admin'))
```

## Funciones de Auth (lib/auth-server.ts)

| Función | Uso |
|---------|-----|
| `verifyToken(request)` | Retorna pubkey o null. Solo verifica JWT. Backward compat. |
| `authenticateRequest(request)` | Retorna `AuthUser` o null. Verifica JWT + consulta DB. |
| `requireRole(request, minRole)` | Retorna `AuthUser` si el rol es suficiente, null si no. |

## Seguridad

- **JWT + DB check**: Cada request verifica el token Y consulta la DB. Cambios de rol son inmediatos.
- **Jerarquía estricta**: `guest (0) < manager (1) < admin (2)`. No hay permisos granulares — el rol superior hereda todo.
- **Solo admin cambia roles**: El endpoint `PATCH /api/users/[id]/role` requiere rol `admin`.
- **Pubkey única**: No pueden existir dos usuarios con la misma pubkey.
- **Sin auto-registro**: Un usuario debe existir en la DB (creado por Luma, WhatsApp, o manualmente) antes de poder loguearse. La pubkey se asigna después.
