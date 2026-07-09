# Cloudflare Tunnel routing (reference only — no secrets here)

This project reuses the Cloudflare Tunnel already running on the homelab for
`api.apisis.net`. No new tunnel is created — just two new hostnames routed to
the containers started by `docker-compose.yml`.

## Hostnames to add

| Hostname | Routes to |
|---|---|
| `nvd-api.apisis.net` | `http://localhost:8000` (backend container) |
| `vulns.apisis.net` | `http://localhost:8080` (frontend container) — confirm/rename this subdomain before going live |

## If routing via the `cloudflared` config file

Add two entries under `ingress:` in the tunnel's `config.yml` (above the
catch-all `service: http_status:404` rule), then `cloudflared tunnel route dns
<TUNNEL-NAME> nvd-api.apisis.net` and the same for `vulns.apisis.net`:

```yaml
ingress:
  - hostname: nvd-api.apisis.net
    service: http://localhost:8000
  - hostname: vulns.apisis.net
    service: http://localhost:8080
  # ...existing rules (e.g. api.apisis.net)...
  - service: http_status:404
```

Restart/reload `cloudflared` after editing.

## If routing via the Cloudflare Zero Trust dashboard

Zero Trust → Networks → Tunnels → (existing tunnel) → Public Hostname → Add a
public hostname, once for each of the two hostnames above, pointing at the
matching `localhost:<port>` service on the homelab host.

## Notes

- Both containers only need to be reachable on `localhost` from the host
  running `cloudflared` — no port forwarding on the router, matching how
  `api.apisis.net` already works.
- CORS on the backend (`CORS_ORIGINS` in `.env`) must include
  `https://vulns.apisis.net` or the frontend's fetches will be blocked by the
  browser even though the tunnel routes correctly.
