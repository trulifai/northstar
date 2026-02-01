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

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'full';

  console.log('════════════════════════════════════════════════════════');
  console.log('  Northstar Database Sync');
  console.log('════════════════════════════════════════════════════════\n');

  const syncService = new SyncService();

  try {
    switch (command) {
      case 'full':
        console.log('Running FULL SYNC...\n');
        await syncService.syncAll();
        break;

      case 'recent':
      case 'incremental':
        console.log('Running INCREMENTAL SYNC...\n');
        await syncService.syncRecent();
        break;

      case 'bills':
        console.log('Syncing BILLS only...\n');
        await syncService.syncBills();
        break;

      case 'members':
        console.log('Syncing MEMBERS only...\n');
        await syncService.syncMembers();
        break;

      case 'committees':
        console.log('Syncing COMMITTEES only...\n');
        await syncService.syncCommittees();
        break;

      case 'votes':
        console.log('Syncing VOTES only...\n');
        await syncService.syncVotes();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log('\nAvailable commands:');
        console.log('  full         - Full sync of all data');
        console.log('  recent       - Incremental sync (recent changes)');
        console.log('  bills        - Sync bills only');
        console.log('  members      - Sync members only');
        console.log('  committees   - Sync committees only');
        console.log('  votes        - Sync votes only');
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
