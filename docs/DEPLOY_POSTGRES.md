# Production DB: self-hosted Postgres on the VPS (replaces Neon)

We moved off Neon (serverless cold-starts caused repeated "connection timeout"
500s). Production now runs Postgres **on the same Hostinger VPS** as the app,
reached over localhost. Local dev uses a Docker Postgres (see bottom).

Run everything below **on the VPS** (`ssh root@<vps>`), Ubuntu 24.04.

## 1. Install Postgres 16

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
systemctl enable --now postgresql
psql --version   # expect 16.x
```

## 2. Create the database + app role

Use a strong, unique password (generate: `openssl rand -base64 24`).

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE skillforge WITH LOGIN PASSWORD 'REPLACE_WITH_STRONG_PW';
CREATE DATABASE skillforge OWNER skillforge;
SQL
```

## 3. Keep Postgres private (never expose it)

Postgres must only listen on localhost — the app talks to it over the loopback.

```bash
# Confirm it listens on localhost only (default). In
# /etc/postgresql/16/main/postgresql.conf ensure:
#   listen_addresses = 'localhost'
sudo ss -tlnp | grep 5432        # should show 127.0.0.1:5432, NOT 0.0.0.0

# Firewall: allow only web + ssh; DB port stays closed to the world.
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 4. Point the app at it

In the app's production env (PM2 `ecosystem.config.js` env, or the systemd
`EnvironmentFile` — **not** a committed file):

```
DATABASE_URL=postgresql://skillforge:REPLACE_WITH_STRONG_PW@localhost:5432/skillforge
DATABASE_SSL=false          # loopback — no TLS needed (and none configured)
```

`DATABASE_SSL=false` is correct here: the app↔DB hop never leaves the machine.
(The `rejectUnauthorized`/`DATABASE_SSL_INSECURE` logic only applies when
`DATABASE_SSL=true`, i.e. a remote TLS Postgres.)

## 5. Create the schema

From the app directory on the VPS (`/var/www/ai-mock-interview`), with the prod
`DATABASE_URL` exported:

```bash
cd /var/www/ai-mock-interview
npm ci
DATABASE_URL="postgresql://skillforge:...@localhost:5432/skillforge" npm run db:push
```

`db:push` creates every table from `utils/schema.ts` (users, interviews,
answers, interview_summaries, generated_projects) with all enums + indexes.

## 6. Seed the admin

The first signup whose email equals `ADMIN_EMAIL` is auto-approved as admin
(see `lib/auth.ts` signUp). So just:

1. Ensure `ADMIN_EMAIL=<your email>` is in the prod env.
2. Build + start the app, open `/sign-up`, register with that email.
   → you're admin, approved, logged in.

Regular users currently land in `pending` until admin approval (Phase 1 will
switch this to email-verify + auto-approve).

## 7. (Optional) Migrate existing Neon data

Only if there's real data worth keeping (pre-launch test data can be skipped —
recreate schema fresh as above). When Neon is reachable:

```bash
# dump from Neon (roles/owners stripped so it restores cleanly)
pg_dump "postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require" \
  --no-owner --no-privileges --format=custom -f neon.dump

# restore into the VPS DB
pg_restore --no-owner --no-privileges -U skillforge -d skillforge neon.dump
```

## 8. Backups (do NOT skip — you lost Neon's managed backups)

Nightly `pg_dump` to disk, keep 7 days:

```bash
sudo mkdir -p /var/backups/skillforge
sudo tee /usr/local/bin/pg-backup.sh >/dev/null <<'SH'
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date -u +%Y%m%d-%H%M)
pg_dump -U skillforge -d skillforge --format=custom \
  -f "/var/backups/skillforge/skillforge-$STAMP.dump"
find /var/backups/skillforge -name '*.dump' -mtime +7 -delete
SH
sudo chmod +x /usr/local/bin/pg-backup.sh

# 02:30 UTC daily
echo '30 2 * * * postgres /usr/local/bin/pg-backup.sh' | sudo tee /etc/cron.d/skillforge-backup
```

Test a restore into a scratch DB once so you know the dump is good.

## 9. Restart + verify

```bash
cd /var/www/ai-mock-interview
npm run build
pm2 restart ai-mock-interview
pm2 logs ai-mock-interview --lines 20   # expect no "PostgreSQL unreachable"
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/api/health   # 200
```

---

## Local dev (already set up)

Dev uses throwaway Docker containers (data is disposable):

```bash
docker run -d --name skillforge-pg  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=skillforge -p 5434:5432 --restart unless-stopped postgres:16-alpine
docker run -d --name skillforge-redis -p 6380:6379 --restart unless-stopped redis:7-alpine
npm run db:push          # create schema
```

`.env.local` points at `localhost:5434` (Postgres) and `localhost:6380` (Redis).
Ports 5434/6380 avoid clashes with other local projects already on 5432/5433/6379.
