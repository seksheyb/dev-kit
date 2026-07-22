# Container Security Hardening

## Non-Root User Execution

```dockerfile
FROM node:22-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --chown=nodejs:nodejs . .
USER nodejs
CMD ["node", "index.js"]
```

```yaml
# Compose: enforce non-root even if the image forgot to set USER
services:
  app:
    image: registry.example.com/app:latest
    user: "1001:1001"
```

Never rely on `USER root` (the default in most base images) in production. Where an image can't
be modified, override at the orchestrator/runtime level (`user:` in Compose, `securityContext.
runAsNonRoot: true` in Kubernetes).

## Read-Only Root Filesystem

```yaml
services:
  app:
    image: registry.example.com/app:latest
    read_only: true
    tmpfs:
      - /tmp
      - /app/cache
```

```bash
docker run --read-only --tmpfs /tmp --tmpfs /app/cache registry.example.com/app:latest
```

Mount writable paths explicitly as `tmpfs` or named volumes rather than leaving the whole
filesystem writable — this blocks most persistence techniques used after an initial compromise.

## Capability Restrictions

```yaml
services:
  app:
    image: registry.example.com/app:latest
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE   # only if the process must bind < 1024
    security_opt:
      - no-new-privileges:true
```

```bash
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE --security-opt no-new-privileges:true app:latest
```

Drop all capabilities by default, then add back only the specific ones the process needs.
`no-new-privileges` blocks setuid/setgid escalation even if a capability slips through.

## Seccomp and AppArmor Profiles

```bash
docker run --security-opt seccomp=./custom-seccomp.json app:latest
docker run --security-opt apparmor=docker-custom-profile app:latest
```

```yaml
services:
  app:
    image: registry.example.com/app:latest
    security_opt:
      - seccomp:./profiles/app-seccomp.json
      - apparmor:docker-default
```

Docker ships a restrictive default seccomp profile; only replace it with a custom one when the
default blocks a syscall the application legitimately needs, and scope the custom profile to allow
just that syscall rather than disabling filtering broadly.

## Secret Management

```yaml
# Compose secrets (mounted as files, not environment variables)
services:
  app:
    image: registry.example.com/app:latest
    secrets:
      - db_password
      - api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    environment: API_KEY   # sourced from the invoking shell's env, not baked into the file
```

The app reads secrets from `/run/secrets/<name>` inside the container. Do not pass secrets via
plain `environment:` — they end up in `docker inspect` output, container logs, and process listings.
For build-time secrets, use BuildKit's `--mount=type=secret` (see `dockerfile-optimization.md`),
never `ARG`.

## Image Scanning

```bash
docker scout cves registry.example.com/app:latest
docker scout recommendations registry.example.com/app:latest

trivy image --severity CRITICAL,HIGH --exit-code 1 registry.example.com/app:latest
```

Wire the scan into CI as a gate (non-zero exit on CRITICAL/HIGH findings) rather than a report
nobody reads. Re-scan on a schedule too — a base image with zero CVEs at build time can accrue new
disclosures the following week.

## Docker Hardened Images (DHI)

```dockerfile
# Dev variant: includes a shell/package manager for building
FROM dhi.io/node:22-dev AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

# Runtime variant: minimal, no shell, non-root by default
FROM dhi.io/node:22 AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
USER nonroot
CMD ["dist/main.js"]
```

DHI base images are built and attested for near-zero known CVEs, with SLSA Build Level 3 provenance
and an included SBOM per image. Use the `-dev` variant only for the build stage; ship the minimal
runtime variant. DHI has Free and Enterprise tiers with different image/registry coverage — check
current entitlements before assuming a given image is available on the free tier.

## SBOM Generation and Signing

```bash
# SBOM
docker buildx build --sbom=true -t registry.example.com/app:1.0.0 --push .
syft registry.example.com/app:1.0.0 -o spdx-json > app-sbom.json

# Cosign signing and verification
cosign sign registry.example.com/app:1.0.0
cosign verify --certificate-identity-regexp ".*" --certificate-oidc-issuer-regexp ".*" \
  registry.example.com/app:1.0.0

# SLSA provenance attestation
docker buildx build --provenance=true --sbom=true -t registry.example.com/app:1.0.0 --push .
```

## Policy-as-Code Enforcement

```yaml
# Example: OPA/Conftest rule rejecting root-user images (conceptual, adapt to your policy engine)
package docker.security

deny[msg] {
  input.config.User == ""
  msg := "container must not run as root (USER not set)"
}

deny[msg] {
  input.config.User == "root"
  msg := "container must not explicitly run as root"
}
```

Run policy checks in CI against the built image config (`docker inspect` / SBOM output) before
pushing to a registry, not just against the Dockerfile source — a base image can silently
reintroduce a root user that source-level linting won't catch.

## CIS Docker Benchmark Highlights

| Control area | Practice |
|---|---|
| Host configuration | Keep Docker Engine patched; restrict daemon socket access |
| Docker daemon config | Enable content trust, disable legacy registry API, enable live restore |
| Image/build | Non-root `USER`, pinned base image versions, no secrets in layers, minimal packages |
| Container runtime | `cap_drop: ALL`, `no-new-privileges`, read-only root FS, resource limits set |
| Registry | Enforce image signing verification before pull in production, scan on push |

## Runtime Filesystem Hardening Checklist

- `read_only: true` + `tmpfs` for required writable paths
- `cap_drop: ALL` with a minimal explicit `cap_add`
- `no-new-privileges:true`
- Non-root `USER`/`user:` enforced at both image and runtime level
- Resource limits (`cpus`, `memory`, `pids-limit`) set to bound blast radius of a compromised process
- Seccomp default profile active (don't disable with `--privileged` or `--security-opt seccomp=unconfined`)
- Secrets mounted via `secrets:`/`--mount=type=secret`, never `environment:` or image layers

## Common Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| `--privileged` containers in production | Drop to minimal explicit capabilities instead |
| Root user (implicit or explicit) | Non-root `USER` in the image, enforced again at runtime |
| Secrets baked into image layers or `environment:` | `secrets:` / `--mount=type=secret` |
| No image scanning in CI | Gate builds on `docker scout` / Trivy severity thresholds |
| Unpinned `latest` base images in prod Dockerfiles | Pin explicit versions (and digests where reproducibility matters) |
| No SBOM/provenance on shipped images | `--sbom=true --provenance=true` at build, sign with Cosign |
