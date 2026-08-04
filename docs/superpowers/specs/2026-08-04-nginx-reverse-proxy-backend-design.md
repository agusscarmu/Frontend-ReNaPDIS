# Reverse proxy nginx front → back (same-origin) — Diseño

Fecha: 2026-08-04

## Contexto

- Front y back se despliegan como pods separados en el mismo namespace de OpenShift
  (`renapdis`), confirmado con `oc get pods -n renapdis`: `renapdis-frontend-*` y
  `renapdis-backend-*` corren en el mismo proyecto. El back tiene su propio Service
  interno `renapdis-backend` en el puerto `8080` (`../renapdis-backend/openshift/backend.yaml`).
- Hoy, en prod, el front apunta al back con una URL absoluta cross-site vía
  `VITE_API_BASE_URL` (build-arg de `Dockerfile`, inyectado por Vite en build-time, ver
  comentario en `Dockerfile:13-18`). El browser llama directo a la Route pública del back
  (`renapdis-backend`, TLS edge termination, `openshift/backend.yaml` del repo hermano).
- Esa Route del back tiene un certificado no confiable para el browser (autoridad no
  reconocida / falta de autorización), y al ser un origin distinto del front, el browser
  bloquea la petición. El único workaround actual es que el usuario visite manualmente la
  URL del back y acepte la excepción de certificado — desprolijo y confuso para el usuario
  final.
- `src/api/client.ts` ya soporta un modo same-origin: `baseURL` cae a `/api` relativo
  cuando `VITE_API_BASE_URL` no está seteada o es string vacío (usado hoy en dev vía proxy
  de Vite). El código no necesita cambios; sólo cambia cómo se buildea/despliega.
- No hay WebSockets ni SSE en el front (confirmado por búsqueda en `src/`); todo el
  tráfico al back pasa por axios con `baseURL` único, bajo el prefijo `/api`.

## Decisiones

1. **Reverse proxy interno, no cambio de CA/certificados.** El nginx que sirve los
   estáticos del front (mismo pod, `nginx.conf`) agrega un `location /api/` que hace
   `proxy_pass` al Service interno del back (`http://renapdis-backend:8080`), tráfico
   HTTP plano dentro del cluster. Se descarta:
   - Instalar/confiar la CA del back en los navegadores de los usuarios (no escalable,
     requiere acción manual por usuario/máquina, es justamente lo que se quiere evitar).
   - Proxy vía la Route pública del back con `proxy_ssl_verify off` (agrega una hop HTTPS
     innecesaria y deshabilita verificación de cert incluso para tráfico que sí podría
     validarse; el Service interno no tiene ese problema porque nunca sale del cluster).
2. **Sin rewrite de path.** El back ya expone sus rutas bajo `/api` (su propio healthcheck
   es `/api/health`, ver `backend.yaml:32/36/39`), y el front ya llama a `/api/...`. Un
   `proxy_pass http://renapdis-backend:8080;` (sin path después del host) reenvía la URI
   original tal cual, sin necesidad de `rewrite` ni de recortar el prefijo.
3. **Alcance de paths:** un único `location /api/` cubre el 100% de las llamadas del
   front (confirmado: no hay otro prefijo ni servicio del back al que el front le pegue
   directo).
4. **`VITE_API_BASE_URL` deja de setearse en el build de prod.** Al quedar vacía, el
   cliente usa `/api` relativo (mismo comportamiento que dev), que ahora sí resuelve
   correctamente porque nginx lo proxea local. La env variable se mantiene disponible en
   el `Dockerfile`/build para un eventual escenario futuro de front y back en clusters
   separados sin red interna compartida, pero deja de ser parte del flujo de deploy
   estándar.
5. **Sin cambios en `openshift/frontend.yaml`.** El Service/Route del front no cambian;
   siguen exponiendo el puerto 8080 del contenedor nginx.
6. **Sin cambios de CORS en el backend.** Al pasar a same-origin, la config CORS actual
   del back (si la hubiera) deja de ser necesaria para este flujo, pero no se toca en esta
   iteración (fuera de alcance, no rompe nada mantenerla).

## Diseño

### 1. `nginx.conf`

Se agrega un `location /api/` con proxy hacia el Service interno del back, antes del
`location /` existente:

```nginx
location /api/ {
    proxy_pass http://renapdis-backend:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

- `proxy_pass` sin path final ⇒ nginx reenvía la URI completa tal cual llegó
  (`/api/expedientes/1` → `http://renapdis-backend:8080/api/expedientes/1`).
- Headers estándar de proxy para que el back tenga IP real / proto original del cliente
  si los llegara a necesitar (logging, futuras validaciones).
- El resto del archivo (`location /`, cache de assets versionados, `index.html` sin
  cache) no cambia.

### 2. `Dockerfile`

- Se actualiza el comentario de las líneas 13-18 para reflejar que, en el deploy
  estándar contra este mismo cluster/namespace, **no** hace falta pasar
  `VITE_API_BASE_URL` como build-arg (queda vacía → `/api` relativo → resuelto por el
  proxy de nginx). Se documenta que la env sigue existiendo por si en el futuro hace
  falta un build cross-site real (back fuera del cluster/namespace del front).
- No cambia el mecanismo de build (`ARG`/`ENV` se mantienen), sólo el comentario guía y
  el comando de ejemplo (se saca el `--build-arg=VITE_API_BASE_URL=...` del ejemplo por
  default).

### 3. `openshift/frontend.yaml`

- Sin cambios.

### 4. Fuera de alcance

- No se toca `openshift/backend.yaml` ni la Route del back (sigue existiendo para acceso
  directo si hiciera falta, ej. debugging).
- No se agrega manejo de WebSockets/SSE en el proxy (no hay uso actual).
- No se cambia la config CORS del backend.
- No se automatiza el rebuild/redeploy del front — queda como paso manual posterior a
  este cambio (`oc start-build` sin el build-arg viejo).

## Testing

- No hay tests automatizados para `nginx.conf` (config estática servida por el
  contenedor, sin test runner en este repo para eso).
- Validación manual post-deploy:
  1. Build de la imagen sin `VITE_API_BASE_URL` (o con valor vacío).
  2. Deploy/redeploy del pod del front.
  3. Acceder a la Route del front en el browser, loguearse, y confirmar en la pestaña
     Network que las llamadas a `/api/...` resuelven con status 200 (o el esperado por
     endpoint) **sin** warning de certificado ni error de CORS, y sin necesidad de visitar
     la URL del back manualmente.
  4. Confirmar que el healthcheck del back (`/api/health`, usado por sus propios
     probes) sigue funcionando sin cambios — no se toca su path.
