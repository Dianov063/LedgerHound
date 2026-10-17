# LedgerHound on AppPlatform (40.160.88.230)

Target: move `www.ledgerhound.vip` from Vercel to the AppPlatform production host
(`deploy@40.160.88.230`, OVH) as two containers on the existing shared Caddy:

| Container | Image | Networks | Role |
|---|---|---|---|
| `ledgerhound-web` | `ledgerhound-web:<sha>` | `appplatform_prod_public` (Caddy), `ledgerhound_internal` | Next.js standalone server |
| `ledgerhound-cron` | same image | `ledgerhound_internal` only (no egress) | Replaces Vercel Cron, runs the webhook recovery sweep |

Nothing else on the host changes except one additive Caddy site block.
External services stay external: AWS S3 (eu-central-1, KMS), Stripe, Resend,
Upstash, Cloudflare Turnstile, blockchain APIs, DeepSeek/Tavily, GitHub, GA4.
This moves hosting only; it is not "fully self-hosted".

## Layout on the host

```
/opt/ledgerhound/
  releases/<sha>/         source snapshot (git archive of the deployed commit)
  current -> releases/<sha>
  secrets/ledgerhound.env root:root 0600, from ledgerhound.env.example
  secrets/cron.env        root:root 0600, CRON_SECRET only
```

Secrets come from Vercel → Settings → Environment Variables (Production), copied
by name per `ledgerhound.env.example`. Never copy `VERCEL_*`, `TURBO_*`, `NX_*`
or `VERCEL_OIDC_TOKEN`. Never print or commit the files.

## Build and start a release

```sh
SHA=<short sha>
# from a workstation: ship the exact commit, no .env files
git archive --format=tar "$SHA" | ssh deploy@40.160.88.230 "sudo mkdir -p /opt/ledgerhound/releases/$SHA && sudo tar -x -C /opt/ledgerhound/releases/$SHA"

# on the host
cd /opt/ledgerhound/releases/$SHA
sudo env LEDGERHOUND_IMAGE_TAG=$SHA docker compose -f deploy/appplatform/compose.yml build web
sudo env LEDGERHOUND_IMAGE_TAG=$SHA docker compose -f deploy/appplatform/compose.yml up -d --no-build
sudo docker inspect -f '{{.State.Health.Status}}' ledgerhound-web   # healthy
sudo ln -sfn /opt/ledgerhound/releases/$SHA /opt/ledgerhound/current
```

The image needs no secrets to build (sitemap and S3-backed pages render at
request time). `next/font` downloads Inter/Manrope during the build, so the
build needs outbound HTTPS; runtime does not depend on Google Fonts.

## Shared Caddy

The shared Caddyfile is `/opt/app-platform-prod/shared/caddy/Caddyfile`.
Back it up, append `deploy/appplatform/Caddyfile.ledgerhound`, validate, reload:

```sh
sudo cp /opt/app-platform-prod/shared/caddy/Caddyfile /opt/app-platform-prod/shared/caddy/Caddyfile.bak-ledgerhound-$(date +%Y%m%d)
sudo sh -c 'cat deploy/appplatform/Caddyfile.ledgerhound >> /opt/app-platform-prod/shared/caddy/Caddyfile'
sudo docker exec appplatform_prod-caddy-1 caddy validate --config /etc/caddy/Caddyfile
sudo docker kill --signal=USR1 appplatform_prod-caddy-1
```

Certificates for `www.ledgerhound.vip` / `ledgerhound.vip` can only be issued
after DNS points here, so before cutover test the origin over the private
network or with an HTTP-only temporary block.

## Before DNS: shadow checks

- `sudo docker exec appplatform_prod-caddy-1 wget -qO- http://ledgerhound-web:3000/api/health` → `{"status":"ok",…}`
- All locales, `/emergency`, `/payment-scam-report`, `/scam-database`, `/sitemap.xml`
- `POST /api/emergency/generate-pack` and `POST /api/blog-agent` without key → 401
- `GET /api/emergency/status?case_id=…` without a paid session → 403
- One Stripe **test-mode** checkout through a test webhook endpoint pointing at
  the origin; confirm the report arrives and survives `docker restart ledgerhound-web`
- `docker logs ledgerhound-cron` shows the three jobs scheduled

## DNS cutover (Dynadot, TTL already 300 s)

Change only these two records; keep MX `webhost.dynadot.com`, the SPF TXT and
the Google/Yandex verification TXT records untouched.

| Name | Before (rollback values) | After |
|---|---|---|
| `ledgerhound.vip` | `A 216.198.79.1` (Vercel) | `A 40.160.88.230` |
| `www.ledgerhound.vip` | `CNAME cname.vercel-dns.com` | `A 40.160.88.230` |

Do not add `AAAA` unless IPv6 works end to end. The Stripe webhook URL
(`https://www.ledgerhound.vip/api/webhook`) and Turnstile hostnames do not change.
While resolvers converge both origins receive traffic; both use the same S3
idempotency locks, so a payment is processed once regardless of which origin
Stripe reaches.

## After cutover

- Verify certificates, `/api/health`, a test checkout, cron logs.
- Keep the Vercel project as rollback during the observation window, but
  disconnect its Git integration so commits stop deploying there.
- Blog auto-publish (`/api/blog-agent/publish`) commits to GitHub; until a CI
  deploy exists, published posts go live only after a manual release here.

## Background work and recovery

Paid checkouts are recorded as `webhook-jobs/pending/<eventId>.json` before the
idempotency locks, then generated in the background. On `SIGTERM` the web
container waits up to `LEDGERHOUND_DRAIN_TIMEOUT_MS` (100 s; `stop_grace_period`
is 120 s) for running reports. Anything interrupted is resumed by the cron
runner every 5 minutes (`/api/admin/resume-webhook-jobs`): stale running jobs
after 15 min, failed attempts after a 10 min backoff, at most 3 attempts.
Jobs that cannot succeed or run out of attempts are parked in
`webhook-jobs/failed/` and logged at error level; they need manual follow-up.

## Operations

```sh
sudo docker logs --tail 200 ledgerhound-web
sudo docker logs --tail 50 ledgerhound-cron
sudo docker restart ledgerhound-web              # in-flight reports drain first
sudo docker inspect -f '{{.Config.Image}}' ledgerhound-web   # deployed version
```

Resources (measured 2026-10-17): idle ~60 MiB, page load ~120 MiB, one large
report render +70 MiB, three concurrent +227 MiB. Limits: web 1 GiB / 1.5 CPU,
heap cap 768 MiB; cron 96 MiB / 0.1 CPU.

## Rollback

1. Restore the two DNS records above to the Vercel values (TTL 300 s).
2. If only the release is bad: `up -d --no-build` with the previous tag.
3. Remove only the LedgerHound blocks from the Caddyfile (or restore the
   backup), validate, `SIGUSR1`. Do not touch other AppPlatform sites.
4. Keep `webhook-jobs/` in S3. Vercel has no cron for the recovery sweep, so
   after a rollback check `webhook-jobs/pending/` and, if needed, call
   `GET /api/admin/resume-webhook-jobs` with the admin key (the route exists
   on Vercel too).
