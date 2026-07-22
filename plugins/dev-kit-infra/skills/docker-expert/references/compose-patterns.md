# Docker Compose Patterns

All examples target Compose v2 (the `docker compose` CLI plugin, bundled with Docker Desktop and
Docker Engine). The legacy Python `docker-compose` (v1, hyphenated) binary is fully deprecated —
do not use `docker-compose` commands or expect them in current environments; use `docker compose`
(space-separated) throughout.

## Base Multi-Service Definition

```yaml
services:
  app:
    build:
      context: .
      target: runner
    image: registry.example.com/app:${TAG:-latest}
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/app
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    networks:
      - frontend
      - backend
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          memory: 256M

  db:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d app"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - backend

  cache:
    image: valkey/valkey:8-alpine
    networks:
      - backend

networks:
  frontend:
  backend:
    internal: true

volumes:
  postgres_data:
```

`cache` uses Valkey (the BSD-licensed, Redis-protocol-compatible fork) rather than Redis where the
project needs to avoid Redis's SSPL/RSALv2/AGPLv3 licensing — swap the image for `redis:8-alpine`
if the license terms are acceptable for the deployment.

## Development Override

```yaml
# docker-compose.override.yml (loaded automatically alongside docker-compose.yml)
services:
  app:
    build:
      target: builder
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
    command: npm run dev
    ports:
      - "9229:9229"  # debugger
```

```bash
docker compose up               # picks up compose.yml + compose.override.yml automatically
docker compose -f compose.yml -f compose.prod.yml up -d   # explicit prod overlay
```

## Compose Watch (Live Sync for Development)

```yaml
services:
  app:
    build: .
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: rebuild
          path: package.json
        - action: sync+restart
          path: ./config
          target: /app/config
```

```bash
docker compose watch
```

`develop.watch` replaces older bind-mount-and-hope workflows: source edits sync into the running
container, dependency-manifest changes trigger a rebuild, and config changes restart the service —
without a full `docker compose up --build` loop.

## Service Profiles

```yaml
services:
  app:
    build: .
    profiles: ["default"]

  db:
    image: postgres:18-alpine
    profiles: ["default"]

  debug-tools:
    image: nicolaka/netshoot
    profiles: ["debug"]

  seed:
    build:
      context: .
      dockerfile: Dockerfile.seed
    profiles: ["seed"]
    depends_on:
      db:
        condition: service_healthy
```

```bash
docker compose up                        # only default-profile services
docker compose --profile debug up        # default + debug
docker compose --profile seed run seed   # one-off seeding job
```

## Include Directive (Splitting Large Compose Files)

```yaml
# compose.yml
include:
  - path: ./services/api/compose.yml
  - path: ./services/worker/compose.yml
    env_file: ./services/worker/.env

services:
  gateway:
    image: registry.example.com/gateway:latest
    networks:
      - frontend

networks:
  frontend:
```

`include` composes multiple project-level Compose files into one logical project — useful for
splitting a large monorepo's Compose configuration by service team without duplicating network/
volume definitions.

## Health Checks and Startup Ordering

```yaml
services:
  api:
    build: .
    depends_on:
      db:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully

  migrate:
    build:
      context: .
      dockerfile: Dockerfile.migrate
    depends_on:
      db:
        condition: service_healthy
    restart: "no"
```

`service_completed_successfully` lets a one-shot migration container gate startup of the services
that depend on its output, without a custom wait script.

## Resource Constraints

```yaml
services:
  worker:
    image: registry.example.com/worker:latest
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
```

`deploy.resources` is honored by plain `docker compose up` (not just Swarm) on current Compose
versions — no Swarm mode required for the limits to apply.

## Environment-Specific Overrides

```bash
# .env (auto-loaded by docker compose)
TAG=1.4.2
COMPOSE_PROJECT_NAME=myapp
```

```yaml
services:
  app:
    image: registry.example.com/app:${TAG}
    env_file:
      - .env.${ENVIRONMENT:-development}
```

## Common Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| Hyphenated `docker-compose` commands in docs/scripts | `docker compose` (v2 CLI plugin) |
| No `healthcheck` + naive `depends_on` | Add `healthcheck` + `condition: service_healthy` |
| Secrets in plain `environment:` values committed to VCS | Use `secrets:` top-level key or an untracked `.env` file |
| One giant `compose.yml` for a large multi-team project | Split with `include:` |
| Manually scripting "wait for db" logic | Use `depends_on` conditions instead |
| No resource limits on shared dev/CI hosts | Set `deploy.resources.limits` |
