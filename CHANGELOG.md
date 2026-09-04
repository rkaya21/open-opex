# Changelog

## v0.2.0 — hardening & user management

- **Production deployment**: `docker-compose.prod.yml` + nginx reverse proxy
  (gunicorn with `DEBUG=0`, static/media served by nginx, Next.js standalone
  build with same-origin API calls), `.env.example`, README deployment guide.
- **Security**: startup guard against default `SECRET_KEY` in production,
  secure cookies + proxy SSL header, `CSRF_TRUSTED_ORIGINS`, anonymous rate
  limiting (30/min) on unauthenticated endpoints.
- **User management**: admin-only API + UI to invite users, change roles,
  reset passwords and deactivate accounts — with a self-lockout guard.
- **Email alerts**: warning-level notifications (KPI off target, overdue
  actions) are emailed when SMTP is configured.

## v0.1.0 — first public release

Open-source, self-hosted Operational Excellence platform. Multi-tenant
(PostgreSQL schema-per-tenant), Django 5 + DRF backend, Next.js 15 frontend,
Celery workers — all wired together with `docker compose up`.

### Modules

- **Process management** — hierarchical process map, SIPOC definitions,
  owners, publish/archive lifecycle with versioning.
- **KPI & dashboards** — targets with tolerance bands (red/yellow/green),
  idempotent bulk measurement ingest, trend charts, 11 built-in OPEX
  templates (OEE, FTQ, scrap, lead time, …), CSV export.
- **Continuous improvement** — suggestion flow (submit → evaluate →
  implement), PDCA improvement projects with A3 problem-solving format,
  implemented-suggestion counts auto-feed their KPI.
- **Audits & actions** — areas ("5S sahaları") with discipline score
  tracking, built-in 5S question set, 0–5 scored audits, photo findings
  (tenant-segregated media), shared CAPA action pool, CSV export.
- **My Work** — personal inbox of everything pending on the signed-in user.
- **Notifications & smart alerts** — in-app notifications with unread badge;
  daily rule-based sweeps: KPI off target, sharp KPI deterioration
  (direction-aware), action due-soon/overdue reminders — all deduplicated.

### Platform

- JWT auth (RS256-capable for future services), RBAC (admin / manager /
  member), tenant bootstrap and demo-seed commands.
- Turkish + English UI, print-friendly report views (browser print → PDF).
- CI: ruff + pytest (real PostgreSQL) and ESLint + build on every push.
