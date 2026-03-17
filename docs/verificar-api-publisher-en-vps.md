# Verificar por qué /api/publisher/run devuelve HTML en vez de JSON

Si n8n sigue recibiendo la página de login (HTML), hay que comprobar **dónde** se atiende la petición.

## 1. Probar directo contra la app Node (sin proxy)

En el VPS, con la app corriendo (PM2), ejecuta:

```bash
# Sustituye 3000 por el puerto que use tu app (pm2 show publicaciones-front)
curl -s -o /tmp/out -w "%{http_code}\n" -X POST \
  -H "x-publisher-token: TU_TOKEN_AQUI" \
  http://127.0.0.1:3000/api/publisher/run
cat /tmp/out | head -c 500
```

- Si ves **200** y el contenido empieza con `{"scanned":` o `{"message":` → la app **sí responde JSON**. El fallo está en **Nginx/proxy** (no reenvía bien `/api` o reenvía a otro sitio).
- Si ves **200** y contenido con `<!DOCTYPE html>` → la app en el VPS **sigue sirviendo HTML** (código viejo o build sin los cambios del middleware).
- Si ves **401** y JSON `{"message":"No autorizado."}` → la app recibe la petición pero el token no coincide; revisa `PUBLISHER_RUN_TOKEN` en el `.env` del servidor.

## 2. Confirmar que el código desplegado tiene el fix

En el servidor:

```bash
cd /var/www/casaymas/Portal-publicaciones
grep -n "api/publisher" middleware.ts
```

Debe aparecer:
- Una línea con `pathname.startsWith('/api/publisher')` (callback authorized).
- Una línea con `api/publisher` en el `matcher` (exclusión).

Si no está, haz pull/build y reinicia:

```bash
git pull
pnpm install
pnpm build
pm2 restart publicaciones-front
```

## 3. Revisar Nginx (o el proxy que use el dominio)

Si en el paso 1 la app en localhost **sí devolvió JSON**, el problema es el proxy.

- Asegúrate de que el `server` que atiende `publicaciones.casaymas.online` hace `proxy_pass` al **mismo puerto** donde corre la app (ej. `http://127.0.0.1:3000`).
- No debe haber `try_files` ni `rewrite` que manden `/api/*` a `index.html` o a otra app.
- Ejemplo mínimo:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Tras cambiar Nginx: `sudo nginx -t && sudo systemctl reload nginx`.

## 4. Resumen

| Resultado del curl a 127.0.0.1 | Qué hacer |
|--------------------------------|-----------|
| JSON 200 o 401                 | Arreglar proxy (Nginx) para que reenvíe `/api` a la app. |
| HTML 200                       | Desplegar de nuevo (pull, build, restart) y comprobar `middleware.ts`. |
| Conexión rechazada / timeout   | Comprobar que la app está levantada en ese puerto (`pm2 list`, `pm2 logs`). |
