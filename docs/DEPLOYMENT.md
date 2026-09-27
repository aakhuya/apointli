# Deployment Guide

Apointli is deployed as a three-tier app:

| Component | Host | URL |
|-----------|------|-----|
| Frontend (Next.js) | Vercel | https://apointli.vercel.app |
| Backend API (FastAPI) | Render | https://apointli-api.onrender.com |
| Celery Worker | Render Background Worker | (internal) |
| Celery Beat | Render Background Worker | (internal) |
| PostgreSQL | Render (or Neon) | (internal) |
| Redis | Render (or Upstash) | (internal) |

## Production Environment Variables

### Backend (Render)

| Variable | Source | Notes |
|----------|--------|-------|
| `ENVIRONMENT` | Static | `production` |
| `DEBUG` | Static | `false` |
| `SECRET_KEY` | Auto-generated | Render generates on deploy |
| `DATABASE_URL` | From Render Postgres | Wired via render.yaml |
| `REDIS_URL` | From Render Redis | Wired via render.yaml |
| `RESEND_API_KEY` | Manual | Set in Render dashboard |
| `EMAIL_FROM` | Manual | `apointli <hello@yourdomain.com>` |
| `CORS_ORIGINS_RAW` | Manual | Your Vercel URL |
| `APP_BASE_URL` | Manual | Your Vercel URL |

### Frontend (Vercel)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://apointli-api.onrender.com/api/v1` |

## Deployment Steps

1. Push code to GitHub (main branch)
2. Render reads `render.yaml` → provisions API, 2 workers, Postgres, Redis
3. Set `RESEND_API_KEY` and `CORS_ORIGINS_RAW` in Render dashboard
4. Copy the Render API URL
5. Import repo on Vercel → set root to `apps/web`
6. Add `NEXT_PUBLIC_API_URL` env var
7. Deploy → copy Vercel URL
8. Back to Render → set `CORS_ORIGINS_RAW` to the Vercel URL
9. Trigger a redeploy of the API
10. Test end-to-end

## Post-Deploy Checks

- [ ] `curl https://apointli-api.onrender.com/api/v1/health` → 200
- [ ] Visit Vercel URL → landing page loads
- [ ] Sign up → email verification email received (if Resend configured)
- [ ] Create workspace → dashboard loads
- [ ] Add a service, staff, schedule
- [ ] Book an appointment via public page
- [ ] Check Celery worker logs for email task
