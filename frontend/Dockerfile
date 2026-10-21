FROM ghcr.io/voidzero-dev/vite-plus:1.0.0 AS build
WORKDIR /app
COPY --chown=vp:vp frontend/package.json frontend/package-lock.json ./
RUN vp install --frozen-lockfile
COPY --chown=vp:vp frontend/ ./
ENV VITE_APP_API_URL=/api
RUN vp build

FROM nginx:stable-alpine AS runtime
COPY deploy/nginx/docker.conf /etc/nginx/conf.d/default.conf
COPY deploy/nginx/proxy_params.conf /etc/nginx/proxy_params.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
