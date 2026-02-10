# SaaS Social Media Dashboard

## Requisitos

- Node.js 20+
- Docker Desktop (para Postgres local)

## Levantar proyecto con base de datos real

1. Instala dependencias:

```bash
npm install
```

2. Levanta PostgreSQL:

```bash
docker compose up -d
```

3. Crea tablas desde Prisma schema:

```bash
npm run db:push
```

4. Carga datos iniciales:

```bash
npm run db:seed
```

5. Ejecuta la app:

```bash
npm run dev
```

## Verificar conexión a BD

Abre en el navegador:

- `http://localhost:3000/api/health/db`

Si todo está bien, responde `ok: true` con conteos de `users`, `projects` y `posts`.

## Archivos agregados

- `prisma/schema.prisma`
- `prisma/seed.mjs`
- `lib/prisma.ts`
- `app/api/health/db/route.ts`
- `docker-compose.yml`
- `.env.example`
- `.env`
