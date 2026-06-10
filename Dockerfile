# 基础镜像可通过 --build-arg 覆盖（如使用镜像加速源）：
#   docker build --build-arg NODE_IMAGE=mirror.gcr.io/library/node:22-alpine \
#                --build-arg NGINX_IMAGE=mirror.gcr.io/library/nginx:1.27-alpine .
ARG NODE_IMAGE=node:22-alpine
ARG NGINX_IMAGE=nginx:1.27-alpine

# ---- 构建阶段 ----
FROM ${NODE_IMAGE} AS build
WORKDIR /app

# npm 源可覆盖（国内网络建议：--build-arg NPM_REGISTRY=https://registry.npmmirror.com）
ARG NPM_REGISTRY=https://registry.npmjs.org
RUN npm config set registry "${NPM_REGISTRY}"

# 优先复制依赖清单，利用层缓存
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# 传入 VITE_API_BASE（空串=同源 /api，配合 nginx 反代）→ 前端走真实后端；
# 不传（默认哨兵 __MOCK__）→ 内存 Mock，保证单容器 docker compose up 仍可独立演示
ARG VITE_API_BASE=__MOCK__
RUN if [ "$VITE_API_BASE" = "__MOCK__" ]; then npm run build; \
    else VITE_API_BASE="$VITE_API_BASE" npm run build; fi

# ---- 运行阶段（nginx 静态托管）----
FROM ${NGINX_IMAGE} AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
