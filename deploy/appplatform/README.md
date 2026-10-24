# LedgerHound on AppPlatform (40.160.88.230)

Target: move `www.ledgerhound.vip` from Vercel to the AppPlatform production host
(`deploy@40.160.88.230`, OVH) as two containers on the existing shared Caddy:

| Container | Image | Networks | Role |
|---|---|---|---|
| `ledgerhound-web` | `ledgerhound-web:<sha>` | `appplatform_prod_public` (Caddy), `ledgerhound_internal` | Next.js standalone server |
| `ledgerhound-cron` | same image | `ledgerhound_internal` only (no egress) | Replaces Vercel Cron, runs the webhook recovery sweep |

Nothing else on the host changes except one additive Caddy site block.
External services stay external: AWS S3 (eu-central-1, KMS), Stripe, the
selected email transport (Resend or MailHub),
Upstash, Cloudflare Turnstile, blockchain APIs, DeepSeek/Tavily, GitHub, GA4.
This moves hosting only; it is not "fully self-hosted".

## Release order (what Vercel must be running)

1. **Security release** (`merge/security-hardening`) goes to `main` first and
   Vercel deploys it. It contains no job queue: it keeps Vercel's `waitUntil`
   behaviour and does not know `webhook-jobs/` or `/api/admin/resume-webhook-jobs`.
   It is therefore **not** a rollback target once the server has taken traffic.
2. **Migration commit** (`feature/self-host-appplatform`) is merged to `main`
   before cutover, so Vercel deploys the *same commit* the server runs. On
   Vercel that build behaves as before (no standalone output, no
   instrumentation hook, Vercel Cron for the two jobs) but it writes and
   understands the job queue and serves `/api/admin/resume-webhook-jobs`.
   Note this Vercel deployment's URL as the rollback target.
3. Deploy that commit to the server, run the shadow checks, then cut DNS.

Only after step 2 is a DNS rollback safe: both origins run identical code over
the same S3 state.

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

Until LedgerHound is first deployed on OVH, its production MailHub key is staged
outside the application tree at `/opt/mailhub/secrets/ledgerhound-prod.key`
(`root:root`, `0600`). During the first deployment, copy that value into
`/opt/ledgerhound/secrets/ledgerhound.env` as `MAILHUB_API_KEY` without printing
it, preserve `EMAIL_TRANSPORT=resend`, and verify the new file is `root:root`
`0600`. Remove the staged copy only after the deployed backend can authenticate
to MailHub and the application secret file has been backed up through the normal
server-secret procedure.

### Email transport

`EMAIL_TRANSPORT` is `resend` by default, so deploying this code does not
switch delivery providers. Supported values are `resend`, `mailhub`, and
`log`; `log` is development/test-only and makes production health fail.
MailHub uses `MAILHUB_API_URL`, `MAILHUB_API_KEY`, and
`MAILHUB_TIMEOUT_MS`; the key remains server-only in `ledgerhound.env`.

There is no automatic MailHub-to-Resend fallback. A timeout can happen after
MailHub accepted a message, so a fallback could create a duplicate. Reports
and Emergency Packs freeze the selected transport with their payload; later
retries keep using that provider even if the environment setting changes.
Legacy frozen records without a transport use Resend. A MailHub 409 for an
existing idempotency key is terminal (`already-sent`). If attachments exceed
MailHub's 10 MiB limit, report emails omit them only when the exact stored
download URL is still present; otherwise the send is rejected.

Rollback to Resend changes only `EMAIL_TRANSPORT`. Keep `MAILHUB_API_KEY`
available for at least 23 hours after the switch: reports and Emergency Packs
that were frozen on MailHub remain pinned to MailHub for their remaining retry
window. Removing the key early would turn those safe retries into permanent
delivery failures.

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
- Keep the Vercel deployment from release step 2 as the rollback target during
  the observation window, but disconnect the project's Git integration so new
  commits stop deploying there (the rollback target stays as it is).
- Blog auto-publish (`/api/blog-agent/publish`) commits to GitHub; until a CI
  deploy exists, published posts go live only after a manual release here.

## Background work and recovery

Paid checkouts are recorded as `webhook-jobs/pending/<eventId>.json` **before**
the event and payment locks; failing to write it answers 500 so Stripe
redelivers. The payment lock decides who runs a job: a redelivery of an event
whose job is still pending competes for it again, so a delivery that died
between the two locks is finished by the redelivery. Generation runs in the
background, tracked for shutdown.

A purchase counts as delivered only when the customer can use it:
- forensic / summary report: PDF uploaded **and** email sent **and** the
  reports-log entry saved (the success page finds the report through it);
- Emergency Pack: every document saved **and** the email with the links sent,
  then `legal-packs/cases/<caseId>/complete.json` is written. PDFs without that
  marker are an interrupted pack and are rebuilt.

Anything short of that throws and the job is retried. Who runs an attempt is
decided by an atomic compare-and-swap on the job record (If-Match on its
ETag), used by the webhook and the sweep alike; the payment lock only records
which Stripe event owns the payment. For the Emergency Pack the forensic
report is mandatory and delivered first.

Retries never produce a different document. Before the first email the report
is frozen in `reports/<caseId>.delivery.json` (write-once PDF, its hash, the
exact email payload and the summary the pack uses); pack documents are
write-once and the pack email is frozen in `legal-packs/cases/<caseId>/manifest.json`,
written after every document is stored. A retry re-sends the identical frozen
email under the same provider-independent idempotency key. The shortest
supported retention is Resend's 24 h window, so jobs expire after 23 h into
`webhook-jobs/failed/` instead of being retried later.

`/api/emergency/status` reports `ready` only when the manifest exists (the
complete set); packs generated before manifests count as complete after 48 h.

The cron runner calls `/api/admin/resume-webhook-jobs` every 5 minutes: jobs
never started after 10 min (it takes the payment lock if nobody holds it),
running jobs stale after 15 min, failed attempts after a 10 min backoff, at
most 3 attempts. Exhausted or invalid jobs go to `webhook-jobs/failed/`,
logged at error level, for manual follow-up.

Shutdown: on `SIGTERM` the web container enters a draining state. New Stripe
webhooks and sweeps get 503 (Stripe redelivers to the next process),
`/api/health` reports `draining` (503), running reports continue for up to
`LEDGERHOUND_DRAIN_TIMEOUT_MS` (100 s; `stop_grace_period` is 120 s), then the
process exits. Pages are still served until exit; with one container a
restart is a short outage, not a zero-downtime switch.

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

Target: the Vercel deployment of the **same commit** the server runs (release
step 2). Never roll back to the security-only release: it ignores
`webhook-jobs/` and would leave interrupted purchases unprocessed.

1. In Vercel, make sure that deployment is the production one (promote it if
   needed).
2. Restore the two DNS records above to the Vercel values (TTL 300 s).
3. Queue: Vercel processes new purchases itself (`waitUntil`), but it has no
   cron for the recovery sweep (only the two `vercel.json` jobs; adding one may
   exceed the plan). Until `webhook-jobs/pending/` is empty, call the sweep by
   hand every few minutes:
   `curl -H "x-admin-key: $ADMIN_PASSWORD" https://www.ledgerhound.vip/api/admin/resume-webhook-jobs`
   Check `webhook-jobs/failed/` afterwards.
4. Server side, if only the release is bad: `up -d --no-build` with the
   previous image tag. To take the server out entirely, remove only the
   LedgerHound blocks from the shared Caddyfile (or restore the backup),
   validate, `SIGUSR1`. Do not touch other AppPlatform sites.

