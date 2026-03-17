/**
 * Client Service — Multi-Client Support
 * SC-CLIENT-003 + SC-CLIENT-004
 *
 * Handles all file I/O for client management.
 * Uses atomic writes (temp file + renameSync) for index updates.
 */

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Client {
  id: string;           // "clt_" + uuid fragment
  slug: string;         // "absolute-pest-services", unique, URL-safe
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  industry?: string;
  status: 'active' | 'archived';
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  createdAt: string;    // ISO-8601
  updatedAt: string;    // ISO-8601
  archivedAt?: string;
}

export interface ClientIndexEntry {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ClientsIndex {
  version: string;
  generatedAt: string;
  totalClients: number;
  activeClients: number;
  archivedClients: number;
  clients: ClientIndexEntry[];
}

export interface ClientSettings {
  platforms: ('facebook' | 'instagram' | 'nextdoor' | 'gmb')[];
  pillars: {
    id: string;
    name: string;
    color: string;
    description: string;
  }[];
  outreachTargets: {
    likes: number;
    comments: number;
  };
  brand: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
  };
  timezone: string;
  reminderTime: string;
}

// ── Paths ────────────────────────────────────────────────────────────────────

const CLIENTS_BASE = path.join(process.env.MISSION_CONTROL_DATA_DIR || '/data/mission-control-data', 'clients');
const INDEX_PATH = path.join(CLIENTS_BASE, 'clients-index.json');

function clientDir(clientId: string): string {
  return path.join(CLIENTS_BASE, clientId);
}

function clientRecordPath(clientId: string): string {
  return path.join(clientDir(clientId), 'client-record.json');
}

function clientSettingsPath(clientId: string): string {
  return path.join(clientDir(clientId), 'settings.json');
}

// ── Utilities ─────────────────────────────────────────────────────────────────

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fsPromises.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Atomic write: write to temp file, then rename over target.
 * Prevents partial writes from corrupting data.
 */
function writeJsonAtomic(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

async function ensureDir(dir: string): Promise<void> {
  await fsPromises.mkdir(dir, { recursive: true });
}

/**
 * Generate a URL-safe slug from a name.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Index Management ─────────────────────────────────────────────────────────

export async function readIndex(): Promise<ClientsIndex> {
  const data = await readJson<ClientsIndex>(INDEX_PATH);
  if (data) return data;

  // Return empty index if file doesn't exist
  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    totalClients: 0,
    activeClients: 0,
    archivedClients: 0,
    clients: [],
  };
}

function recomputeIndex(clients: ClientIndexEntry[]): Omit<ClientsIndex, 'clients'> {
  const activeClients = clients.filter((c) => c.status === 'active').length;
  const archivedClients = clients.filter((c) => c.status === 'archived').length;
  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    totalClients: clients.length,
    activeClients,
    archivedClients,
  };
}

function writeIndex(index: ClientsIndex): void {
  const stats = recomputeIndex(index.clients);
  const updated: ClientsIndex = { ...stats, clients: index.clients };
  writeJsonAtomic(INDEX_PATH, updated);
}

// ── Slug Utilities ───────────────────────────────────────────────────────────

/**
 * Returns a unique slug. If the base slug is taken, appends -2, -3, etc.
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  const index = await readIndex();
  const existingSlugs = new Set(index.clients.map((c) => c.slug));

  if (!existingSlugs.has(base)) return base;

  let i = 2;
  while (existingSlugs.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug);
}

// ── Client CRUD ───────────────────────────────────────────────────────────────

export async function listClients(
  statusFilter: 'active' | 'archived' | 'all' = 'active'
): Promise<Client[]> {
  const index = await readIndex();
  const filtered =
    statusFilter === 'all'
      ? index.clients
      : index.clients.filter((c) => c.status === statusFilter);

  // Load full records for each matching client
  const results = await Promise.all(
    filtered.map(async (entry) => {
      const record = await readJson<Client>(clientRecordPath(entry.id));
      return record;
    })
  );

  return results.filter((c): c is Client => c !== null);
}

export async function getClient(clientId: string): Promise<Client | null> {
  return readJson<Client>(clientRecordPath(clientId));
}

export async function getClientBySlug(slug: string): Promise<Client | null> {
  const index = await readIndex();
  const entry = index.clients.find((c) => c.slug === slug);
  if (!entry) return null;
  return getClient(entry.id);
}

export interface CreateClientInput {
  name: string;
  slug?: string;  // auto-generated if not provided
  contactEmail?: string;
  contactPhone?: string;
  industry?: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  const index = await readIndex();

  // Generate or validate slug
  const slug = input.slug
    ? input.slug.toLowerCase().trim()
    : await generateUniqueSlug(input.name);

  // Check slug uniqueness
  const slugTaken = index.clients.find((c) => c.slug === slug);
  if (slugTaken) {
    const suggestion = await generateUniqueSlug(input.name);
    const err = new Error(`SLUG_CONFLICT:${slug}:${suggestion}`);
    err.name = 'SlugConflict';
    throw err;
  }

  if (!isValidSlug(slug)) {
    throw new Error('INVALID_SLUG: Slug must be 3-50 chars, lowercase alphanumeric and hyphens only');
  }

  // Generate ID - use slug for "absolute-pest-services" compatibility,
  // or a clt_ prefixed id for new clients
  const id = slug === 'absolute-pest-services' ? slug : `clt_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const now = new Date().toISOString();

  const client: Client = {
    id,
    slug,
    name: input.name,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    industry: input.industry,
    status: 'active',
    branding: input.branding ?? {},
    createdAt: now,
    updatedAt: now,
  };

  // Create directory structure
  const dir = clientDir(id);
  await ensureDir(path.join(dir, 'social-posts'));
  await ensureDir(path.join(dir, 'outreach'));

  // Write client record
  writeJsonAtomic(clientRecordPath(id), client);

  // Copy default settings from absolute-pest-services (or create minimal defaults)
  const settingsTargetPath = clientSettingsPath(id);
  const existingSettings = await readJson<ClientSettings>(settingsTargetPath);
  if (!existingSettings) {
    const templateSettings = await readJson<object>(
      path.join(CLIENTS_BASE, 'absolute-pest-services', 'settings.json')
    );
    if (templateSettings) {
      writeJsonAtomic(settingsTargetPath, {
        ...templateSettings,
        clientId: id,
      });
    } else {
      // Minimal default settings
      const defaultSettings: ClientSettings = {
        platforms: ['facebook', 'instagram', 'nextdoor', 'gmb'],
        pillars: [],
        outreachTargets: { likes: 25, comments: 5 },
        brand: { primaryColor: '#000000', secondaryColor: '#ffffff' },
        timezone: 'America/New_York',
        reminderTime: '08:00',
      };
      writeJsonAtomic(settingsTargetPath, defaultSettings);
    }
  }

  // Update index
  const newEntry: ClientIndexEntry = {
    id,
    slug,
    name: input.name,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  index.clients.push(newEntry);
  writeIndex(index);

  return client;
}

export interface UpdateClientInput {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  industry?: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
}

export async function updateClient(clientId: string, input: UpdateClientInput): Promise<Client> {
  const client = await getClient(clientId);
  if (!client) throw new Error(`CLIENT_NOT_FOUND:${clientId}`);

  const now = new Date().toISOString();

  const updated: Client = {
    ...client,
    ...(input.name !== undefined && { name: input.name }),
    ...(input.contactEmail !== undefined && { contactEmail: input.contactEmail }),
    ...(input.contactPhone !== undefined && { contactPhone: input.contactPhone }),
    ...(input.industry !== undefined && { industry: input.industry }),
    ...(input.branding !== undefined && { branding: { ...client.branding, ...input.branding } }),
    updatedAt: now,
  };

  writeJsonAtomic(clientRecordPath(clientId), updated);

  // Update index entry
  const index = await readIndex();
  const idx = index.clients.findIndex((c) => c.id === clientId);
  if (idx >= 0) {
    index.clients[idx] = {
      ...index.clients[idx],
      name: updated.name,
      updatedAt: now,
    };
    writeIndex(index);
  }

  return updated;
}

export async function archiveClient(clientId: string): Promise<Client> {
  const client = await getClient(clientId);
  if (!client) throw new Error(`CLIENT_NOT_FOUND:${clientId}`);
  if (client.status === 'archived') throw new Error(`CLIENT_ALREADY_ARCHIVED:${clientId}`);

  const now = new Date().toISOString();
  const updated: Client = {
    ...client,
    status: 'archived',
    archivedAt: now,
    updatedAt: now,
  };

  writeJsonAtomic(clientRecordPath(clientId), updated);

  const index = await readIndex();
  const idx = index.clients.findIndex((c) => c.id === clientId);
  if (idx >= 0) {
    index.clients[idx] = { ...index.clients[idx], status: 'archived', updatedAt: now };
    writeIndex(index);
  }

  return updated;
}

export async function restoreClient(clientId: string): Promise<Client> {
  const client = await getClient(clientId);
  if (!client) throw new Error(`CLIENT_NOT_FOUND:${clientId}`);
  if (client.status === 'active') throw new Error(`CLIENT_ALREADY_ACTIVE:${clientId}`);

  const now = new Date().toISOString();
  const updated: Client = {
    ...client,
    status: 'active',
    archivedAt: undefined,
    updatedAt: now,
  };

  writeJsonAtomic(clientRecordPath(clientId), updated);

  const index = await readIndex();
  const idx = index.clients.findIndex((c) => c.id === clientId);
  if (idx >= 0) {
    index.clients[idx] = { ...index.clients[idx], status: 'active', updatedAt: now };
    writeIndex(index);
  }

  return updated;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getClientSettings(clientId: string): Promise<ClientSettings | null> {
  const raw = await readJson<Record<string, unknown>>(clientSettingsPath(clientId));
  if (!raw) return null;

  // Normalize the settings.json — it may be in old format from Absolute Pest
  return normalizeSettings(raw);
}

function normalizeSettings(raw: Record<string, unknown>): ClientSettings {
  // Handle both old format (contentPillars/platforms as objects) and new format
  let platforms: ClientSettings['platforms'] = ['facebook', 'instagram', 'nextdoor', 'gmb'];
  if (Array.isArray(raw.platforms)) {
    platforms = (raw.platforms as Array<{ id: string } | string>).map((p) =>
      typeof p === 'string' ? p : p.id
    ) as ClientSettings['platforms'];
  }

  let pillars: ClientSettings['pillars'] = [];
  const rawPillars = raw.pillars ?? raw.contentPillars;
  if (Array.isArray(rawPillars)) {
    pillars = (rawPillars as Array<Record<string, unknown>>).map((p) => ({
      id: String(p.id ?? ''),
      name: String(p.name ?? p.label ?? ''),
      color: String(p.color ?? '#000000'),
      description: String(p.description ?? ''),
    }));
  }

  let outreachTargets: ClientSettings['outreachTargets'] = { likes: 25, comments: 5 };
  if (raw.outreachTargets && typeof raw.outreachTargets === 'object') {
    const ot = raw.outreachTargets as Record<string, unknown>;
    outreachTargets = {
      likes: Number(ot.likes ?? ot.accountsLikedPerDay ?? 25),
      comments: Number(ot.comments ?? ot.commentsWrittenPerDay ?? 5),
    };
  }

  let brand: ClientSettings['brand'] = { primaryColor: '#000000', secondaryColor: '#ffffff' };
  if (raw.brand && typeof raw.brand === 'object') {
    const b = raw.brand as Record<string, unknown>;
    brand = {
      primaryColor: String(b.primaryColor ?? '#000000'),
      secondaryColor: String(b.secondaryColor ?? '#ffffff'),
      logoUrl: b.logoUrl ? String(b.logoUrl) : undefined,
    };
  }

  return {
    platforms,
    pillars,
    outreachTargets,
    brand,
    timezone: String(raw.timezone ?? 'America/New_York'),
    reminderTime: String(raw.reminderTime ?? raw.reminderDateTime ?? '08:00'),
  };
}

export async function updateClientSettings(
  clientId: string,
  settings: Partial<ClientSettings>
): Promise<ClientSettings> {
  const existing = await getClientSettings(clientId);

  const updated: ClientSettings = {
    ...(existing ?? {
      platforms: ['facebook', 'instagram', 'nextdoor', 'gmb'],
      pillars: [],
      outreachTargets: { likes: 25, comments: 5 },
      brand: { primaryColor: '#000000', secondaryColor: '#ffffff' },
      timezone: 'America/New_York',
      reminderTime: '08:00',
    }),
    ...settings,
  };

  writeJsonAtomic(clientSettingsPath(clientId), updated);
  return updated;
}

// ── Validation Helpers ────────────────────────────────────────────────────────

/**
 * Validate that a client exists and is active.
 * Returns the client or throws a typed error.
 */
export async function requireActiveClient(clientId: string): Promise<Client> {
  if (!clientId) {
    const err = new Error('CLIENT_MISSING');
    err.name = 'ClientMissing';
    throw err;
  }

  const client = await getClient(clientId);
  if (!client) {
    const err = new Error(`CLIENT_NOT_FOUND:${clientId}`);
    err.name = 'ClientNotFound';
    throw err;
  }

  if (client.status === 'archived') {
    const err = new Error(`CLIENT_ARCHIVED:${clientId}`);
    err.name = 'ClientArchived';
    throw err;
  }

  return client;
}
