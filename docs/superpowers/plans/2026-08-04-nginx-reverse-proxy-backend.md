# Reverse proxy nginx front → back (same-origin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El front deja de llamar directo a la URL pública del back (cuyo certificado el browser no confía); en su lugar, el nginx que sirve el front proxea `/api/*` al Service interno de OpenShift `renapdis-backend:8080`, así el browser sólo habla con un origin (el del front, cert ya confiable) y el usuario deja de tener que "confiar" manualmente en la URL del back.

**Architecture:** `nginx.conf` (mismo pod del front) agrega `location ^~ /api/` con `proxy_pass http://renapdis-backend:8080;` estático (resuelto una sola vez al arrancar nginx, vía DNS interno de OpenShift). El `^~` es necesario para que este location le gane al location regex de cache de assets estáticos ya existente (sin `^~`, un path como `/api/x/avatar.png` sería shadowed por el regex de `.png` y devolvería 404 en vez de llegar al back). El build de prod deja de pasar `VITE_API_BASE_URL`, así el cliente cae a `/api` relativo (ya soportado por `src/api/client.ts`).

> **Nota (revisión post-planning):** la versión original de este plan usaba `resolver local=on;` + `proxy_pass` por variable, para resolver el hostname del back en cada request (no una sola vez al bootear nginx) y así evitar que un DNS temporalmente no disponible tumbe todo el nginx. Se verificó con Docker contra la imagen real (`nginxinc/nginx-unprivileged:1.27-alpine`, nginx 1.27.5) que `resolver local=on;` **no existe** en nginx mainline (es una directiva de OpenResty) — el contenedor no arranca (`host not found in resolver "local=on"`). Ante esto se consultó al usuario entre dos alternativas: (a) plantilla + `NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1` de la imagen nginxinc para lograr el mismo efecto de forma soportada, o (b) volver al `proxy_pass` estático simple. Se eligió (b) por simplicidad/YAGNI: el Service `renapdis-backend` se crea junto con su Deployment en el mismo manifiesto, así que el caso "DNS no resuelve al bootear el pod del front" es de probabilidad baja en este deploy.

**Tech Stack:** nginx (imagen `nginxinc/nginx-unprivileged:1.27-alpine`), Docker (validación local), Vite/React (sin cambios de código).

## Global Constraints

- Sin cambios en `src/` — `src/api/client.ts` ya soporta `/api` relativo, confirmado por spec.
- Sin cambios en `openshift/frontend.yaml` ni en `openshift/backend.yaml` (repo hermano) — confirmado por spec.
- Un único `location /api/` cubre el 100% del tráfico al back — confirmado por spec (no hay WebSockets/SSE ni otros prefijos).
- El Service interno del back es `renapdis-backend`, puerto `8080`, mismo namespace `renapdis` — confirmado con `oc get pods -n renapdis` / `openshift/backend.yaml` del repo hermano.
- No hay test runner para `nginx.conf` en este repo — la validación de esta feature es manual/local con Docker, no `npm test`.

---

### Task 1: Reverse proxy `/api/` en `nginx.conf`

**Files:**
- Modify: `nginx.conf`

**Interfaces:**
- Consumes: nada (config standalone).
- Produces: comportamiento en runtime — cualquier request a `/api/*` contra el front se reenvía a `http://renapdis-backend:8080/api/*`, preservando la URI original.

- [ ] **Step 1: Editar `nginx.conf` para agregar el location `/api/`**

Reemplazar el contenido completo de `nginx.conf` por:

```nginx
# Server SPA: toda ruta que no matchea un archivo cae a index.html; react-router
# resuelve el resto client-side. Sin esto, F5 en una ruta como /expedientes/1
# devuelve 404 porque en el filesystem no existe ese archivo.
server {
    listen       8080;
    server_name  _;

    root   /usr/share/nginx/html;
    index  index.html;

    # Reverse proxy al backend interno del cluster (Service renapdis-backend,
    # mismo namespace): el browser sólo habla con este origin (el del front, cert
    # ya confiable); nginx reenvía por la red interna de OpenShift en HTTP plano,
    # sin TLS ni problemas de certificado del lado del browser.
    # ^~ es necesario: sin él, el location regex de assets estáticos (más abajo)
    # le gana a este por extensión de archivo (ej. /api/x/avatar.png caería ahí
    # en vez de proxearse, porque nginx prioriza location regex sobre location
    # de prefijo salvo que este último use ^~).
    location ^~ /api/ {
        proxy_pass http://renapdis-backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Assets versionados por Vite (hash en el nombre): cache agresivo.
    location ~* \.(?:js|css|svg|png|jpg|jpeg|gif|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # index.html sin cache: que un deploy nuevo se vea sin purgar el navegador.
    location = /index.html {
        add_header Cache-Control "no-cache";
    }
}
```

- [ ] **Step 2: Build de la imagen del front (sin `VITE_API_BASE_URL`, usa el default vacío)**

Run: `docker build -t renapdis-frontend-test .`
Expected: build exitoso (Vite compila con `VITE_API_BASE_URL` vacía → cliente usa `/api` relativo).

- [ ] **Step 3: Levantar una red Docker con un backend "falso" llamado `renapdis-backend`**

Esto simula el Service interno de OpenShift: un contenedor accesible por nombre en la misma red, en el puerto 8080.

Run:
```bash
docker network create renapdis-test-net
docker run -d --rm --network renapdis-test-net --network-alias renapdis-backend \
  --name renapdis-backend-fake python:3.12-alpine python3 -m http.server 8080
```
Expected: ambos comandos terminan OK (el segundo imprime un container ID).

- [ ] **Step 4: Levantar el front en la misma red y probar que `/api/` llega al backend falso, no al SPA**

Run:
```bash
docker run -d --rm --network renapdis-test-net --name renapdis-frontend-fake \
  -p 18080:8080 renapdis-frontend-test
sleep 1
curl -s -o /dev/null -w 'GET /            -> %{http_code}\n' http://localhost:18080/
curl -s http://localhost:18080/ | grep -o '<div id="root">' 
curl -s -o /dev/null -w 'GET /api/health  -> %{http_code}\n' http://localhost:18080/api/health
curl -s http://localhost:18080/api/health | grep -o 'Directory listing'
curl -s -o /dev/null -w 'GET /api/x/avatar.png -> %{http_code}\n' http://localhost:18080/api/x/avatar.png
curl -s http://localhost:18080/api/x/avatar.png | grep -o 'Directory listing'
```

Expected:
- `GET /` → `200`, y aparece `<div id="root">` (sigue sirviendo el SPA normalmente).
- `GET /api/health` → `200`, y el body contiene `Directory listing` (el texto que devuelve `python -m http.server` por default) — esto prueba que la request llegó de verdad al contenedor `renapdis-backend` a través del proxy, y **no** cayó en el `try_files ... /index.html` del SPA (si cayera ahí, en vez de "Directory listing" veríamos el mismo `<div id="root">` que en `/`).
- `GET /api/x/avatar.png` → `200`, con `Directory listing` también — prueba que el `^~` funciona: aunque el path termina en `.png`, tiene que llegar al backend y no caer en el location regex de cache de assets.

- [ ] **Step 5: Limpiar los contenedores y la red de prueba**

Run:
```bash
docker stop renapdis-frontend-fake renapdis-backend-fake
docker network rm renapdis-test-net
```
Expected: ambos contenedores se detienen (el flag `--rm` los borra solos), la red se elimina sin error.

- [ ] **Step 6: Commit**

```bash
git add nginx.conf
git commit -m "feat(front): reverse proxy /api hacia el Service interno del back"
```

---

### Task 2: Actualizar guía de build en `Dockerfile`

**Files:**
- Modify: `Dockerfile:13-18`

**Interfaces:**
- Consumes: nada.
- Produces: nada en runtime (sólo comentario/guía) — el mecanismo `ARG`/`ENV VITE_API_BASE_URL` no cambia, sigue disponible para el caso cross-site real.

- [ ] **Step 1: Reemplazar el comentario y `ARG`/`ENV` de `VITE_API_BASE_URL`**

En `Dockerfile`, reemplazar las líneas 13-18:

```dockerfile
# Vite inyecta las env VITE_* en BUILD-TIME (no en runtime como el backend con
# Spring). Para un ambiente cross-site pasá el host real del backend:
#   oc start-build renapdis-frontend --from-dir=. \
#     --build-arg=VITE_API_BASE_URL=https://backend-host/api --follow
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
```

por:

```dockerfile
# Vite inyecta las env VITE_* en BUILD-TIME (no en runtime como el backend con
# Spring). Front y back en el mismo namespace de OpenShift (caso estándar): NO
# pasar este build-arg (o pasarlo vacío) — el cliente cae a '/api' relativo,
# resuelto por el location /api/ de nginx.conf (proxy interno al Service
# renapdis-backend, sin problemas de certificado del lado del browser).
# Sólo hace falta setearlo si el back vive fuera de este cluster/namespace:
#   oc start-build renapdis-frontend --from-dir=. \
#     --build-arg=VITE_API_BASE_URL=https://backend-host/api --follow
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
```

- [ ] **Step 2: Rebuild de sanity check**

Run: `docker build -t renapdis-frontend-test .`
Expected: build exitoso (cambio es sólo de comentarios, no debería alterar el resultado — confirma que no se rompió la sintaxis del Dockerfile).

- [ ] **Step 3: Commit**

```bash
git add Dockerfile
git commit -m "docs(front): actualizar guía de VITE_API_BASE_URL para deploy same-namespace"
```

---

## Después del plan (fuera de las tareas de código, requiere acceso `oc` que esta sesión no tiene)

1. Redeploy del front en OpenShift **sin** pasar `--build-arg=VITE_API_BASE_URL=...` (o pasándolo vacío), para que tome el nuevo default `/api` relativo:
   ```
   oc start-build renapdis-frontend --from-dir=. --follow
   ```
2. Verificar en el browser (pestaña Network) que las llamadas a `/api/...` devuelven 200/lo esperado sin warning de certificado ni error de CORS, sin haber visitado antes la URL del back.
3. Confirmar que el healthcheck propio del back (`/api/health`, usado por sus probes) sigue funcionando — no se tocó su path ni su Service.
