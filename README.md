# NVD Vulnerability Dashboard

A dashboard analyzing the real CVE threat landscape — severity trends, top affected
vendors/products, weakness-type (CWE) distribution, a patch-time approximation,
and a Prophet-based quarterly forecast of critical vulnerabilities. Built on
~235K real CVE records from the [NVD CVE API 2.0](https://nvd.nist.gov/developers/vulnerabilities)
(2019 → present).

Bilingual (EN/ES). Every approximation the dashboard makes is stated explicitly
on the **Methodology** page — see [Methodology & data caveats](#methodology--data-caveats)
below for the short version.

## Stack

- **Backend**: FastAPI + plain `sqlite3` (no ORM) — five simple tables, read-only at request time
- **Ingestion**: standalone Python CLI scripts (`backend/ingestion/`) — never run inside the deployed web service, so the NVD API key never touches it
- **Forecasting**: Facebook Prophet, computed as part of ingestion and stored in `forecast_results` — no ML dependency in the request path
- **Frontend**: React + Vite + TypeScript, Tailwind + shadcn/ui, Recharts, TanStack Query, `motion` for micro-animations
- **Deployment**: self-hosted on a homelab via Docker Compose, exposed through an existing Cloudflare Tunnel (no port forwarding)

## Repo layout

```
backend/
  app/            FastAPI app: routers, Pydantic schemas, SQL queries
  ingestion/       backfill.py, incremental.py, forecasting.py, parsers
  tests/            pytest suite (parsers, schema, forecasting — no live API needed)
frontend/
  src/
    api/, hooks/     typed fetch client + TanStack Query hooks
    components/       charts (Recharts) + shadcn/ui pieces
    pages/             Dashboard, Methodology
    i18n/               EN/ES translation dictionary + context
data/                 local nvd.sqlite lives here (gitignored)
deploy/                systemd timer units + Cloudflare Tunnel routing notes
scripts/                 backfill wrapper, weekly refresh cron wrapper
docker-compose.yml
```

## Local development

**Backend:**
```powershell
cd backend
py -3.13 -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy ..\.env.example ..\.env   # fill in NVD_API_KEY
.venv\Scripts\python -m ingestion.backfill      # one-time historical load, ~20-30 min
.venv\Scripts\python -m ingestion.forecasting   # computes the Prophet forecast
.venv\Scripts\python -m uvicorn app.main:app --port 8000
```

**Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

Runs against `http://localhost:8000` by default (see `frontend/.env.local` /
`VITE_API_BASE_URL` to point elsewhere).

**Tests:**
```powershell
cd backend
.venv\Scripts\pytest tests/ -v
```

## Deploying to the homelab

1. **Build the initial database once**, locally or on the homelab host directly (needs `NVD_API_KEY`):
   ```powershell
   pwsh scripts/build_initial_db.ps1
   ```
   This populates `data/nvd.sqlite` with the full 2019→present backfill and computes the initial forecast.

2. **Start the stack**:
   ```bash
   docker compose up -d --build
   ```
   `data/` is bind-mounted into the backend container, so the database persists across rebuilds/restarts — no ephemeral-disk workarounds needed.

3. **Route two hostnames through the existing Cloudflare Tunnel** — see [`deploy/cloudflared-notes.md`](deploy/cloudflared-notes.md):
   - `nvd-api.apisis.net` → backend (`localhost:8000`)
   - `vulns.apisis.net` → frontend (`localhost:8080`)

4. **Enable the weekly data refresh** (systemd timer running `scripts/refresh_cron.sh`, which runs the incremental ingestion + forecast recompute inside the already-running backend container):
   ```bash
   sudo cp deploy/systemd/nvd-refresh.* /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now nvd-refresh.timer
   ```

`NVD_API_KEY` only ever lives in `.env` on the homelab host and inside the backend container — it's never bundled into the frontend build or exposed over the tunnel.

## Methodology & data caveats

Full detail lives on the dashboard's own **Methodology** page (`/methodology`),
which mirrors the same caveat strings the API returns. Summary:

- **CVSS normalization**: prefers v3.1 → v3.0 → v4.0 → v2 when a CVE carries multiple scores; "critical" for the forecast means CVSS v3.x/v4.0 CRITICAL specifically (v2 has no CRITICAL band).
- **Vendor/product**: parsed from CPE 2.3 match strings, not a clean NVD field — very recently published CVEs are often under-counted here until NVD's own analysts enrich them.
- **Patch time**: NVD has no "patch released" field. Approximated as days between publication and last modification, restricted to CVEs with a `Patch`/`Vendor Advisory` reference — skews high for old, revisited CVEs. A more rigorous version would use NVD's Change History API; noted as future work, not implemented.
- **Forecast**: Prophet, fit on quarterly CVSS CRITICAL counts, recomputed by the ingestion pipeline (never per-request). Confidence intervals widen with horizon; treat as directional, not precise. CVE volume reflects disclosure/reporting practices as much as real-world incidence.

## Known limitations / future work

- Patch-time metric is a proxy, not a verified patch date (see above).
- No persistent-disk redundancy beyond the homelab's own backups — `data/nvd.sqlite` is the single source of truth.
- Bundle size warning on the frontend build (~850KB uncompressed) — not code-split; acceptable at this scope but a candidate for `dynamic import()` later.
