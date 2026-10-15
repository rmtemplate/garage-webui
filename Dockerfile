# syntax=docker/dockerfile:1.7
#
# Production image: the Vite frontend is embedded into a single static Go
# binary (see backend/ui/ui_prod.go, built with the `prod` tag), so the final
# image is just that binary on `scratch`.
#
# Requires BuildKit for the `--mount=type=cache` steps below. BuildKit is the
# default from Docker 23 onwards; on older daemons use `DOCKER_BUILDKIT=1
# docker build .` or `docker buildx build .`.

# ---------------------------------------------------------------------------
# Stage 1 — frontend
# ---------------------------------------------------------------------------
FROM node:22-slim AS frontend
WORKDIR /app

# Node 22 (not 20): recent corepack releases refuse to run on Node 20, which is
# what broke the previous build.
#
# pnpm is pinned to the exact version in package.json#packageManager and
# installed directly. The previous `corepack use pnpm@latest` resolved a
# different pnpm on every build — neither reproducible nor lockfile-safe.
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install --global --no-fund --no-audit pnpm@10.34.5

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

# `vite build` is a production build, so `import.meta.env.DEV` is false and the
# Local Demo Mode adapter in src/lib/demo/ is dropped at compile time (see
# src/lib/consts.ts). `.env*` is excluded by .dockerignore, so no VITE_DEMO_MODE
# can reach this stage either. The grep is the belt-and-braces check: if demo
# code ever does reach a production bundle, the build fails here rather than
# shipping a mock data service to users.
RUN pnpm run build \
 && if grep -rqE 'handleDemoRequest|GKDEMO|not-a-real-credential|Local Demo Mode' dist/; then \
      echo "ERROR: Demo Mode code leaked into the production bundle" >&2; \
      exit 1; \
    fi \
 && echo "OK: production bundle contains no Demo Mode code"

# ---------------------------------------------------------------------------
# Stage 2 — backend
# ---------------------------------------------------------------------------
# Go 1.24 matches the `toolchain go1.24.0` directive in backend/go.mod; the
# previous golang:1.23 base had to download that toolchain on every build.
FROM golang:1.24-bookworm AS backend
WORKDIR /app

COPY backend/go.mod backend/go.sum ./
RUN --mount=type=cache,id=gomod,target=/go/pkg/mod \
    go mod download

COPY backend/ ./
COPY --from=frontend /app/dist ./ui/dist

# `make` runs: CGO_ENABLED=0 go build -o main -tags="prod" main.go
RUN --mount=type=cache,id=gomod,target=/go/pkg/mod \
    --mount=type=cache,id=gobuild,target=/root/.cache/go-build \
    make

# ---------------------------------------------------------------------------
# Stage 3 — runtime
# ---------------------------------------------------------------------------
FROM scratch

# alpine is pinned rather than floating, so the CA bundle is reproducible.
COPY --from=alpine:3.21 /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=ghcr.io/tarampampam/curl:8.6.0 /bin/curl /bin/curl
COPY --from=backend /app/main /bin/main

EXPOSE 3909

HEALTHCHECK --interval=5m --timeout=2s --retries=3 --start-period=15s CMD [ \
    "curl", "--fail", "http://127.0.0.1:3909" \
]

ENTRYPOINT [ "main" ]
