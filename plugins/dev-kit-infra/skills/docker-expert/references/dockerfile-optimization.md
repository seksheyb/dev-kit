# Dockerfile Optimization

## Multi-Stage Build (Node.js)

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
```

BuildKit is the default builder for `docker build` — no `DOCKER_BUILDKIT=1` opt-in needed on current
Docker Engine. `--mount=type=cache` and `--mount=type=secret` require the `# syntax=docker/dockerfile:1`
directive but not any BuildKit flag.

## Multi-Stage Build (Python)

```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.12-slim AS builder
WORKDIR /app
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir poetry
COPY pyproject.toml poetry.lock ./
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes
RUN --mount=type=cache,target=/root/.cache/pip \
    pip wheel --wheel-dir /wheels -r requirements.txt

FROM python:3.12-slim AS runner
WORKDIR /app
RUN useradd -m -u 1001 appuser
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels
COPY --chown=appuser:appuser . .
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Layer Ordering and Cache Hit Rate

Order instructions from least- to most-frequently-changing so cache invalidation only touches the
layers that need it:

1. Base image + OS packages
2. Dependency manifests (`package.json`, `requirements.txt`, `go.mod`) + install
3. Source code copy
4. Build step
5. Runtime configuration (`ENV`, `EXPOSE`, `USER`, `HEALTHCHECK`, `CMD`)

```dockerfile
# Bad: any source change busts the dependency-install cache layer
COPY . .
RUN npm ci

# Good: dependency layer only invalidates when the manifest changes
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
```

## BuildKit Cache Mounts

```dockerfile
# Cache the package manager's download cache across builds without baking it into the image
RUN --mount=type=cache,target=/root/.npm npm ci
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends curl
```

## Build-Time Secrets (Never Bake Secrets into Layers)

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci --omit=dev
```

```bash
docker build --secret id=npmrc,src=$HOME/.npmrc -t app:latest .
```

Never use `ARG`/`ENV` for secrets — build args are cached in image history and visible via
`docker history`; use `--mount=type=secret` (BuildKit) instead.

## Base Image Selection

| Base | Size | Use case |
|---|---|---|
| `distroless` (e.g. `gcr.io/distroless/nodejs22`) | Smallest | No shell, minimal attack surface, static/compiled apps |
| `-alpine` (musl libc) | Small | Most apps; watch for musl vs glibc native-module incompatibilities |
| `-slim` (Debian, glibc) | Medium | Apps needing glibc compatibility or apt packages |
| DHI runtime variants (`dhi.io/...`) | Small, near-zero CVE | Enterprises standardizing on hardened, attested base images |
| Full/default tag | Largest | Avoid in production; fine for local dev-stage targets |

Pin digests or specific versions (`node:22.14.0-alpine`, not `node:latest` or bare `node:22-alpine`
in security-sensitive pipelines) so a base image update can't silently change what ships.

## .dockerignore

A missing or thin `.dockerignore` inflates build context upload time and can leak secrets into the
image. Keep it close to the source tree it excludes:

```
.git
.github
node_modules
npm-debug.log
.env*
!.env.example
*.md
Dockerfile*
docker-compose*
.dockerignore
coverage
.nyc_output
dist
__pycache__
*.pyc
.venv
```

## ARG / ENV Configuration

```dockerfile
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS base

ARG BUILD_ENV=production
ENV NODE_ENV=${BUILD_ENV} \
    PORT=3000
```

- `ARG` values before the first `FROM` are usable in the `FROM` line but not later stages unless
  re-declared with `ARG` inside that stage.
- Prefer `ENV` for values the running container needs; use `ARG` for values only needed at build
  time (e.g., a version pin) to keep the final image's environment minimal.

## HEALTHCHECK

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/healthz || exit 1
```

Set `--start-period` long enough to cover realistic cold-start time so the check doesn't flap the
container into `unhealthy` during normal startup.

## Multi-Platform Builds

```bash
docker buildx create --name multiarch --use
docker buildx build --platform linux/amd64,linux/arm64 -t registry.example.com/app:1.0.0 --push .
```

Use `--platform` per stage when a build tool itself needs to run natively:

```dockerfile
FROM --platform=$BUILDPLATFORM golang:1.23 AS builder
ARG TARGETOS
ARG TARGETARCH
RUN GOOS=$TARGETOS GOARCH=$TARGETARCH go build -o /app .
```

## Common Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| Single-stage build shipping build tools | Multi-stage build; copy only build artifacts to the runtime stage |
| Running as root (`USER` never set) | Add a non-root user and `USER` before `CMD`/`ENTRYPOINT` |
| `apt-get install` without `--no-install-recommends` + cleanup | Combine `update && install && rm -rf /var/lib/apt/lists/*` in one `RUN` |
| `COPY . .` before installing dependencies | Copy manifests first, install, then copy source |
| No `.dockerignore` | Add one; exclude VCS, secrets, build output, docs |
| `FROM image:latest` in production Dockerfiles | Pin an explicit version (and digest where reproducibility matters) |
| Secrets passed via `ARG`/`ENV` | Use `--mount=type=secret` |
| No `HEALTHCHECK` | Add one scoped to a real readiness endpoint |
