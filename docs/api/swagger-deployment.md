# Swagger UI deployment

Swagger UI 5.33.1 assets are vendored in `public/api/docs/`; license included.
`docs/api/openapi.yaml` is the source; synchronize `public/api/docs/openapi.yaml` when updating it.
Try it out is disabled (`supportedSubmitMethods: []`), authorization persistence is disabled, and external validator calls are disabled.

Production Caddy site requires this rewrite before php_fastcgi/file_server:

```caddyfile
@swagger path /api/docs /api/docs/
rewrite @swagger /api/docs/index.html
```

This rule is already configured in the live server's `/etc/caddy/Caddyfile`; server configuration itself is not tracked in the application repository. Validate with `caddy validate --config /etc/caddy/Caddyfile` before reload. Ensure public documentation assets are readable by the web server. Verify `/api/docs/`, `/api/docs/openapi.yaml`, and all 10 operations in a browser after deployment.
