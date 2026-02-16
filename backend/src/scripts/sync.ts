#!/usr/bin/env tsx
/**
 * Database Sync CLI
 * Run manual or scheduled syncs of Congressional data
 * 
 * Usage:
 *   npm run sync          - Full sync
 *   npm run sync:recent   - Incremental sync (recent changes only)
 */

import { SyncService } from '../services/sync.service';

function readIntFlag(
  args: string[],
  name: string,
  envValue: string | undefined,
  fallback: number
): number {
  const fromArg = args.find((arg) => arg.startsWith(`--${name}=`));
  const raw = (fromArg ? fromArg.split('=')[1] : envValue) ?? '';
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readStringFlag(
  args: string[],
  name: string,
  envValue: string | undefined
): string | undefined {
  const fromArg = args.find((arg) => arg.startsWith(`--${name}=`));
  const value = fromArg ? fromArg.split('=').slice(1).join('=') : envValue;
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(`--${name}`);
}

function computeCurrentCongress(): number {
  const currentYear = new Date().getFullYear();
  return Math.floor((currentYear - 1789) / 2) + 1;
}

function printUsage(): void {
  console.log('\nAvailable commands:');
  console.log('  full         - Full sync of all data');
  console.log('  recent       - Incremental sync (recent changes)');
  console.log('  bills        - Sync bills only');
  console.log('  members      - Sync members only');
  console.log('  committees   - Sync committees only');
  console.log('  votes        - Sync votes only');
  console.log('\nCommon flags for sync jobs:');
  console.log('  --congress=119');
  console.log('  --delay-ms=750');
  console.log('  --from-date=2026-02-15');
  console.log('  --dry-run');
  console.log('\nIncremental-only flags:');
  console.log('  --bills-max=300');
  console.log('  --house-votes-max=80');
  console.log('  --senate-votes-max=0');
  console.log('  --bill-details-batch=20');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'full';
  const extraArgs = args.slice(1);
  const dryRun = hasFlag(extraArgs, 'dry-run');

  const congress = readIntFlag(
    extraArgs,
    'congress',
    process.env.SYNC_CONGRESS,
    computeCurrentCongress()
  );
  const delayMs = readIntFlag(extraArgs, 'delay-ms', process.env.SYNC_DELAY_MS, 750);
  const fromDate = readStringFlag(extraArgs, 'from-date', process.env.SYNC_FROM_DATE);

  const recentProfile = {
    congress,
    delayMs,
    fromDateTime: fromDate,
    billsMaxItems: readIntFlag(extraArgs, 'bills-max', process.env.SYNC_BILLS_MAX_ITEMS, 300),
    houseVotesMaxItems: readIntFlag(extraArgs, 'house-votes-max', process.env.SYNC_HOUSE_VOTES_MAX_ITEMS, 80),
    senateVotesMaxItems: readIntFlag(extraArgs, 'senate-votes-max', process.env.SYNC_SENATE_VOTES_MAX_ITEMS, 0),
    billDetailsBatchSize: readIntFlag(extraArgs, 'bill-details-batch', process.env.SYNC_BILL_DETAILS_BATCH_SIZE, 20),
  };

  const baseOptions = {
    congress,
    delayMs,
    fromDateTime: fromDate,
  };

  console.log('════════════════════════════════════════════════════════');
  console.log('  Northstar Database Sync');
  console.log('════════════════════════════════════════════════════════\n');

  console.log('Runtime profile:');
  console.log(JSON.stringify({
    command,
    dryRun,
    baseOptions,
    recentProfile,
  }, null, 2));
  console.log('');

  if (dryRun) {
    console.log('Dry run complete. No sync calls were executed.\n');
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required for sync commands. Set a Postgres connection string and retry.');
    process.exit(1);
  }

  const syncService = new SyncService();

  try {
    switch (command) {
      case 'full':
        console.log('Running FULL SYNC...\n');
        await syncService.syncAll(baseOptions);
        break;

      case 'recent':
      case 'incremental':
        console.log('Running INCREMENTAL SYNC...\n');
        await syncService.syncRecent(recentProfile);
        break;

      case 'bills':
        console.log('Syncing BILLS only...\n');
        await syncService.syncBills(baseOptions);
        break;

      case 'members':
        console.log('Syncing MEMBERS only...\n');
        await syncService.syncMembers(baseOptions);
        break;

      case 'committees':
        console.log('Syncing COMMITTEES only...\n');
        await syncService.syncCommittees(baseOptions);
        break;

      case 'votes':
        console.log('Syncing VOTES only...\n');
        await syncService.syncVotes(baseOptions);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }

    console.log('\n════════════════════════════════════════════════════════');
    console.log('  Sync completed successfully! 🎉');
    console.log('════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Sync failed with error:', error);
    process.exit(1);
  } finally {
    await syncService.close();
  }
}

main();
