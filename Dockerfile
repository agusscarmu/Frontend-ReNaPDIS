# syntax=docker/dockerfile:1
# Multi-stage build para OpenShift.
# Build: Node. Runtime: nginx-unprivileged — ya escucha en :8080 como usuario
# no-root y sus directorios de trabajo son escribibles por el grupo 0, por eso
# corre sin cambios bajo la SCC "restricted" (arbitrary UID) de OpenShift.

# ---- Build ----
FROM node:20-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Vite inyecta las env VITE_* en BUILD-TIME (no en runtime como el backend con
# Spring). Para un ambiente cross-site pasá el host real del backend:
#   oc start-build renapdis-frontend --from-dir=. \
#     --build-arg=VITE_API_BASE_URL=https://backend-host/api --follow
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ---- Runtime ----
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html
EXPOSE 8080
