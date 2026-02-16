#!/usr/bin/env tsx
/**
 * Snapshot CLI
 * Create/load/list DB snapshots for stable demos.
 *
 * Usage:
 *   npx tsx backend/src/scripts/snapshot.ts create [name]
 *   npx tsx backend/src/scripts/snapshot.ts load [name-or-file]
 *   npx tsx backend/src/scripts/snapshot.ts list
 */

import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const snapshotDir = path.resolve(__dirname, '../../snapshots');

const SNAPSHOT_DELEGATES = {
  members: 'member',
  committees: 'committee',
  bills: 'bill',
  votes: 'vote',
  amendments: 'amendment',
  districts: 'district',
  executiveOrders: 'executiveOrder',
  regulatoryRules: 'regulatoryRule',
  newsArticles: 'newsArticle',
  lobbyingReports: 'lobbyingReport',
  federalSpending: 'federalSpending',
  cosponsors: 'cosponsor',
  billActions: 'billAction',
  votePositions: 'votePosition',
  committeeMemberships: 'committeeMembership',
  hearings: 'hearing',
  campaignContributions: 'campaignContribution',
} as const;

type SnapshotTable = keyof typeof SNAPSHOT_DELEGATES;
type SnapshotRecord = Record<string, unknown>;

type SnapshotPayload = {
  meta: {
    name: string;
    createdAt: string;
    source: 'northstar';
    demoMode: boolean;
    version: string;
  };
  counts: Record<SnapshotTable, number>;
  data: Record<SnapshotTable, SnapshotRecord[]>;
};

const DELETE_ORDER: SnapshotTable[] = [
  'campaignContributions',
  'hearings',
  'committeeMemberships',
  'votePositions',
  'billActions',
  'cosponsors',
  'federalSpending',
  'newsArticles',
  'lobbyingReports',
  'regulatoryRules',
  'executiveOrders',
  'districts',
  'amendments',
  'votes',
  'bills',
  'committees',
  'members',
];

const INSERT_ORDER: SnapshotTable[] = [
  'members',
  'committees',
  'bills',
  'votes',
  'amendments',
  'districts',
  'executiveOrders',
  'regulatoryRules',
  'newsArticles',
  'lobbyingReports',
  'federalSpending',
  'cosponsors',
  'billActions',
  'votePositions',
  'committeeMemberships',
  'hearings',
  'campaignContributions',
];

async function ensureSnapshotDir(): Promise<void> {
  await fs.mkdir(snapshotDir, { recursive: true });
}

function normalizeFileName(input: string): string {
  return input.endsWith('.json') ? input : `${input}.json`;
}

function buildDefaultSnapshotName(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `demo-snapshot-${stamp}`;
}

function stripAutoId(row: SnapshotRecord): SnapshotRecord {
  const { id, ...rest } = row;
  return rest;
}

async function readTable(table: SnapshotTable): Promise<SnapshotRecord[]> {
  const delegate = SNAPSHOT_DELEGATES[table];
  const rows = await (prisma as unknown as Record<string, { findMany: () => Promise<SnapshotRecord[]> }>)[delegate].findMany();
  return rows.map(stripAutoId);
}

async function createSnapshot(nameArg?: string): Promise<void> {
  await ensureSnapshotDir();

  const name = nameArg || buildDefaultSnapshotName();
  const fileName = normalizeFileName(name);
  const absolutePath = path.join(snapshotDir, fileName);

  const data = {} as Record<SnapshotTable, SnapshotRecord[]>;
  const counts = {} as Record<SnapshotTable, number>;

  for (const table of Object.keys(SNAPSHOT_DELEGATES) as SnapshotTable[]) {
    const rows = await readTable(table);
    data[table] = rows;
    counts[table] = rows.length;
  }

  const payload: SnapshotPayload = {
    meta: {
      name,
      createdAt: new Date().toISOString(),
      source: 'northstar',
      demoMode: process.env.DEMO_MODE === 'true',
      version: process.env.npm_package_version || '0.1.0',
    },
    counts,
    data,
  };

  await fs.writeFile(absolutePath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`Snapshot created: ${absolutePath}`);
  console.log(`Tables exported: ${Object.keys(SNAPSHOT_DELEGATES).length}`);
}

async function listSnapshots(): Promise<void> {
  await ensureSnapshotDir();

  const files = await fs.readdir(snapshotDir);
  const jsonFiles = files.filter((f) => f.endsWith('.json')).sort();

  if (jsonFiles.length === 0) {
    console.log(`No snapshots found in ${snapshotDir}`);
    return;
  }

  console.log(`Snapshots in ${snapshotDir}:`);
  for (const file of jsonFiles) {
    console.log(`- ${file}`);
  }
}

async function resolveSnapshotPath(nameOrFile?: string): Promise<string> {
  await ensureSnapshotDir();

  if (nameOrFile) {
    const directPath = nameOrFile.endsWith('.json') ? nameOrFile : normalizeFileName(nameOrFile);
    const maybeAbsolute = path.isAbsolute(directPath) ? directPath : path.join(snapshotDir, directPath);
    return maybeAbsolute;
  }

  const files = (await fs.readdir(snapshotDir))
    .filter((f) => f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No snapshots found in ${snapshotDir}`);
  }

  return path.join(snapshotDir, files[files.length - 1]);
}

async function loadSnapshot(nameOrFile?: string): Promise<void> {
  const snapshotPath = await resolveSnapshotPath(nameOrFile);
  const content = await fs.readFile(snapshotPath, 'utf8');
  const payload = JSON.parse(content) as SnapshotPayload;

  await prisma.$transaction(async (tx) => {
    for (const table of DELETE_ORDER) {
      const delegate = SNAPSHOT_DELEGATES[table];
      await (tx as unknown as Record<string, { deleteMany: () => Promise<unknown> }>)[delegate].deleteMany();
    }

    for (const table of INSERT_ORDER) {
      const rows = payload.data[table] || [];
      if (rows.length === 0) continue;

      const delegate = SNAPSHOT_DELEGATES[table];
      await (tx as unknown as Record<string, { createMany: (args: { data: SnapshotRecord[]; skipDuplicates: boolean }) => Promise<unknown> }>)[delegate]
        .createMany({ data: rows, skipDuplicates: true });
    }
  });

  console.log(`Snapshot loaded: ${snapshotPath}`);
  console.log(`Snapshot timestamp: ${payload.meta.createdAt}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  const value = args[1];

  try {
    if (command === 'create') {
      await createSnapshot(value);
    } else if (command === 'load') {
      await loadSnapshot(value);
    } else if (command === 'list') {
      await listSnapshots();
    } else {
      console.error(`Unknown command: ${command}`);
      console.log('Commands: create [name], load [name-or-file], list');
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Snapshot command failed:', error);
  process.exit(1);
});
