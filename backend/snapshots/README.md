# Demo Snapshots

This folder stores frozen JSON snapshots used for demo mode.

## Commands

From repo root:

```bash
npx tsx backend/src/scripts/snapshot.ts create demo-default
npx tsx backend/src/scripts/snapshot.ts list
npx tsx backend/src/scripts/snapshot.ts load demo-default
```

## Notes

- Snapshots are loaded into PostgreSQL tables.
- Sync endpoints are blocked when `DEMO_MODE=true`.
- Provider kill-switch flags live in `.env.example`.
