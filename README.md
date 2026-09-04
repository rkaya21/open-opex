# open-opex

Open-source, self-hosted platform for **Operational Excellence**: process
management, KPIs, continuous improvement, and audits — manufacturing-first.

Everything connects to **actions and KPIs**: an audit finding creates an
action, a suggestion becomes an improvement project, a project targets a KPI,
and the KPI chart shows the impact.

## Modules (MVP)

- **Process management** — hierarchical processes, owners, SIPOC, versioning
- **KPI & dashboards** — targets, measurements, trends, OEE/FTQ/scrap templates
- **Continuous improvement** — suggestion flow, PDCA projects, KPI impact
- **Audits & actions** — 5S-ready checklists, findings, shared CAPA action pool

## Stack

Django 5 + DRF + django-tenants (PostgreSQL schema-per-tenant) · Next.js +
TypeScript + Tailwind · Celery + Redis · Docker Compose.


## Quick start (development)

```bash
docker compose up --build
```

Then bootstrap your first tenant:

```bash
docker compose exec backend python manage.py bootstrap_tenant \
  --schema=acme --name="Acme Manufacturing" --domain=acme.localhost \
  --admin-email=admin@acme.com --admin-password=change-me
```

- API: http://acme.localhost:8000/api/v1/ (OpenAPI docs at `/api/docs/`) —
  the tenant is resolved from the hostname, so use the tenant's domain
- Frontend: http://localhost:3000

If a default port is taken on your machine, override it:

```bash
BACKEND_PORT=8001 FRONTEND_PORT=3001 docker compose up
```

## Production deployment

```bash
cp .env.example .env   # fill in SECRET_KEY, POSTGRES_PASSWORD, ALLOWED_HOSTS…
docker compose -f docker-compose.prod.yml up -d --build
```

This runs gunicorn with `DEBUG=0` behind an nginx reverse proxy (port 80) that
also serves static files and uploaded media; the Next.js frontend is a
standalone production build making same-origin API calls. Put TLS termination
(caddy, certbot, a load balancer) in front of nginx. Bootstrap tenants with
the same `bootstrap_tenant` command via
`docker compose -f docker-compose.prod.yml exec backend …`.

## License

Apache-2.0
