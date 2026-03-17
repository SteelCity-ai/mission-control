#!/usr/bin/env node
/**
 * migrate-clients.js
 * SC-CLIENT-003: Data Migration Script
 *
 * Migrates existing single-client data to multi-client system.
 *
 * Behavior:
 * - Idempotent: Running twice does not corrupt data
 * - Safe: No files are moved or deleted
 * - Reversible: Delete clients-index.json to rollback
 *
 * Usage: node scripts/migrate-clients.js [--dry-run] [--force]
 */

const fs = require('fs');
const path = require('path');

const CLIENTS_BASE = '/data/mission-control-data/clients';
const INDEX_PATH = path.join(CLIENTS_BASE, 'clients-index.json');

const isDryRun = process.argv.includes('--dry-run');
const isForce = process.argv.includes('--force');

// ── Utilities ─────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[migrate-clients] ${msg}`);
}

function warn(msg) {
  console.warn(`[migrate-clients] ⚠️  ${msg}`);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeJsonAtomic(filePath, data) {
  if (isDryRun) {
    log(`[DRY RUN] Would write: ${filePath}`);
    return;
  }
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
  log(`Written: ${filePath}`);
}

function slugToName(slug) {
  // "absolute-pest-services" → "Absolute Pest Services"
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ── Check if clients-index.json already exists ────────────────────────────────

function checkAlreadyMigrated() {
  if (fs.existsSync(INDEX_PATH)) {
    if (isForce) {
      warn('clients-index.json already exists but --force flag set. Continuing...');
      return false;
    }
    log('clients-index.json already exists. Migration already complete.');
    log('To re-run, pass --force or delete clients-index.json first.');
    return true;
  }
  return false;
}

// ── Discover existing client directories ──────────────────────────────────────

function discoverClientDirs() {
  if (!fs.existsSync(CLIENTS_BASE)) {
    warn(`Clients directory not found: ${CLIENTS_BASE}`);
    return [];
  }

  const entries = fs.readdirSync(CLIENTS_BASE, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith('.'));
}

// ── Process a single existing client directory ────────────────────────────────

function processClientDir(clientId) {
  const dir = path.join(CLIENTS_BASE, clientId);
  const recordPath = path.join(dir, 'client-record.json');
  const settingsPath = path.join(dir, 'settings.json');

  // Check if client-record.json already exists
  const existingRecord = readJson(recordPath);
  if (existingRecord && !isForce) {
    log(`  Client '${clientId}' already has client-record.json. Skipping record creation.`);
    return existingRecord;
  }

  // Load settings.json for any existing metadata
  const settings = readJson(settingsPath);

  // Try to extract known metadata from settings.json
  const now = new Date().toISOString();

  const clientRecord = {
    id: clientId,
    slug: clientId,
    name: slugToName(clientId),
    contactEmail: undefined,
    contactPhone: undefined,
    industry: guessIndustry(clientId),
    status: 'active',
    branding: extractBranding(settings),
    createdAt: now,
    updatedAt: now,
  };

  // Special case for absolute-pest-services — fill in known details
  if (clientId === 'absolute-pest-services') {
    clientRecord.name = 'Absolute Pest Services';
    clientRecord.industry = 'pest-control';
  }

  log(`  Creating client-record.json for '${clientId}'`);
  log(`    Name: ${clientRecord.name}`);
  log(`    Industry: ${clientRecord.industry || '(not set)'}`);
  log(`    Status: ${clientRecord.status}`);

  writeJsonAtomic(recordPath, clientRecord);

  // Ensure required subdirectories exist
  const socialPostsDir = path.join(dir, 'social-posts');
  const outreachDir = path.join(dir, 'outreach');

  if (!fs.existsSync(socialPostsDir)) {
    if (!isDryRun) {
      fs.mkdirSync(socialPostsDir, { recursive: true });
    }
    log(`  Created: ${socialPostsDir}`);
  }

  if (!fs.existsSync(outreachDir)) {
    if (!isDryRun) {
      fs.mkdirSync(outreachDir, { recursive: true });
    }
    log(`  Created: ${outreachDir}`);
  }

  return clientRecord;
}

function guessIndustry(clientId) {
  if (clientId.includes('pest')) return 'pest-control';
  if (clientId.includes('plumb')) return 'plumbing';
  if (clientId.includes('hvac') || clientId.includes('heat') || clientId.includes('air')) return 'hvac';
  if (clientId.includes('restaurant') || clientId.includes('food')) return 'food-service';
  if (clientId.includes('legal') || clientId.includes('law')) return 'legal';
  if (clientId.includes('dental') || clientId.includes('medical') || clientId.includes('health')) return 'healthcare';
  return 'other';
}

function extractBranding(settings) {
  if (!settings) return {};
  const brand = settings.brand || {};
  return {
    primaryColor: brand.primaryColor || undefined,
    secondaryColor: brand.secondaryColor || undefined,
    logoUrl: brand.logoUrl || undefined,
  };
}

// ── Build and write the clients index ────────────────────────────────────────

function buildClientsIndex(clients) {
  const now = new Date().toISOString();
  const activeClients = clients.filter((c) => c.status === 'active').length;
  const archivedClients = clients.filter((c) => c.status === 'archived').length;

  return {
    version: '1.0',
    generatedAt: now,
    totalClients: clients.length,
    activeClients,
    archivedClients,
    clients: clients.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  };
}

// ── Main Migration ────────────────────────────────────────────────────────────

function main() {
  log('Starting multi-client migration...');
  log(`Mode: ${isDryRun ? 'DRY RUN (no files will be written)' : 'LIVE'}`);
  log(`Clients base: ${CLIENTS_BASE}`);
  log('');

  // Check if already migrated
  if (checkAlreadyMigrated()) {
    process.exit(0);
  }

  // Discover existing client directories
  const clientDirs = discoverClientDirs();
  if (clientDirs.length === 0) {
    warn('No client directories found. Nothing to migrate.');
    log('Creating empty clients-index.json...');
    const emptyIndex = buildClientsIndex([]);
    writeJsonAtomic(INDEX_PATH, emptyIndex);
    log('Done. Empty index created.');
    process.exit(0);
  }

  log(`Found ${clientDirs.length} client director${clientDirs.length === 1 ? 'y' : 'ies'}: ${clientDirs.join(', ')}`);
  log('');

  // Process each client directory
  const clientRecords = [];
  for (const clientId of clientDirs) {
    log(`Processing: ${clientId}`);
    const record = processClientDir(clientId);
    if (record) {
      clientRecords.push(record);
    }
    log('');
  }

  // Build and write the index
  const index = buildClientsIndex(clientRecords);

  log(`Writing clients-index.json with ${clientRecords.length} client(s)...`);
  writeJsonAtomic(INDEX_PATH, index);

  log('');
  log('✅ Migration complete!');
  log(`   Clients registered: ${clientRecords.length}`);
  log(`   Active: ${index.activeClients}`);
  log(`   Archived: ${index.archivedClients}`);
  log('');
  log('Rollback: Delete clients-index.json and all client-record.json files to revert.');
  log('Re-run: Pass --force to re-migrate existing clients.');
}

main();
