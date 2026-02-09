# 🚀 Viaje Conexión — Backend API REST

## Hito 3 - Desarrollo Backend 

API REST desarrollada con **Node.js + Express + PostgreSQL**.

### Requerimientos cumplidos

1. **Proyecto npm + dependencias**  — Express, pg, bcryptjs, jsonwebtoken, cors, dotenv
2. **Paquete pg para PostgreSQL**  — Pool de conexiones, consultas parametrizadas, CRUD completo
3. **Autenticación y autorización con JWT**  — Login, register, tokens con expiración 24h
4. **CORS habilitado**  — Paquete cors configurado globalmente
5. **Middlewares de validación**  — verificarAuth, verificarAdmin, logRequest, manejarError
6. **Tests con supertest**  — 8 tests en 4+ rutas con diferentes códigos de estado

---

### Instrucciones

```bash
cd viaje-backend
npm install
```

Crear base de datos en PostgreSQL:
```sql
CREATE DATABASE viaje_conexion;
```

Ejecutar el script SQL:
```bash
psql -U postgres -d viaje_conexion -f script.sql
```

Configurar `.env`:
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=viaje_conexion
JWT_SECRET=v1aj3_c0n3x10n_s3cr3t_k3y_2025
```

Iniciar servidor:
```bash
npm run dev
```

Correr tests:
```bash
npm test
```

---

### Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Registrar usuario |
| POST | /api/auth/login | No | Iniciar sesión |
| GET | /api/auth/me | Sí | Perfil del usuario |
| GET | /api/publicaciones | No | Listar publicaciones |
| GET | /api/publicaciones/:id | No | Detalle publicación |
| POST | /api/publicaciones | Sí | Crear publicación |
| PUT | /api/publicaciones/:id | Sí | Editar publicación |
| DELETE | /api/publicaciones/:id | Sí | Eliminar publicación |
| GET | /api/favoritos | Sí | Listar favoritos |
| POST | /api/favoritos | Sí | Agregar favorito |
| DELETE | /api/favoritos/:id | Sí | Eliminar favorito |
| GET | /api/carrito | Sí | Ver carrito |
| POST | /api/carrito | Sí | Agregar al carrito |
| PUT | /api/carrito/:item_id | Sí | Actualizar cantidad |
| DELETE | /api/carrito | Sí | Vaciar carrito |
| POST | /api/ordenes | Sí | Confirmar compra |
| GET | /api/ordenes | Sí | Mis órdenes |
| PUT | /api/ordenes/:id/cancelar | Sí | Cancelar orden |
