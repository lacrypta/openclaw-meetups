# WhatsApp Messaging Limits & Best Practices

> ⚠️ **WARNING:** Referencia obligatoria antes de enviar mensajes masivos por WhatsApp.

## Contexto

Para OpenClaw Meetups, los asistentes se registran voluntariamente (opt-in legítimo).
Volumen esperado: 150-200 personas por evento, contactadas en ventana de ~2 semanas.

## Límites Seguros (Personal / Business App)

| Método | Límite | Requisito |
|--------|--------|-----------|
| **Broadcast list** | 256 contactos/lista | Destinatario debe tener tu número guardado |
| **Mensajes individuales** | 50-80 nuevos/día | Espaciados, no en ráfaga |
| **Mensajes a contactos que te tienen** | 200-300/día | Sin restricción de agenda |

## Nuestro Caso (200 registrados, 2 semanas)

- 200 personas / 14 días = **~15 mensajes/día** → ✅ completamente seguro
- Incluso 200 en 2-3 días (50-80/día) → ✅ dentro de rango normal
- Son personas que se registraron → contexto legítimo, no spam

## Reglas de Oro (Anti-Flag)

1. **No mandar todos al mismo tiempo** — espaciar a lo largo del día
2. **Variar el texto** — personalizar con nombre, al menos mínimamente
3. **Horario laboral** — no mandar de madrugada (9AM-21PM)
4. **Ritmo:** 1 mensaje cada 30-60 segundos (no ráfaga)
5. **Si alguien bloquea, no insistir** — cada bloqueo suma puntos negativos
6. **Número nuevo = más vulnerable** — primeros días: 10-20/día, subir gradualmente
7. **No repetir mensajes idénticos** a muchos contactos en poco tiempo

## Configuración WaSenderAPI

- Delay entre mensajes: 30-60 segundos
- Batches máximos: 50 por sesión
- Personalizar con `{{nombre}}` del registrado
- No exceder 80 mensajes nuevos por día

## Tipos de Mensaje por Evento

| Momento | Tipo | Volumen |
|---------|------|---------|
| Post-registro | Confirmación | 1 por registrado |
| 1 semana antes | Recordatorio | 1 broadcast |
| 1 día antes | Reminder final | 1 broadcast |
| Día del evento | Info logística | 1 broadcast |
| Post-evento | Agradecimiento + feedback | 1 por asistente |

## ⚠️ Lo que NO hacer

- ❌ Mandar a listas compradas o scrapeadas
- ❌ Más de 80 mensajes nuevos/día a desconocidos
- ❌ Mensajes idénticos a todos sin personalización
- ❌ Ráfagas de 100+ mensajes en minutos
- ❌ Ignorar bloqueos/reports (acumulan penalidad)
- ❌ Usar número personal principal para testing masivo

## WhatsApp Business API (Oficial) — Alternativa futura

Si el volumen crece (500+ por evento), considerar migrar a Business API oficial:
- Requiere Meta Business Manager + verificación
- Permite templates pre-aprobados
- Tiers: 250 → 1K → 10K → 100K mensajes/día
- Costo: ~USD 0.05-0.15 por conversación de marketing
- **Requiere entidad legal** (La Crypta no tiene actualmente)

## Referencias

- [WaSenderAPI Reference](./wasenderapi-reference.md)
- [Feature: WhatsApp RSVP Flow](./feature-whatsapp-rsvp-flow.md)
- [Feature: AI Messaging Engine](./feature-ai-messaging-engine.md)
