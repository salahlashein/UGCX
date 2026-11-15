# Deploy the API to Railway

The API runs as a Docker image. `apps/api/Dockerfile` builds it, and
`railway.json` at the repository root configures Railway.

## Before you start

Get these values first. The API does not start in production without them.

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | The Neon connection string. Keep `?sslmode=require` at the end. |
| `JWT_SECRET` | 64 random characters. Run `openssl rand -hex 32`. The API refuses a secret shorter than 32 characters. |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Brevo SMTP login. |
| `SMTP_PASS` | Your Brevo SMTP key. |
| `EMAIL_FROM` | `ReelPal <your verified sender address>` |
| `CORS_ORIGINS` | `https://reelpal.vercel.app` (comma-separated if you add more) |
| `PLATFORM_FEE_RATE` | `0.10` |
| `CAMPAIGN_DEFAULT_OPEN_DAYS` | `14` |
| `REPORTING_TIME_ZONE` | `Africa/Cairo` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL` | From Cloudflare R2. Without them, video upload does not work. |

Do not set `PORT`. Railway sets it.

Do not set `PAYMOB_API_KEY` for the V1 launch. The launch uses manual
payments. If you set `PAYMOB_API_KEY` later, you must also set
`PAYMOB_HMAC_SECRET`, `PAYMOB_INTEGRATION_ID`, and `PAYMOB_IFRAME_ID`.

## Steps

1. In Railway, create a project from the GitHub repository.
2. Select the `launch-v1` branch.
3. Leave the root directory empty. Railway reads `railway.json` and builds `apps/api/Dockerfile`.
4. Add the variables from the table.
5. Deploy.
6. In Settings, generate a public domain.
7. Open `https://<your domain>/api/v1/health`. The response must be `{"status":"ok","database":"connected"}`.

## What happens on each deploy

1. Railway builds the image.
2. Railway runs the pre-deploy command. This command applies new migrations: `migration:run --transaction each`.
3. Railway starts the API and waits for `/api/v1/health`.

If a migration fails, Railway stops the deploy. The old version keeps running.

## Why `--transaction each`

Some migrations add an enum value, and a later migration uses that value.
PostgreSQL does not let a transaction use an enum value that the same
transaction added. With one transaction for all migrations, the first
deploy to an empty database fails. With one transaction for each
migration, it succeeds.

## Test the image on your computer

```bash
docker build -f apps/api/Dockerfile -t reelpal-api .
```
