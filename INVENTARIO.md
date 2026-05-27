# Inventario completo — Módulo Parqueo USPG
> Fecha: 2026-05-15 | Rama: `parqueo` | Framework: Next.js 16 App Router + Prisma 6 + PostgreSQL 16

---

## BACKEND — API Routes (`/api/parqueo/`)

### Módulo AUTH
**Archivo:** `src/app/api/parqueo/auth/route.js`

| Método | Ruta | Estado | Detalle |
|--------|------|--------|---------|
| POST | `/auth` | ✅ | Login email/password, genera access+refresh token, registra en AuditLog |
| POST | `/auth?action=refresh` | ✅ | Renueva access token con refresh token |
| POST | `/auth?action=logout` | ✅ | Cierra sesión y registra en AuditLog |
| GET | `/auth` | ✅ | Perfil del usuario autenticado (me), incluye vehículos |

---

### Módulo SPACES (Espacios)
**Archivos:** `spaces/route.js`, `spaces/[id]/route.js`, `spaces/available/route.js`, `spaces/status/route.js`, `spaces/sensor/route.js`, `spaces/[id]/position/route.js`

| Método | Ruta | Estado | Detalle |
|--------|------|--------|---------|
| GET | `/spaces` | ✅ | Lista todos los espacios (filtros: zone, type, status, campus_id) |
| POST | `/spaces` | ✅ | Crea espacio nuevo |
| GET | `/spaces/:id` | ✅ | Obtiene espacio por id |
| PATCH | `/spaces/:id` | ✅ | Actualiza espacio |
| DELETE | `/spaces/:id` | ✅ | Elimina espacio |
| GET | `/spaces/available` | ✅ | Lista solo espacios disponibles |
| GET | `/spaces/status` | ✅ | Resumen por zona (total/available/occupied por A, B, C, D) |
| POST | `/spaces/sensor` | ✅ | Actualiza estado por señal de sensor IoT |
| PATCH | `/spaces/:id/position` | ⚠️ | Actualiza coordenadas x,y — existe pero no se usa en el frontend |

---

### Módulo SESSIONS (Sesiones)
**Archivos:** `sessions/route.js`, `sessions/active/route.js`, `sessions/history/route.js`, `sessions/[id]/route.js`, `sessions/[id]/exit/route.js`, `sessions/[id]/ticket/route.js`

| Método | Ruta | Estado | Detalle |
|--------|------|--------|---------|
| POST | `/sessions` | ✅ | Registra entrada, crea sesión activa, marca espacio OCCUPIED |
| GET | `/sessions/active` | ✅ | Lista sesiones activas con vehicle, user, space |
| GET | `/sessions/history` | ✅ | Historial paginado (filtros: vehicle_id, user_id, from, to) |
| GET | `/sessions/:id` | ✅ | Obtiene sesión por id |
| POST | `/sessions/:id/exit` | ✅ | Registra salida, calcula duración y monto, marca espacio AVAILABLE |
| GET | `/sessions/:id/ticket` | ✅ | Genera datos del ticket de una sesión |

---

### Módulo RESERVATIONS
**Archivos:** `reservations/route.js`, `reservations/[id]/route.js`, `reservations/[id]/cancel/route.js`

| Método | Ruta | Estado | Detalle |
|--------|------|--------|---------|
| GET | `/reservations` | ✅ | Lista paginada, filtra por user_id desde JWT |
| POST | `/reservations` | ✅ | Crea reserva, valida conflictos de horario, marca espacio RESERVED |
| GET | `/reservations/:id` | ✅ | Obtiene reserva por id |
| PATCH | `/reservations/:id` | ✅ | Actualiza reserva |
| POST | `/reservations/:id/cancel` | ✅ | Cancela reserva, libera espacio (ADMIN/SECURITY pueden cancelar cualquiera) |
| DELETE | `/reservations/:id` | ❌ | No implementado |

---

### Módulo PAYMENTS
**Archivos:** `payments/route.js`, `payments/[id]/route.js`, `payments/[id]/confirm/route.js`, `payments/[id]/refund/route.js`

| Método | Ruta | Estado | Detalle |
|--------|------|--------|---------|
| GET | `/payments` | ✅ | Lista pagos paginados |
| POST | `/payments` | ✅ | Crea registro de pago |
| GET | `/payments/:id` | ✅ | Obtiene pago por id |
| POST | `/payments/:id/confirm` | ✅ | Confirma pago, actualiza sesión a is_paid=true |
| POST | `/payments/:id/refund` | ✅ | Procesa reembolso |

> ⚠️ Ninguna pantalla del frontend usa estos endpoints directamente — los pagos no están integrados en el flujo de salida.

---

### Módulo USERS
**Archivos:** `users/route.js`, `users/[id]/route.js`, `users/[id]/toggle-active/route.js`, `users/[id]/qr/route.js`, `users/[id]/nfc/route.js`, `users/[id]/vehicles/route.js`, `users/[id]/sessions/route.js`

| Método | Ruta | Estado | Detalle |
|--------|------|--------|---------|
| GET | `/users` | ✅ | Lista paginada (filtros: role, search, is_active) |
| POST | `/users` | ✅ | Crea usuario con hash bcrypt (12 rounds) |
| GET | `/users/:id` | ✅ | Obtiene usuario con vehículos y sesiones |
| PATCH | `/users/:id` | ✅ | Actualiza usuario |
| DELETE | `/users/:id` | ✅ | Soft delete (deleted_at) |
| POST | `/users/:id/toggle-active` | ✅ | Activa/desactiva usuario |
| GET | `/users/:id/qr` | ✅ | Genera/obtiene QR code del usuario |
| POST | `/users/:id/nfc` | ✅ | Asigna NFC token |
| GET | `/users/:id/vehicles` | ✅ | Lista vehículos del usuario |
| GET | `/users/:id/sessions` | ✅ | Historial de sesiones del usuario |

> ❌ No existe pantalla de gestión de usuarios en el frontend.

---

### Módulo VEHICLES
**Archivos:** `vehicles/route.js`, `vehicles/[id]/route.js`, `vehicles/[id]/authorize/route.js`, `vehicles/[id]/unauthorize/route.js`, `vehicles/[id]/blacklist/route.js`, `vehicles/search/route.js`

| Método | Ruta | Estado | Detalle |
|--------|------|--------|---------|
| GET | `/vehicles` | ✅ | Lista paginada (filtros: blacklisted, search) |
| POST | `/vehicles` | ✅ | Registra vehículo, vincula propietario por `owner_carnet` si se provee |
| GET | `/vehicles/:id` | ✅ | Obtiene vehículo con sesión activa |
| PATCH | `/vehicles/:id` | ✅ | Actualiza vehículo (usado para toggle autorización) |
| DELETE | `/vehicles/:id` | ✅ | Soft delete |
| POST | `/vehicles/:id/authorize` | ✅ | Autoriza vehículo |
| POST | `/vehicles/:id/unauthorize` | ✅ | Desautoriza vehículo |
| POST | `/vehicles/:id/blacklist` | ✅ | Agrega a blacklist con motivo, registra en tabla Blacklist |
| DELETE | `/vehicles/:id/blacklist` | ✅ | Remueve de blacklist |
| GET | `/vehicles/search?plate=` | ✅ | Búsqueda por placa (usado por mapa para asignación manual) |

---

### Módulo DASHBOARD
**Archivos:** `dashboard/route.js`, `dashboard/activity/route.js`, `dashboard/alerts/route.js`, `dashboard/traffic/route.js`

| Método | Ruta | Estado | Detalle |
|--------|------|--------|---------|
| GET | `/dashboard` | ✅ | Stats generales: sesiones activas, espacios, ingresos del día, alertas |
| GET | `/dashboard/activity` | ✅ | Últimas N sesiones recientes con vehicle/user/space |
| GET | `/dashboard/alerts` | ✅ | Alertas activas: blacklist en sesión, sesiones largas, overstay |
| GET | `/dashboard/traffic` | ✅ | Tráfico por hora (array 24 posiciones para la gráfica) |

---

### Módulo QR
**Archivos:** `qr/scan/route.js`, `qr/visitor/route.js`, `qr/validate/route.js`

| Método | Ruta | Estado | Detalle |
|--------|------|--------|---------|
| POST | `/qr/scan` | ✅ | Acepta `code` o `qr_code`, registra entrada o salida automáticamente, soporta QR de usuario y visitante |
| POST | `/qr/visitor` | ✅ | Genera QR visitante con package `qrcode`, devuelve `qr_image` como data URL, guarda en VisitorQR |
| GET | `/qr/visitor` | ✅ | Lista QRs de visitantes paginada |
| GET | `/qr/validate` | ✅ | Valida si un código QR es válido sin consumirlo |

---

### Módulo REPORTS
**Archivos:** `reports/daily/route.js`, `reports/monthly/route.js`, `reports/revenue/route.js`, `reports/occupancy/route.js`, `reports/top-users/route.js`, `reports/prediction/route.js`, `reports/export/route.js`

| Método | Ruta | Estado | Detalle |
|--------|------|--------|---------|
| GET | `/reports/daily` | ✅ | Reporte del día: sesiones, completadas, ingresos, duración promedio |
| GET | `/reports/monthly` | ✅ | Reporte mensual: sesiones por día, ingresos totales |
| GET | `/reports/revenue` | ✅ | Ingresos por rango: total, por día (array), unique_vehicles, avg_per_session |
| GET | `/reports/occupancy` | ✅ | Ocupación por rango: hourly[24], by_zone con entries/revenue/avg_duration/avg_occupancy |
| GET | `/reports/top-users` | ✅ | Top N usuarios: visitas, minutos, gasto total, zona favorita (campos planos) |
| GET | `/reports/prediction` | ✅ | Predicción próxima hora: occupancy_pct, expected_entries/exits, busiest_zone, confidence |
| GET | `/reports/export` | ⚠️ | Exporta sessions o payments como JSON — no genera CSV ni PDF |

---

### Módulo SECURITY
**Archivos:** `security/audit/route.js`, `security/blacklist/route.js`, `security/failed-attempts/route.js`, `security/suspicious/route.js`

| Método | Ruta | Estado | Detalle |
|--------|------|--------|---------|
| GET | `/security/audit` | ✅ | Log de auditoría paginado, mapea AuditLog a event_type/severity/placa/description |
| GET | `/security/blacklist` | ✅ | Lista tabla Blacklist con added_by y removed_by |
| GET | `/security/failed-attempts` | ✅ | Combina logs ACCESS_DENIED + vehículos en blacklist activos |
| GET | `/security/suspicious` | ✅ | Sesiones de vehículos en blacklist + sesiones >24h activas + login fallidos |

---

### Módulo NOTIFICATIONS
**Archivos:** `notifications/route.js`, `notifications/[id]/read/route.js`, `notifications/read-all/route.js`

| Método | Ruta | Estado | Detalle |
|--------|------|--------|---------|
| GET | `/notifications` | ✅ | Lista notificaciones del usuario autenticado |
| POST | `/notifications` | ✅ | Crea notificación |
| PATCH | `/notifications/:id/read` | ✅ | Marca una notificación como leída |
| POST | `/notifications/read-all` | ✅ | Marca todas como leídas |

> ❌ No existe pantalla de notificaciones en el frontend.

---

### Módulo BARRIERS (Barreras)
**Archivos:** `barriers/route.js`, `barriers/[id]/command/route.js`, `barriers/logs/route.js`

| Método | Ruta | Estado | Detalle |
|--------|------|--------|---------|
| GET | `/barriers` | ⚠️ | Lista barreras desde un `Map` en memoria — no persiste en BD ni reinicio |
| POST | `/barriers/:id/command` | ⚠️ | Ejecuta OPEN/CLOSE/BLOCK en el Map en memoria, sí persiste en `BarrierLog` |
| GET | `/barriers/logs` | ✅ | Historial de comandos desde tabla `BarrierLog` en BD |

> ❌ No existe pantalla de barreras en el frontend.

---

## FRONTEND — Pantallas

### Pantallas implementadas

| Pantalla | Archivo | Estado | Componentes internos |
|----------|---------|--------|----------------------|
| Dashboard | `parqueo/page.js` | ✅ | `StatCard`, `StatusBadge`, `AlertRow`, gráfica ApexCharts (tráfico/hora), zona cards A-D |
| Mapa de espacios | `parqueo/mapa/page.js` | ✅ | `ZoneGrid` (SVG), `SpaceModal` (detalle + sesión activa), `AssignModal` (búsqueda por placa + entrada manual) |
| Sesiones activas | `parqueo/sesiones/page.js` | ✅ | `TicketModal`, `SalidaModal`, `MetodoBadge`, `PagoBadge`, filtros zona/método/pago, paginación implícita |
| Gestión vehículos | `parqueo/vehiculos/page.js` | ✅ | `AddVehicleModal`, `BlacklistModal`, `DetailModal`, filtros rol/autorización/blacklist |
| Reservas | `parqueo/reservas/page.js` | ✅ | `NewReservaModal` (carga espacios disponibles por zona), `CancelModal`, `Countdown`, `StatusBadge` |
| Reportes | `parqueo/reportes/page.js` | ✅ | `BarChart` (SVG inline), `AreaChart` (SVG inline), `Empty`, tabla por zona, panel predicción, top 10 usuarios, fallback `buildDemo()` |
| Escáner QR | `parqueo/escaner/page.js` | ✅ | `VisitorModal` (genera QR visitante, muestra `qr_image`), `ResultPanel` (entrada/salida/error), BarcodeDetector API nativa + input manual |
| Seguridad | `parqueo/seguridad/page.js` | ✅ | `RemoveBlacklistModal`, `SeverityBadge`, 3 tabs: log auditoría paginado / blacklist / intentos fallidos |

### Pantallas NO implementadas

| Módulo | Estado |
|--------|--------|
| Gestión de usuarios | ❌ |
| Pagos | ❌ |
| Notificaciones | ❌ |
| Control de barreras | ❌ |

### Layout
- ✅ `parqueo/layout.js` — sidebar con los 8 módulos visibles, integrado al layout global de la plantilla

---

## BASE DE DATOS

### Modelos Prisma (13 total)

| Modelo | Estado | Campos clave |
|--------|--------|--------------|
| `Campus` | ✅ | id, name, address, location |
| `User` | ✅ | role, qr_code, nfc_token, carnet, password_hash, last_login_at, soft delete (deleted_at) |
| `Vehicle` | ✅ | placa (unique), type, blacklisted, blacklist_reason, is_authorized, soft delete |
| `ParkingSpace` | ✅ | code (unique), zone, type, status, floor, is_active, campus FK |
| `ParkingSession` | ✅ | entry_time, exit_time, duration_minutes, amount_due, is_paid, entry_method |
| `Payment` | ✅ | amount, method, status, session FK, user FK |
| `Reservation` | ✅ | start_time, end_time, type, status, notes, space/vehicle/user FK |
| `Notification` | ✅ | type, title, message, is_read, user FK |
| `AuditLog` | ✅ | action, resource, resource_id, metadata (JSON), ip_address, user_agent, user FK |
| `Blacklist` | ✅ | vehicle FK, reason, is_active, added_by/removed_by FK, removed_at |
| `BarrierLog` | ✅ | barrier_id, action, trigger_source, operator FK, session FK, notes |
| `VisitorQR` | ✅ | qr_code (unique), visitor_name, vehicle_plate, purpose, expires_at, is_used, used_at |
| `Camera` | ✅ | name, location, stream_url, is_active |

### Enums definidos (13 total) — todos ✅

| Enum | Valores |
|------|---------|
| `Role` | ADMIN, STUDENT, TEACHER, SECURITY, VISITOR |
| `Zone` | A, B, C, D |
| `SpaceType` | STANDARD, HANDICAPPED, ELECTRIC, VIP, MOTORCYCLE, TEACHER |
| `SpaceStatus` | AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE |
| `SessionStatus` | ACTIVE, COMPLETED, CANCELLED |
| `PaymentStatus` | PENDING, COMPLETED, FAILED, REFUNDED |
| `PaymentMethod` | CASH, CARD, QR, NFC, APP |
| `EntryMethod` | QR, RFID, MANUAL, APP, NFC |
| `ReservationStatus` | PENDING, CONFIRMED, CANCELLED, EXPIRED, USED |
| `ReservationType` | STANDARD, PERSONAL, EVENT, SPECIAL_VISIT |
| `NotificationType` | PARKING_FULL, VISITOR_EXPIRING, OVERSTAY, BLACKLIST_DETECTED, PAYMENT_DUE, SYSTEM |
| `BarrierAction` | OPEN, CLOSE, BLOCK, UNBLOCK |
| `TriggerSource` | MANUAL, QR, RFID, SENSOR, SYSTEM |
| `Orientation` | HORIZONTAL, VERTICAL |

### Seeds
- ❌ No existe `prisma/seed.js`
- ⚠️ La BD tiene datos reales (24 usuarios, 10 vehículos, 500 espacios, 275 sesiones) pero fueron insertados manualmente, no por seed versionado

---

## CONFIGURACIÓN

### Librerías del servidor (`src/lib/`)

| Archivo | Estado | Detalle |
|---------|--------|---------|
| `prisma.js` | ✅ | Singleton PrismaClient con `globalThis` para evitar conexiones múltiples en dev |
| `jwt.js` | ✅ | `signAccess` (1h), `signRefresh` (7d), `verifyAccess`, `verifyRefresh`, `getUserFromRequest` |
| `response.js` | ✅ | `ok`, `created`, `error`, `notFound`, `unauthorized`, `conflict` con estructura `{ success, message, data }` |
| `api.js` | ✅ | Axios con baseURL `/api/parqueo`, interceptor Bearer token desde localStorage, redirect a `/login` en 401 |
| `utils.js` | ✅ | Utilidades generales |

### Variables de entorno (`.env.local`)

| Variable | Estado | Valor actual |
|----------|--------|--------------|
| `DATABASE_URL` | ✅ | `postgresql://postgres:admin123@localhost:5432/parqueo_db` |
| `DIRECT_URL` | ✅ | Igual que DATABASE_URL |
| `NEXTAUTH_URL` | ✅ | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | ✅ | `dev_secret_local` |
| `NEXT_PUBLIC_BASE_URL` | ✅ | `http://localhost:3000` |
| `NODE_ENV` | ✅ | `development` |
| `JWT_SECRET` | ❌ | **No definida** — usa fallback hardcodeado `smart_parking_jwt_secret_2026` |
| `JWT_REFRESH_SECRET` | ❌ | **No definida** — usa fallback hardcodeado `smart_parking_refresh_secret_2026` |

### Otros archivos de configuración

| Elemento | Estado | Detalle |
|----------|--------|---------|
| `docker-compose.yml` | ⚠️ | Existe en `/final/`, servicio `postgres` funciona — servicio `backend` apunta al directorio `./backend` que fue eliminado |
| `next.config.js` / `next.config.mjs` | ✅ | Configuración Next.js 16 |
| `prisma/schema.prisma` | ✅ | PostgreSQL, 13 modelos, 13 enums |
| `.env.example` | ❌ | No existe archivo de ejemplo |
| Swagger / OpenAPI | ❌ | No existe documentación de API |
| Tests (unit/integration/e2e) | ❌ | No existe ningún test |

---

## Dependencias instaladas

```
next 16.2.4
react 19.2.4
@prisma/client ^6.19.3
prisma ^6.19.3
axios ^1.16.1
bcryptjs ^3.0.3
jsonwebtoken ^9.0.3
qrcode ^1.5.4
uuid ^14.0.0
socket.io-client ^4.8.3
lucide-react ^1.14.0
clsx ^2.1.1
tailwind-merge ^3.6.0
```

---

## Resumen ejecutivo

| Categoría | Total | ✅ Completo | ⚠️ Incompleto | ❌ Falta |
|-----------|-------|------------|--------------|---------|
| Endpoints API | 57 | 52 | 4 | 1 |
| Pantallas frontend | 12 | 8 | 0 | 4 |
| Modelos BD | 13 | 13 | 0 | 0 |
| Enums BD | 13 | 13 | 0 | 0 |
| Variables entorno | 8 | 6 | 0 | 2 |

### Riesgos principales
1. **`JWT_SECRET` no está en `.env.local`** — usa string hardcodeado, funciona pero cualquiera que lea el código puede forjar tokens
2. **Barreras en memoria** — el estado OPEN/CLOSE se resetea con cada reinicio del servidor Next.js
3. **Export de reportes devuelve JSON** — no genera CSV ni PDF, el botón de exportar no está en el frontend
4. **docker-compose.yml roto** — el servicio `backend` apunta a `./backend` que fue eliminado al consolidar todo en Next.js
5. **Sin seed versionado** — si se resetea la BD, los datos de prueba se pierden
