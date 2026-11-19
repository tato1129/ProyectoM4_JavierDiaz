# Gestor de tareas

SPA de gestión de tareas con autenticación, persistencia en la nube y envío de resúmenes por email.

- **Frontend:** React 18 + TypeScript + Vite + React Router
- **Auth y datos:** Firebase Authentication (email/password y Google) + Cloud Firestore
- **Email:** AWS SES, invocado desde una Vercel Function (los secretos nunca llegan al navegador)
- **Tests:** Vitest + Testing Library
- **Deploy:** Vercel

## Funcionalidades

- Registro, login (email/password o Google) y logout, con mensajes de error claros.
- Rutas privadas: sin sesión no se puede ver `/tasks` (se redirige a `/login`).
- CRUD de tareas por usuario: crear (título, descripción, prioridad, vencimiento), listar, editar, eliminar y marcar como completada.
- Sincronización en tiempo real con Firestore (`onSnapshot`): la UI se actualiza sola tras cada operación.
- Estados de carga y error (con botón «Reintentar» si falla la carga).
- Botón **«Enviar resumen por email»**: manda a tu casilla el estado de todas tus tareas.
- **Extras:** filtros (todas / pendientes / completadas), drag & drop con `dnd-kit`, fechas de vencimiento y orden por prioridad o vencimiento.

## Arquitectura

```
project-root/
├─ api/                    # Punto de entrada de la Vercel Function (send-summary.ts)
├─ functions/              # Lógica del backend: handler, SES, Firebase Admin, armado del resumen
├─ src/
│  ├─ pages/               # Login, Register, Tasks
│  ├─ components/          # TodoForm, TodoList, TodoItem, TaskFilters, AuthForm, ui/
│  ├─ features/            # Lógica por dominio: auth (contexto/provider) y tasks (selectores)
│  ├─ services/            # Integraciones: firebase, authService, taskService, emailService
│  ├─ routes/              # AppRouter, ProtectedRoute, PublicOnlyRoute
│  ├─ hooks/               # useAuth, useTasks, useSendSummary
│  ├─ types/               # Tipos compartidos
│  └─ utils/               # Validaciones, errores de auth, fechas, prioridades
├─ tests/                  # Unit tests, tests de componentes y mocks
├─ firestore.rules         # Security Rules de Firestore
├─ vercel.json
├─ .env.example            # Plantilla sin secretos (SÍ se sube)
└─ .env                    # Local (NO se sube)
```

### Decisiones arquitectónicas

- **Capas con una sola responsabilidad.** Los componentes no hablan con Firebase: usan hooks (`useTasks`, `useAuth`), y los hooks usan servicios. Cambiar de backend solo toca `services/`.
- **Aislamiento de datos en dos niveles.** El cliente consulta con `where('userId', '==', uid)` y, además, las **Security Rules** (`firestore.rules`) impiden leer o modificar tareas ajenas y validan la forma del documento. Aunque alguien manipule el frontend, Firestore lo rechaza.
- **Orden en el cliente.** Se evita `orderBy` junto a `where` para no necesitar índices compuestos; la ordenación (manual, prioridad, vencimiento) vive en funciones puras y testeadas (`taskSelectors.ts`).
- **Drag & drop persistente.** Cada tarea tiene un campo `order`; al soltar se reasignan posiciones en un `writeBatch` atómico. El arrastre solo se habilita con filtro «Todas» y orden «Manual».
- **Backend que no confía en el cliente.** La función recibe únicamente el ID token de Firebase. Con él: (1) verifica la identidad con el Admin SDK, (2) lee las tareas desde Firestore en el servidor y (3) envía el email **solo a la dirección del token**. El cliente no puede elegir destinatario ni contenido, así que el endpoint no sirve como relay de spam.
- **Límite de envíos.** Un cooldown de 60 s por usuario (transacción en la colección `mailRateLimit`, accesible solo por el Admin SDK) evita abusos y gastos inesperados en SES.
- **Inyección de dependencias en el handler.** `createSendSummaryHandler(deps)` recibe verificación de token, Firestore y SES como parámetros, por lo que se testea sin red ni credenciales.
- **`api/` + `functions/`.** Vercel solo expone funciones ubicadas en `/api`; `api/send-summary.ts` es un wrapper mínimo y la lógica real vive en `functions/`.
- **HTML de email escapado.** Todo texto escrito por el usuario se escapa antes de ir al cuerpo HTML del email.


## Flujo de envío de emails

```
[Botón «Enviar resumen»]
        │  1. getIdToken() (Firebase Auth)
        ▼
POST /api/send-summary   Authorization: Bearer <ID token>        (sin body)
        │
        ▼  Vercel Function (api/send-summary.ts → functions/sendSummaryHandler.ts)
  2. Verifica el token con Firebase Admin ──────────► 401 si es inválido/expiró
  3. Cooldown por usuario (60 s) ───────────────────► 429 si envió hace instantes
  4. Lee las tareas del usuario en Firestore (Admin SDK)
  5. Arma el resumen (texto + HTML escapado)
  6. Envía con AWS SES al email del token ──────────► 502 si SES falla
        │
        ▼
  200 { ok, sentTo, counts }  →  la UI muestra «Te enviamos el resumen a …»
```

Las credenciales de AWS y de Firebase Admin se leen de variables de entorno **solo dentro de la función**; el navegador nunca las ve.

| Área | Qué se prueba |
| --- | --- |
| Unit | validaciones, traducción de errores de auth, filtros/orden/reordenamiento, fechas, armado y escape del resumen |
| Servicios (con mocks) | `taskService` (Firestore mockeado), `emailService` (`fetch` mockeado) |
| Backend | `sendSummaryHandler` con dependencias inyectadas: 405/401/400/429/200/502 |
| Componentes | `TodoForm`, `TodoList` (incluye editar, borrar con confirmación, toggle y handle de drag) y `ProtectedRoute` (con `useAuth` mockeado) |

## Cómo integré la IA en mi proceso de trabajo

Partí del enunciado completo y le pedí a la IA una estructura de capas (`pages`, `components`, `features`, `services`, `hooks`, `api`) y un orden de trabajo: auth → CRUD → función de email → tests → deploy.
- **Dónde fue más efectiva:** (1) *boilerplate y estructura* (configuración de Vite/TS/Vitest, contexto de auth, servicios de Firebase); (2) *tests*, sobre todo casos borde (título vacío, token inválido, cooldown, HTML en títulos); (3) *seguridad*, al pedirle que revisara el diseño del endpoint de email y la hizo plantear que el servidor no debía confiar en el cliente.
- **Patrones que funcionaron:** pedir una capa por vez con contexto concreto; separar lógica pura (selectores, `buildSummary`) de la que toca servicios para poder testearla; inyectar dependencias en el handler para mockear SES/Firebase; revisar cada diff antes de commitear.
-  dar a la IA restricciones explícitas (no exponer secretos, tipado estricto, mocks de servicios externos); desconfiar de lo que no se pudo ejecutar; y no pegar nunca claves reales en el chat.

## Seguridad

- `.env` y los JSON de cuentas de servicio están en `.gitignore`; ningún commit contiene secretos.
- Secretos de AWS y Firebase Admin solo en variables de entorno del servidor.
- Firestore Security Rules: cada usuario solo accede a sus tareas; el resto está denegado.
- Limitación conocida: el email de resumen se envía a la dirección con la que el usuario se registró. Si se quisiera impedir que alguien se registre con un email ajeno para recibir correos, habría que exigir verificación de email (`email_verified`) antes de permitir el envío.
