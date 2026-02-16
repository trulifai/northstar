# Incremental Sync Cron (Budget-Safe)

This sets up low-cost, incremental Congress.gov ingestion with explicit per-run limits.

## 1) Recommended defaults

Use these first and scale only if needed:

- `SYNC_DELAY_MS=750`
- `SYNC_BILLS_MAX_ITEMS=300`
- `SYNC_HOUSE_VOTES_MAX_ITEMS=80`
- `SYNC_SENATE_VOTES_MAX_ITEMS=0`
- `SYNC_BILL_DETAILS_BATCH_SIZE=20`

## 2) Validate profile before running

```bash
npm run sync:recent:dry
```

Or override on demand:

```bash
npm run sync:recent -- --congress=119 --bills-max=200 --house-votes-max=50 --delay-ms=900 --dry-run
```

## 3) Run once manually

Requires `DATABASE_URL` and `CONGRESS_GOV_API_KEY`.

```bash
npm run sync:cron
```

## 4) Deploy a Cloud Run Job (recommended for cron)

```bash
gcloud run jobs deploy northstar-sync-recent-dev \
  --project=trulifai-sakshi-dev \
  --region=us-central1 \
  --source=. \
  --tasks=1 \
  --max-retries=1 \
  --task-timeout=900s \
  --memory=1Gi \
  --cpu=1 \
  --command=npm \
  --args=run,sync:cron \
  --set-env-vars=NODE_ENV=production,NORTHSTAR_DATA_MODE=db,SYNC_CONGRESS=119,SYNC_DELAY_MS=750,SYNC_BILLS_MAX_ITEMS=300,SYNC_HOUSE_VOTES_MAX_ITEMS=80,SYNC_SENATE_VOTES_MAX_ITEMS=0,SYNC_BILL_DETAILS_BATCH_SIZE=20 \
  --set-secrets=CONGRESS_GOV_API_KEY=civicbrief-congress-api-key:latest,DATABASE_URL=northstar-postgres-url:latest
```

## 5) Create Cloud Scheduler trigger

Create a scheduler service account (once), then grant it permission to run jobs.

```bash
gcloud scheduler jobs create http northstar-sync-recent-4h \
  --project=trulifai-sakshi-dev \
  --location=us-central1 \
  --schedule="0 */4 * * *" \
  --time-zone="America/Chicago" \
  --http-method=POST \
  --uri="https://run.googleapis.com/v2/projects/trulifai-sakshi-dev/locations/us-central1/jobs/northstar-sync-recent-dev:run" \
  --oauth-service-account-email=scheduler-invoker@trulifai-sakshi-dev.iam.gserviceaccount.com \
  --oauth-token-scope="https://www.googleapis.com/auth/cloud-platform" \
  --headers=Content-Type=application/json \
  --message-body='{}'
```

## 6) Observe execution and tune slowly

- Start with 4-hour cadence.
- If runs finish quickly and quota headroom is large, reduce interval to 2 hours.
- If quota pressure appears, increase `SYNC_DELAY_MS` and lower per-run max item counts.
