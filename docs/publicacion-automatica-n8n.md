# Publicación automática con n8n

El portal ya publica en redes (Facebook/Instagram) cuando se ejecuta la **cola de publicaciones**. Eso hoy solo ocurre si alguien hace clic en **"Ejecutar ahora"** en el dashboard o en **"Publicar ahora"** en una publicación concreta.

Para que las publicaciones programadas salgan solas a la hora indicada, hace falta **algo que llame al publicador cada cierto tiempo**. En tu caso, **n8n en tu VPS** puede hacerlo.

---

## Qué hace el publicador

- Busca en la base de datos publicaciones con estado `scheduled` y `publishAt <= ahora`.
- Las envía a Meta (Facebook/Instagram) según la configuración del proyecto.
- Actualiza el estado a `published` o `failed` y registra actividad y notificaciones.

Todo eso ya está implementado; solo falta **disparar** esa lógica de forma periódica.

---

## Opción recomendada: n8n como programador

Con n8n en tu VPS puedes crear un flujo que llame al portal cada X minutos.

### 1. Configurar el token en el portal

En el servidor donde corre el portal (o en tu `.env` en producción), define un secreto que solo usará la automatización:

```env
PUBLISHER_RUN_TOKEN="un_valor_secreto_largo_y_aleatorio"
PUBLISHER_MODE="live"
```

- `PUBLISHER_MODE=live` es necesario para que realmente se publique en Meta (con `mock` solo simula).
- No compartas `PUBLISHER_RUN_TOKEN`; lo usarás solo en n8n.

### 2. Workflow en n8n

Crea un workflow con dos nodos:

1. **Schedule Trigger**
   - Rule: cada 5 minutos (o cada 1 minuto si quieres más precisión).
   - Ejemplo: `*/5 * * * *` (cada 5 min).

2. **HTTP Request**
   - Method: `POST`
   - URL: `https://TU-DOMINIO-DEL-PORTAL/api/publisher/run`
   - Headers:
     - `x-publisher-token`: el mismo valor que `PUBLISHER_RUN_TOKEN`
   - (Opcional) Query params:
     - `limit=20` (por defecto ya usa 20; máximo 100)

Cuando el Schedule Trigger se dispare, n8n hará POST a esa URL con el token. El portal comprobará el token y ejecutará la cola (todas las publicaciones vencidas hasta el límite).

### 3. Comprobar que funciona

- En el portal, programa una publicación para dentro de 1–2 minutos.
- Espera a que pase la hora y a que n8n ejecute el siguiente ciclo (según el intervalo que hayas puesto).
- Revisa en el portal que el estado pase a "Publicado" y en n8n que el nodo HTTP Request devuelva 200 y un JSON con `processed`, `published`, etc.

---

## Resumen de lo que “faltaba”

| Componente                         | Estado |
|-----------------------------------|--------|
| Publicación manual (botón / Publicar ahora) | ✅ Ya funciona |
| Lógica de cola (vencidas → Meta)  | ✅ Ya implementada en `lib/publishing.ts` |
| **Programador que ejecute la cola** | ❌ No existía → lo resuelves con **n8n** |

No hace falta añadir cron dentro del código del portal si usas n8n: el endpoint `POST /api/publisher/run` con `x-publisher-token` está pensado para que lo llame un cron o un servicio externo como n8n.

---

## Alternativas al uso de n8n

Si no usaras n8n, podrías:

- **Cron en el VPS**: un `cron` en Linux que cada 5 minutos haga:
  `curl -X POST -H "x-publisher-token: TU_TOKEN" https://tu-portal/api/publisher/run`
- **Vercel Cron** (si hosteas en Vercel): definir en `vercel.json` un cron que llame a una ruta protegida por token.
- **Otro orquestador** (GitHub Actions, etc.) que haga la misma petición POST con el token.

En todos los casos el requisito es: **llamar a `POST /api/publisher/run` con el header `x-publisher-token`** de forma periódica.
