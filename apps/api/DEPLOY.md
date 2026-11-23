# Deploy the API to Render (free plan)

The API runs as a Docker image. `apps/api/Dockerfile` builds it, and
`render.yaml` at the repository root is the Render Blueprint.

## Free plan limits

- Render stops the service after 15 minutes with no requests. The next
  request starts it again, and that start takes about one minute.
- You get 750 free hours each month. One service that runs all month
  uses about 744 hours.
- The free plan has no persistent disk. The API keeps files in R2, so
  this is not a problem.

To prevent the one-minute start, create a free job on cron-job.org.
Set it to call `https://<your service>.onrender.com/api/v1/health`
every 14 minutes.

## Before you start

Get these values first. The API does not start in production without
`DATABASE_URL` and the SMTP values.

| Variable | Value |
|---|---|
| `DATABASE_URL` | The Neon connection string from `apps/api/.env`. Keep `?sslmode=require` at the end. |
| `SMTP_USER` | Your Brevo SMTP login. |
| `SMTP_PASS` | Your Brevo SMTP key. |
| `EMAIL_FROM` | `ReelPal <your verified sender address>` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL` | Cloudflare R2. Without them, video upload does not work. |

`render.yaml` sets the other values. Render generates `JWT_SECRET` and
sets `PORT`.

Do not set `PAYMOB_API_KEY` for the V1 launch. The launch uses manual
payments. If you set `PAYMOB_API_KEY` later, you must also set
`PAYMOB_HMAC_SECRET`, `PAYMOB_INTEGRATION_ID`, and `PAYMOB_IFRAME_ID`.

## Steps

1. Sign in to Render with GitHub.
2. Select New, then Blueprint.
3. Select the `UGCX` repository.
4. Render reads `render.yaml` and shows the `reelpal-api` service.
5. Type the values from the table.
6. Select Apply.
7. Open `https://<your service>.onrender.com/api/v1/health`. The response must be `{"status":"ok","database":"connected"}`.
8. In the web app on Vercel, set `NEXT_PUBLIC_API_URL` to `https://<your service>.onrender.com/api/v1`.

## What happens on each deploy

1. Render builds the image from the `launch-v1` branch.
2. The container applies new migrations: `migration:run --transaction each`.
3. The container starts the API, and Render waits for `/api/v1/health`.

If a migration fails, the container stops before the API starts. The
health check fails, and Render keeps the old version.

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
