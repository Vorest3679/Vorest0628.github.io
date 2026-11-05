FROM ghcr.io/voidzero-dev/vite-plus:1.0.0 AS dependencies
WORKDIR /app
# Keep the backend on the same Node/npm versions declared by the root package.
COPY --chown=vp:vp package.json /toolchain/package.json
COPY --chown=vp:vp backend/package.json backend/package-lock.json ./
RUN vp exec node -e "const fs = require('fs'); const p = require('./package.json'); const root = require('/toolchain/package.json'); p.engines = root.engines; p.devEngines = root.devEngines; fs.writeFileSync('package.json', JSON.stringify(p, null, 2))"
RUN vp install --frozen-lockfile --prod \
    && cp "$(vp env which node | head -1)" /tmp/node

FROM debian:bookworm-slim AS runtime
# libatomic1/libstdc++6：Node 二进制从 vite-plus 构建镜像复制而来，bookworm-slim 默认不带这些运行库
RUN apt-get -o Acquire::Retries=3 update \
    && apt-get -o Acquire::Retries=3 install -y --no-install-recommends \
      ca-certificates libatomic1 libstdc++6 \
    && sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources
RUN apt-get -o Acquire::Retries=3 update \
    && apt-get -o Acquire::Retries=3 install -y --no-install-recommends \
      libreoffice-writer libreoffice-calc libreoffice-impress \
      graphicsmagick ghostscript fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 1000 app \
    && useradd --uid 1000 --gid app --create-home app
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=dependencies /tmp/node /usr/local/bin/node
# 构建期就验证 Node 的运行库齐全，避免等到容器启动（或 healthcheck）才发现缺 .so
RUN node -v
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=app:app backend/ ./
RUN mkdir -p uploads && chown app:app uploads
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "app.js"]
