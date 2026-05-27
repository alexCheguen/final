# Guía de Examen — Sistema de Parqueo USPG

## 1. Arquitectura General

```
Usuario (Navegador)
      │
      ▼
┌─────────────────────────────────────┐
│          Next.js (webapp/)          │
│                                     │
│  ┌──────────────┐  ┌─────────────┐  │
│  │  Frontend    │  │  API Routes │  │
│  │  (páginas    │  │ /api/parqueo│  │
│  │   React)     │──│  /...       │  │
│  └──────────────┘  └──────┬──────┘  │
└─────────────────────────────────────┘
                            │ Prisma Client
                            ▼
                  ┌──────────────────┐
                  │  PostgreSQL 16   │
                  │  (parqueo_db)    │
                  └──────────────────┘
```

**Todo vive en un solo proceso Next.js.** No hay backend separado.  
El frontend (React) llama a las API routes del mismo servidor usando `axios`.  
Las API routes usan **Prisma** para hablar con **PostgreSQL**.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Para qué sirve |
|------|-----------|----------------|
| Frontend | React 19 + Next.js 16 | Pantallas del sistema |
| Routing | Next.js App Router | Manejo de URLs y páginas |
| API | Next.js Route Handlers | Endpoints REST internos |
| ORM | Prisma 6 | Consultas a la base de datos |
| Base de datos | PostgreSQL 16 | Persistencia de datos |
| Auth | JWT (jsonwebtoken) | Autenticación de usuarios |
| Hash | bcryptjs | Cifrado de contraseñas |
| QR | qrcode | Generación de códigos QR |
| HTTP client | Axios | Llamadas del frontend a la API |

---

## 3. Cómo se Conecta el Frontend con las APIs

### 3.1 El archivo `src/lib/api.js`

```js
import axios from "axios";

const api = axios.create({ baseURL: "/api/parqueo" });

// Agrega el token JWT automáticamente a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el servidor responde 401, redirige al login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
```

**Puntos clave:**
- `baseURL: "/api/parqueo"` → todas las llamadas van al mismo servidor Next.js
- **Interceptor de request**: adjunta el JWT de `localStorage` en el header `Authorization: Bearer <token>`
- **Interceptor de response**: si llega un 401 (no autorizado), borra el token y manda al login

### 3.2 Ejemplo de llamada desde una página React

```js
// En cualquier componente de página:
import api from "@/lib/api";

useEffect(() => {
  api.get("/dashboard").then(res => {
    setStats(res.data.data); // res.data = { success, message, data }
  });
}, []);
```

La URL real que se llama sería: `GET /api/parqueo/dashboard`

---

## 4. Flujo Completo de una Petición

**Ejemplo: el dashboard pide estadísticas**

```
1. React (parqueo/page.js)
   └─ api.get("/dashboard")
        │
        ▼
2. Axios agrega header: Authorization: Bearer eyJhbG...
        │
        ▼
3. Next.js recibe en: /api/parqueo/dashboard/route.js
   └─ export async function GET() { ... }
        │
        ▼
4. Prisma ejecuta queries en PostgreSQL:
   └─ prisma.parkingSpace.count({ where: { is_active: true } })
   └─ prisma.parkingSession.count({ where: { status: 'ACTIVE' } })
   └─ prisma.payment.aggregate(...)
        │
        ▼
5. PostgreSQL devuelve los datos
        │
        ▼
6. Route handler responde:
   └─ return NextResponse.json({ success: true, data: { spaces, sessions, revenue } })
        │
        ▼
7. React recibe y renderiza las tarjetas de estadísticas
```

---

## 5. Autenticación con JWT

### Flujo de Login

```
Usuario ingresa email + password
      │
      ▼
POST /api/parqueo/auth  (body: { email, password })
      │
      ▼
Route handler:
  1. Busca al usuario en BD por email
  2. Verifica la contraseña con bcrypt.compare(password, password_hash)
  3. Si es válido, genera dos tokens:
     - access_token  → expira en 1 hora
     - refresh_token → expira en 7 días
  4. Devuelve ambos tokens + datos del usuario
      │
      ▼
Frontend guarda:
  localStorage.setItem("access_token", token)
      │
      ▼
Todas las siguientes peticiones incluyen el token automáticamente
```

### Estructura del JWT (payload)

```json
{
  "sub": "uuid-del-usuario",
  "email": "usuario@usac.edu.gt",
  "role": "ADMIN",
  "iat": 1748000000,
  "exp": 1748003600
}
```

### Por qué se usa bcrypt para las contraseñas

bcrypt es un algoritmo de hashing **unidireccional**. Nunca se guarda la contraseña en texto plano. Al hacer login, se compara el hash guardado en BD con el hash de la contraseña ingresada. Aunque alguien accediera a la BD, no podría recuperar las contraseñas reales.

---

## 6. La Base de Datos (PostgreSQL + Prisma)

### 6.1 Modelos principales

```
Campus ──< ParkingSpace ──< ParkingSession >── Vehicle >── User
                │                  │
                │              Payment
                │
            Reservation >── Vehicle
                        >── User

User ──< Notification
User ──< AuditLog
User ──< VisitorQR
Vehicle ──< Blacklist
BarrierLog >── User
Camera >── Campus
```

### 6.2 Tabla por tabla

| Modelo | Para qué sirve |
|--------|---------------|
| `User` | Usuarios del sistema (admin, seguridad, docentes, estudiantes, visitantes) |
| `Vehicle` | Vehículos registrados, con placa única |
| `ParkingSpace` | Espacios físicos del parqueo (código, zona, tipo, estado) |
| `ParkingSession` | Registro de cada vez que un vehículo entra y sale |
| `Payment` | Pago asociado a una sesión completada |
| `Reservation` | Reservas anticipadas de un espacio |
| `Notification` | Notificaciones internas del sistema |
| `AuditLog` | Registro de acciones (login, logout, etc.) |
| `Blacklist` | Vehículos bloqueados |
| `BarrierLog` | Historial de apertura/cierre de barreras |
| `VisitorQR` | Códigos QR temporales para visitantes |
| `Camera` | Cámaras del sistema |

### 6.3 Enums importantes

- **Role**: ADMIN, SECURITY, TEACHER, STUDENT, VISITOR
- **SpaceStatus**: AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE
- **SessionStatus**: ACTIVE, COMPLETED, CANCELLED
- **PaymentStatus**: PENDING, COMPLETED, FAILED, REFUNDED
- **PaymentMethod**: CASH, CARD, TRANSFER, QR_CODE, MOBILE
- **EntryMethod**: QR, PLATE, NFC, MANUAL, VISITOR_QR

### 6.4 Qué es Prisma y cómo funciona

Prisma es un **ORM** (Object-Relational Mapper). En lugar de escribir SQL puro, se escribe en JavaScript y Prisma lo convierte a SQL automáticamente.

```js
// En vez de escribir:
// SELECT * FROM parking_spaces WHERE status = 'AVAILABLE' AND is_active = true

// Se escribe:
const espacios = await prisma.parkingSpace.findMany({
  where: { status: 'AVAILABLE', is_active: true }
});
```

**¿Dónde está el schema?** → `webapp/prisma/schema.prisma`  
**¿Cómo se genera el cliente?** → `npx prisma generate`  
**¿Cómo se conecta a la BD?** → Variable de entorno `DATABASE_URL` en `.env.local`

---

## 7. API Routes — Listado Completo

Todas las rutas viven en `webapp/src/app/api/parqueo/`

| Método | Ruta | Qué hace |
|--------|------|----------|
| POST | `/auth` | Login |
| GET | `/auth` | Obtener perfil propio (requiere token) |
| GET | `/spaces` | Listar espacios |
| POST | `/spaces` | Crear espacio |
| GET | `/spaces/available` | Espacios disponibles |
| GET | `/spaces/status` | Resumen de ocupación por zona |
| POST | `/spaces/sensor` | Actualización desde sensor IoT |
| GET/PATCH/DELETE | `/spaces/[id]` | Ver/editar/eliminar espacio |
| POST | `/sessions` | Registrar entrada de vehículo |
| GET | `/sessions/active` | Sesiones activas ahora |
| GET | `/sessions/history` | Historial de sesiones |
| POST | `/sessions/[id]/exit` | Registrar salida |
| GET | `/sessions/[id]/ticket` | Ver ticket de una sesión |
| GET/POST | `/reservations` | Listar/crear reservas |
| POST | `/reservations/[id]/cancel` | Cancelar reserva |
| GET/POST | `/payments` | Historial/crear pago |
| POST | `/payments/[id]/confirm` | Confirmar pago |
| POST | `/payments/[id]/refund` | Reembolsar pago |
| GET | `/dashboard` | Estadísticas generales |
| GET | `/dashboard/alerts` | Alertas activas |
| GET | `/dashboard/traffic` | Tráfico por hora |
| GET/POST | `/users` | Listar/crear usuarios |
| PATCH/DELETE | `/users/[id]` | Editar/eliminar usuario |
| GET/POST | `/vehicles` | Listar/registrar vehículos |
| POST | `/vehicles/[id]/blacklist` | Agregar a lista negra |
| POST | `/qr/scan` | Escanear código QR |
| POST | `/qr/visitor` | Generar QR para visitante |
| GET | `/barriers` | Estado de barreras |
| POST | `/barriers/[id]/command` | Abrir/cerrar/bloquear barrera |
| GET | `/reports/daily` | Reporte diario |
| GET | `/reports/monthly` | Reporte mensual |
| GET | `/reports/prediction` | Predicción de ocupación |
| GET | `/security/audit` | Logs de auditoría |
| GET | `/security/suspicious` | Actividad sospechosa |

---

## 8. Singleton de Prisma

```js
// src/lib/prisma.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

**¿Por qué?** Next.js en desarrollo recarga módulos constantemente. Sin este patrón, se crearían cientos de conexiones a PostgreSQL. Con `globalThis` se reutiliza siempre la misma instancia.

---

## 9. Estructura de Carpetas

```
final/
├── webapp/                    ← Todo el proyecto Next.js
│   ├── prisma/
│   │   └── schema.prisma      ← Definición de la BD
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/parqueo/   ← Todos los endpoints REST
│   │   │   ├── parqueo/       ← Páginas del módulo (UI)
│   │   │   │   ├── page.js        → Dashboard principal
│   │   │   │   ├── escaner/       → Escaneo QR
│   │   │   │   ├── mapa/          → Mapa del parqueo
│   │   │   │   ├── reportes/      → Reportes
│   │   │   │   ├── reservas/      → Reservas
│   │   │   │   ├── seguridad/     → Seguridad
│   │   │   │   ├── sesiones/      → Sesiones activas
│   │   │   │   └── vehiculos/     → Vehículos
│   │   │   └── login/         ← Página de login
│   │   └── lib/
│   │       ├── api.js         ← Cliente axios (frontend)
│   │       ├── prisma.js      ← Singleton Prisma (backend)
│   │       ├── jwt.js         ← Helpers de JWT (backend)
│   │       └── response.js    ← Helpers de respuesta HTTP
│   └── package.json
└── docker-compose.yml         ← Para levantar PostgreSQL
```

---

## 10. Variables de Entorno (`.env.local`)

```env
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/parqueo_db"
JWT_SECRET="smart_parking_jwt_secret_2026"
JWT_REFRESH_SECRET="smart_parking_refresh_secret_2026"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

---

## 11. Cómo Levantar el Proyecto

```bash
# 1. Levantar PostgreSQL (con Docker)
docker-compose up -d

# 2. Instalar dependencias
cd webapp && npm install

# 3. Generar el cliente Prisma
npx prisma generate

# 4. Correr migraciones (si aplica)
npx prisma migrate dev

# 5. Levantar la app
npm run dev
# Disponible en http://localhost:3000
```

---

---

# PREGUNTAS DE EXAMEN — Con Respuestas

## Arquitectura

**¿Por qué Next.js y no dos proyectos separados (frontend + backend)?**
> Next.js permite tener API Routes en el mismo servidor. Esto simplifica el despliegue (un solo proceso), elimina problemas de CORS, y reduce la complejidad. En este proyecto, el frontend y el backend comparten el mismo puerto (3000).

**¿Qué es un Route Handler en Next.js?**
> Es un archivo `route.js` dentro de `app/api/` que exporta funciones con el nombre del método HTTP (`GET`, `POST`, `PATCH`, `DELETE`). Next.js los convierte automáticamente en endpoints REST.

**¿Cuál es la diferencia entre un componente de página y una API route?**
> Una página (`page.js`) devuelve JSX y se renderiza como HTML para el usuario. Una API route (`route.js`) devuelve JSON y sirve como endpoint REST. Las páginas son el frontend; las API routes son el backend.

---

## Base de Datos

**¿Qué es Prisma y por qué se usa?**
> Prisma es un ORM que permite interactuar con PostgreSQL usando JavaScript en lugar de SQL. Genera código tipado a partir del schema, previene errores de sintaxis SQL, y facilita las relaciones entre tablas.

**¿Cómo se define la relación entre `ParkingSession` y `Vehicle`?**
> En el schema: `ParkingSession` tiene un campo `vehicle_id` que referencia el `id` de `Vehicle`. Prisma maneja el JOIN automáticamente con `include: { vehicle: true }`.

**¿Qué pasa con las sesiones cuando un vehículo entra al parqueo?**
> 1. Se valida que el vehículo existe y no está en lista negra.
> 2. Se valida que el espacio está disponible (`status: AVAILABLE`).
> 3. Se crea un registro en `ParkingSession` con `status: ACTIVE`.
> 4. Se actualiza el espacio a `status: OCCUPIED`.
> 5. Todo esto ocurre en una **transacción** (`prisma.$transaction`) para garantizar consistencia.

**¿Qué es una transacción y por qué se usa aquí?**
> Una transacción es un conjunto de operaciones que se ejecutan todas o ninguna. Se usa en entrada/salida de vehículos para evitar estados inconsistentes: si falla la actualización del espacio, también se revierte la creación de la sesión.

**¿Cómo se calcula el costo de una sesión?**
> Al registrar la salida se calcula: `duration_minutes = ceil((exit_time - entry_time) / 60000)` y `amount_due = (duration_minutes / 60) * tarifa_por_hora`. La tarifa actual es Q5.00/hora.

**¿Cómo funciona la lista negra de vehículos?**
> Cuando se agrega un vehículo a la blacklist, se actualiza `vehicle.blacklisted = true` y se crea un registro en la tabla `Blacklist` con la razón y quién lo agregó. Al intentar entrar, el sistema verifica `vehicle.blacklisted` antes de permitir la entrada.

---

## Autenticación

**¿Cómo funciona el JWT en este sistema?**
> Al hacer login, el servidor genera un `access_token` (válido 1 hora) y un `refresh_token` (válido 7 días). El frontend guarda el `access_token` en `localStorage` y lo envía en cada petición en el header `Authorization: Bearer <token>`. El servidor lo verifica antes de procesar la petición.

**¿Por qué no se guarda la contraseña en texto plano?**
> Porque si alguien accede a la base de datos podría ver todas las contraseñas. Se usa `bcrypt.hash(password, 12)` que aplica un hash unidireccional con 12 rondas de salting. Para verificar se usa `bcrypt.compare(input, hash)`.

**¿Qué pasa si el access_token expira?**
> El servidor devuelve un error 401. El interceptor de Axios en el frontend detecta el 401, limpia el localStorage y redirige al usuario al login. También existe un endpoint `POST /api/parqueo/auth?action=refresh` para renovar el token con el refresh_token.

---

## Flujo de Datos

**¿Cómo llega la información del sensor IoT al sistema?**
> El sensor ESP32 detecta si un espacio está ocupado o libre y envía una petición `POST /api/parqueo/spaces/sensor` con `{ space_code, status }`. El servidor actualiza el campo `status` del espacio en la base de datos y registra el timestamp en `last_sensor_update`.

**¿Cómo funciona el sistema de QR?**
> Cada usuario tiene un `qr_code` único en su perfil. Al escanear, el sistema busca si el QR corresponde a un usuario activo (`User.qr_code`) o a un QR de visitante temporal (`VisitorQR`). Si es visitante, marca el QR como usado (`is_used: true`) para que no se pueda reutilizar.

**¿Cómo funciona una reserva?**
> 1. El usuario selecciona espacio, hora de inicio y fin.
> 2. El sistema valida que no haya conflicto de horario con otra reserva en ese espacio.
> 3. Se crea la reserva con `status: CONFIRMED`.
> 4. El espacio cambia a `status: RESERVED`.
> 5. Las reservas expiradas se detectan al consultar `end_time < now`.

---

## Preguntas de Diseño

**¿Por qué se usa el patrón Singleton para Prisma?**
> Next.js en modo desarrollo hace Hot Module Replacement (recarga de módulos). Sin el singleton, cada recarga crearía una nueva instancia de `PrismaClient` y agotaría las conexiones del pool de PostgreSQL. Con `globalThis.prisma` se reutiliza la misma instancia.

**¿Qué información contiene el payload del JWT y por qué no más?**
> Solo contiene `sub` (ID del usuario), `email` y `role`. No se incluye información sensible porque el JWT es decodificable por cualquiera (solo está firmado, no cifrado). La información adicional del usuario se obtiene de la BD cuando se necesita.

**¿Cómo se diferencia un ADMIN de un STUDENT en el sistema?**
> A través del campo `role` en el modelo `User`. El JWT incluye el `role`, y las API routes pueden verificarlo para restringir acceso. Por ejemplo, solo un ADMIN puede eliminar usuarios o acceder a los logs de auditoría.

**¿Por qué el soft delete (deleted_at) en lugar de DELETE real?**
> Para mantener integridad referencial. Si se elimina físicamente un usuario que tiene sesiones históricas, esos registros quedarían huérfanos. Con `deleted_at` el usuario "desaparece" del sistema pero los datos históricos permanecen intactos. Las consultas filtran con `where: { deleted_at: null }`.
