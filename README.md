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

## License

Apache-2.0
