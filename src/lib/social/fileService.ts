/**
 * Social Content Manager — File Service
 * Handles all JSON file I/O for social posts and outreach data.
 * Uses simple async file operations (low concurrency single-user system).
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import type {
  SocialPost,
  SocialPostIndex,
  SocialPostIndexEntry,
  DailyOutreach,
  OutreachIndex,
  OutreachIndexRecord,
  Platform,
  PostStatus,
  Pillar,
  StatusHistoryEntry,
  OutreachLike,
  OutreachComment,
} from './types';
import {
  STATUS_TRANSITIONS,
  PILLAR_NAMES,
} from './types';

// ── Base paths ──────────────────────────────────────────────────────────────

const CLIENTS_DATA_BASE = '/data/mission-control-data/clients';

/** Get data base dir for a given clientId */
function getDataBase(clientId: string): string {
  return path.join(CLIENTS_DATA_BASE, clientId);
}

function getPostsBase(clientId: string): string {
  return path.join(getDataBase(clientId), 'social-posts');
}

function getOutreachBase(clientId: string): string {
  return path.join(getDataBase(clientId), 'outreach');
}

// ── Utility: ensure directory exists ────────────────────────────────────────

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

// ── Utility: safe JSON read (returns null if missing) ───────────────────────

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Helpers: paths ───────────────────────────────────────────────────────────

function getPostsDayPath(clientId: string, date: string): string {
  // date: YYYY-MM-DD
  const [year, month] = date.split('-');
  return path.join(getPostsBase(clientId), year, month, `posts-${date}.json`);
}

function getOutreachDayPath(clientId: string, date: string): string {
  const [year, month] = date.split('-');
  return path.join(getOutreachBase(clientId), year, month, `outreach-${date}.json`);
}

function getPostIndexPath(clientId: string): string {
  return path.join(getPostsBase(clientId), 'index.json');
}

function getPostCurrentPath(clientId: string): string {
  return path.join(getPostsBase(clientId), 'current.json');
}

function getOutreachIndexPath(clientId: string): string {
  return path.join(getOutreachBase(clientId), 'index.json');
}

function getOutreachCurrentPath(clientId: string): string {
  return path.join(getOutreachBase(clientId), 'current.json');
}

// ── Week helpers ─────────────────────────────────────────────────────────────

function getWeekRange(referenceDate?: string): { start: string; end: string } {
  const d = referenceDate ? new Date(referenceDate + 'T00:00:00') : new Date();
  // Start of week = Monday
  const day = d.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (dt: Date) => dt.toISOString().split('T')[0];
  return { start: fmt(monday), end: fmt(sunday) };
}

function getWeekDatesFromISO(weekStr: string): { start: string; end: string } {
  // weekStr: YYYY-Www e.g. 2026-W12
  const [yearStr, wStr] = weekStr.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(wStr, 10);
  // Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const monday = new Date(startOfWeek1);
  monday.setDate(startOfWeek1.getDate() + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (dt: Date) => dt.toISOString().split('T')[0];
  return { start: fmt(monday), end: fmt(sunday) };
}

function getISOWeek(date: string): string {
  const d = new Date(date + 'T00:00:00');
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000) + 1;
  const week = Math.ceil((dayOfYear + ((jan1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const endD = new Date(end + 'T00:00:00');
  while (cur <= endD) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// ─────────────────────────────────────────────────────────────────────────────
// POSTS — Service Layer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read all posts from a given daily file.
 */
async function readDayPosts(clientId: string, date: string): Promise<SocialPost[]> {
  const filePath = getPostsDayPath(clientId, date);
  const data = await readJson<{ date: string; posts: SocialPost[] }>(filePath);
  return data?.posts ?? [];
}

/**
 * Write posts array to a given daily file.
 */
async function writeDayPosts(clientId: string, date: string, posts: SocialPost[]): Promise<void> {
  const filePath = getPostsDayPath(clientId, date);
  await writeJson(filePath, { date, posts });
}

/**
 * Read post index.
 */
export async function readPostIndex(clientId: string): Promise<SocialPostIndex> {
  const data = await readJson<SocialPostIndex>(getPostIndexPath(clientId));
  return data ?? {
    clientId,
    totalPosts: 0,
    statsByStatus: { draft: 0, review: 0, approved: 0, posted: 0 },
    lastUpdated: new Date().toISOString(),
    posts: [],
  };
}

/**
 * Regenerate current.json (today + this week snapshots).
 */
async function regeneratePostCurrent(clientId: string, today?: string): Promise<void> {
  const todayStr = today ?? new Date().toISOString().split('T')[0];
  const { start, end } = getWeekRange(todayStr);
  const dates = getDatesInRange(start, end);

  const todaysApproved: SocialPost[] = [];
  const thisWeeksPosts: SocialPost[] = [];
  const draftPosts: SocialPost[] = [];
  const reviewPosts: SocialPost[] = [];

  for (const date of dates) {
    const dayPosts = await readDayPosts(clientId, date);
    for (const post of dayPosts) {
      if (post.deleted) continue;
      thisWeeksPosts.push(post);
      if (date === todayStr && post.status === 'approved') todaysApproved.push(post);
      if (post.status === 'draft') draftPosts.push(post);
      if (post.status === 'review') reviewPosts.push(post);
    }
  }

  const current = {
    clientId,
    generatedAt: new Date().toISOString(),
    today: todayStr,
    thisWeekRange: `${start} to ${end}`,
    todaysApprovedPosts: todaysApproved,
    thisWeeksPosts,
    draftPosts,
    reviewPosts,
  };

  await writeJson(getPostCurrentPath(clientId), current);
}

/**
 * Add or update a post entry in the index.
 */
async function upsertPostInIndex(clientId: string, post: SocialPost): Promise<void> {
  const index = await readPostIndex(clientId);
  const entry: SocialPostIndexEntry = {
    id: post.id,
    platform: post.platform,
    scheduledDate: post.scheduledDate,
    status: post.status,
    pillar: post.pillar,
    deleted: post.deleted,
    ref: `social-posts/${post.scheduledDate.split('-')[0]}/${post.scheduledDate.split('-')[1]}/posts-${post.scheduledDate}.json`,
  };

  const existingIdx = index.posts.findIndex((p) => p.id === post.id);
  if (existingIdx >= 0) {
    index.posts[existingIdx] = entry;
  } else {
    index.posts.push(entry);
  }

  // Rebuild stats
  const stats: SocialPostIndex['statsByStatus'] = { draft: 0, review: 0, approved: 0, posted: 0 };
  const activePosts = index.posts.filter((p) => !p.deleted);
  for (const p of activePosts) {
    if (p.status in stats) stats[p.status]++;
  }
  index.statsByStatus = stats;
  index.totalPosts = activePosts.length;
  index.lastUpdated = new Date().toISOString();

  await writeJson(getPostIndexPath(clientId), index);
}

// ── Public API: Posts ────────────────────────────────────────────────────────

export interface ListPostsOptions {
  clientId: string;
  week?: string; // YYYY-Www
  startDate?: string;
  endDate?: string;
  status?: PostStatus;
  platform?: Platform;
}

export async function listPosts(opts: ListPostsOptions): Promise<SocialPost[]> {
  const { clientId, ...filters } = opts;
  let start: string;
  let end: string;

  if (filters.week) {
    const range = getWeekDatesFromISO(filters.week);
    start = range.start;
    end = range.end;
  } else if (filters.startDate && filters.endDate) {
    start = filters.startDate;
    end = filters.endDate;
  } else {
    // Default: current week
    const range = getWeekRange();
    start = range.start;
    end = range.end;
  }

  const dates = getDatesInRange(start, end);
  const posts: SocialPost[] = [];

  for (const date of dates) {
    const dayPosts = await readDayPosts(clientId, date);
    for (const post of dayPosts) {
      if (post.deleted) continue;
      if (filters.status && post.status !== filters.status) continue;
      if (filters.platform && post.platform !== filters.platform) continue;
      posts.push(post);
    }
  }

  return posts.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

export async function getPost(clientId: string, id: string): Promise<SocialPost | null> {
  const index = await readPostIndex(clientId);
  const entry = index.posts.find((p) => p.id === id);
  if (!entry) return null;

  const dayPosts = await readDayPosts(
    clientId,
    entry.ref.match(/posts-(\d{4}-\d{2}-\d{2})\.json/)?.[1] ?? ''
  );
  return dayPosts.find((p) => p.id === id) ?? null;
}

export interface CreatePostInput {
  clientId: string;
  platform: Platform;
  content: string;
  pillar?: Pillar;
  scheduledDate: string;
  notes?: string;
  tags?: string[];
  createdBy?: string;
}

export async function createPost(input: CreatePostInput): Promise<SocialPost> {
  const id = `sp_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const now = new Date().toISOString();

  const pillarName = input.pillar ? (PILLAR_NAMES[input.pillar] ?? null) : null;

  const post: SocialPost = {
    id,
    clientId: input.clientId,
    platform: input.platform,
    content: input.content,
    pillar: input.pillar ?? null,
    pillarName,
    scheduledDate: input.scheduledDate,
    status: 'draft',
    statusHistory: [
      { status: 'draft', timestamp: now, updatedBy: input.createdBy ?? 'mike-1' },
    ],
    createdAt: now,
    approvedAt: null,
    postedAt: null,
    deleted: false,
    deletedAt: null,
    revision: 1,
    notes: input.notes,
    tags: input.tags,
  };

  const existing = await readDayPosts(input.clientId, input.scheduledDate);
  existing.push(post);
  await writeDayPosts(input.clientId, input.scheduledDate, existing);
  await upsertPostInIndex(input.clientId, post);
  await regeneratePostCurrent(input.clientId);

  return post;
}

export interface UpdatePostInput {
  content?: string;
  pillar?: Pillar;
  scheduledDate?: string;
  notes?: string;
  tags?: string[];
}

export async function updatePost(clientId: string, id: string, input: UpdatePostInput): Promise<SocialPost> {
  const post = await getPost(clientId, id);
  if (!post) throw new Error('Post not found');
  if (post.status === 'approved' || post.status === 'posted') {
    throw new Error(`Cannot edit a post with status: ${post.status}`);
  }

  // If rescheduling, move to new day file
  const oldDate = post.scheduledDate;
  const newDate = input.scheduledDate ?? oldDate;

  if (input.content !== undefined) post.content = input.content;
  if (input.pillar !== undefined) {
    post.pillar = input.pillar;
    post.pillarName = input.pillar ? (PILLAR_NAMES[input.pillar] ?? null) : null;
  }
  if (input.notes !== undefined) post.notes = input.notes;
  if (input.tags !== undefined) post.tags = input.tags;
  if (input.scheduledDate !== undefined) post.scheduledDate = input.scheduledDate;
  post.revision++;

  if (oldDate !== newDate) {
    // Remove from old day
    const oldPosts = await readDayPosts(clientId, oldDate);
    await writeDayPosts(clientId, oldDate, oldPosts.filter((p) => p.id !== id));
    // Add to new day
    const newPosts = await readDayPosts(clientId, newDate);
    newPosts.push(post);
    await writeDayPosts(clientId, newDate, newPosts);
  } else {
    const dayPosts = await readDayPosts(clientId, oldDate);
    const idx = dayPosts.findIndex((p) => p.id === id);
    if (idx >= 0) dayPosts[idx] = post;
    await writeDayPosts(clientId, oldDate, dayPosts);
  }

  await upsertPostInIndex(clientId, post);
  await regeneratePostCurrent(clientId);
  return post;
}

export async function transitionPostStatus(
  clientId: string,
  id: string,
  newStatus: PostStatus,
  updatedBy = 'mike-1'
): Promise<SocialPost> {
  const post = await getPost(clientId, id);
  if (!post) throw new Error('Post not found');

  const allowed = STATUS_TRANSITIONS[post.status];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid status transition: ${post.status} → ${newStatus}`);
  }

  const now = new Date().toISOString();
  post.status = newStatus;
  post.statusHistory.push({ status: newStatus, timestamp: now, updatedBy });

  if (newStatus === 'approved') post.approvedAt = now;
  if (newStatus === 'posted') post.postedAt = now;

  const dayPosts = await readDayPosts(clientId, post.scheduledDate);
  const idx = dayPosts.findIndex((p) => p.id === id);
  if (idx >= 0) dayPosts[idx] = post;
  await writeDayPosts(clientId, post.scheduledDate, dayPosts);

  await upsertPostInIndex(clientId, post);
  await regeneratePostCurrent(clientId);
  return post;
}

export async function softDeletePost(clientId: string, id: string): Promise<SocialPost> {
  const post = await getPost(clientId, id);
  if (!post) throw new Error('Post not found');

  post.deleted = true;
  post.deletedAt = new Date().toISOString();

  const dayPosts = await readDayPosts(clientId, post.scheduledDate);
  const idx = dayPosts.findIndex((p) => p.id === id);
  if (idx >= 0) dayPosts[idx] = post;
  await writeDayPosts(clientId, post.scheduledDate, dayPosts);

  await upsertPostInIndex(clientId, post);
  await regeneratePostCurrent(clientId);
  return post;
}

export async function getReminderData(clientId: string, today?: string): Promise<{
  clientId: string;
  today: string;
  approvedCount: number;
  posts: SocialPost[];
}> {
  const todayStr = today ?? new Date().toISOString().split('T')[0];
  const dayPosts = await readDayPosts(clientId, todayStr);
  const approved = dayPosts.filter((p) => p.status === 'approved' && !p.deleted);
  return {
    clientId,
    today: todayStr,
    approvedCount: approved.length,
    posts: approved,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTREACH — Service Layer
// ─────────────────────────────────────────────────────────────────────────────

export async function readOutreachIndex(clientId: string): Promise<OutreachIndex> {
  const data = await readJson<OutreachIndex>(getOutreachIndexPath(clientId));
  return data ?? {
    clientId,
    totalDaysLogged: 0,
    targets: { accountsLikedPerDay: 25, commentsWrittenPerDay: 5, minCommentWordCount: 5 },
    lastUpdated: new Date().toISOString(),
    records: [],
  };
}

async function upsertOutreachInIndex(clientId: string, outreach: DailyOutreach): Promise<void> {
  const index = await readOutreachIndex(clientId);
  const entry: OutreachIndexRecord = {
    date: outreach.date,
    completed: outreach.completed,
    likesCount: outreach.likes.length,
    commentsCount: outreach.comments.length,
    ref: `outreach/${outreach.date.split('-')[0]}/${outreach.date.split('-')[1]}/outreach-${outreach.date}.json`,
  };

  const existingIdx = index.records.findIndex((r) => r.date === outreach.date);
  if (existingIdx >= 0) {
    index.records[existingIdx] = entry;
  } else {
    index.records.push(entry);
    index.totalDaysLogged++;
  }

  index.lastUpdated = new Date().toISOString();
  // Sort records by date desc
  index.records.sort((a, b) => b.date.localeCompare(a.date));
  await writeJson(getOutreachIndexPath(clientId), index);
}

async function regenerateOutreachCurrent(clientId: string, today?: string): Promise<void> {
  const todayStr = today ?? new Date().toISOString().split('T')[0];
  const { start, end } = getWeekRange(todayStr);
  const dates = getDatesInRange(start, end);

  let todayOutreach: DailyOutreach | null = null;
  let weekLikes = 0;
  let weekComments = 0;
  let weekDaysLogged = 0;
  let weekDaysMet = 0;

  const TARGETS = { likes: 25, comments: 5 };

  for (const date of dates) {
    const data = await readJson<DailyOutreach>(getOutreachDayPath(clientId, date));
    if (!data) continue;
    weekDaysLogged++;
    weekLikes += data.likes.length;
    weekComments += data.comments.length;
    if (data.completed) weekDaysMet++;
    if (date === todayStr) todayOutreach = data;
  }

  // Streak: count consecutive completed days up to yesterday
  const index = await readOutreachIndex(clientId);
  let bestStreak = 0;
  let currentStreak = 0;
  let lastCompletedDate: string | null = null;

  const sortedRecords = [...index.records].sort((a, b) => b.date.localeCompare(a.date));
  for (const r of sortedRecords) {
    if (r.completed) {
      if (lastCompletedDate === null) lastCompletedDate = r.date;
      currentStreak++;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }
  const streak = currentStreak;

  const current = {
    clientId,
    generatedAt: new Date().toISOString(),
    today: todayStr,
    todaysProgress: {
      accountsLiked: {
        target: TARGETS.likes,
        completed: todayOutreach?.likes.length ?? 0,
        percentComplete: Math.round(((todayOutreach?.likes.length ?? 0) / TARGETS.likes) * 100),
      },
      commentsWritten: {
        target: TARGETS.comments,
        completed: todayOutreach?.comments.length ?? 0,
        percentComplete: Math.round(((todayOutreach?.comments.length ?? 0) / TARGETS.comments) * 100),
      },
      dayCompleted: todayOutreach?.completed ?? false,
    },
    thisWeeksProgress: {
      daysWithGoalsMet: weekDaysMet,
      totalAccountsLiked: weekLikes,
      totalCommentsWritten: weekComments,
      totalDaysLogged: weekDaysLogged,
    },
    streak: {
      currentStreak: streak,
      bestStreak,
      lastCompletedDate,
    },
  };

  await writeJson(getOutreachCurrentPath(clientId), current);
}

export async function getOutreachByDate(clientId: string, date: string): Promise<DailyOutreach | null> {
  return readJson<DailyOutreach>(getOutreachDayPath(clientId, date));
}

export async function initOutreach(clientId: string, date: string): Promise<DailyOutreach> {
  const existing = await getOutreachByDate(clientId, date);
  if (existing) return existing;

  const now = new Date().toISOString();
  const outreach: DailyOutreach = {
    date,
    clientId,
    likes: [],
    comments: [],
    completed: false,
    createdAt: now,
    updatedAt: now,
  };

  await writeJson(getOutreachDayPath(clientId, date), outreach);
  await upsertOutreachInIndex(clientId, outreach);
  await regenerateOutreachCurrent(clientId, date);
  return outreach;
}

export async function addLike(clientId: string, date: string, like: Omit<OutreachLike, 'timestamp'>): Promise<DailyOutreach> {
  let outreach = await getOutreachByDate(clientId, date);
  if (!outreach) outreach = await initOutreach(clientId, date);

  const entry: OutreachLike = {
    ...like,
    timestamp: new Date().toISOString(),
  };
  outreach.likes.push(entry);
  outreach.updatedAt = new Date().toISOString();

  const TARGETS = { likes: 25, comments: 5 };
  outreach.completed =
    outreach.likes.length >= TARGETS.likes && outreach.comments.length >= TARGETS.comments;

  await writeJson(getOutreachDayPath(clientId, date), outreach);
  await upsertOutreachInIndex(clientId, outreach);
  await regenerateOutreachCurrent(clientId, date);
  return outreach;
}

export async function addComment(
  clientId: string,
  date: string,
  comment: Omit<OutreachComment, 'timestamp' | 'wordCount'>
): Promise<DailyOutreach> {
  let outreach = await getOutreachByDate(clientId, date);
  if (!outreach) outreach = await initOutreach(clientId, date);

  const wordCount = comment.text.trim().split(/\s+/).length;
  if (wordCount < 5) {
    throw new Error(`Comment must be at least 5 words (got ${wordCount})`);
  }

  const entry: OutreachComment = {
    ...comment,
    wordCount,
    timestamp: new Date().toISOString(),
  };
  outreach.comments.push(entry);
  outreach.updatedAt = new Date().toISOString();

  const TARGETS = { likes: 25, comments: 5 };
  outreach.completed =
    outreach.likes.length >= TARGETS.likes && outreach.comments.length >= TARGETS.comments;

  await writeJson(getOutreachDayPath(clientId, date), outreach);
  await upsertOutreachInIndex(clientId, outreach);
  await regenerateOutreachCurrent(clientId, date);
  return outreach;
}

export async function updateOutreach(
  clientId: string,
  date: string,
  patch: { notes?: string; completed?: boolean }
): Promise<DailyOutreach> {
  let outreach = await getOutreachByDate(clientId, date);
  if (!outreach) throw new Error(`Outreach log for ${date} not found`);

  if (patch.notes !== undefined) outreach.notes = patch.notes;
  if (patch.completed !== undefined) outreach.completed = patch.completed;
  outreach.updatedAt = new Date().toISOString();

  await writeJson(getOutreachDayPath(clientId, date), outreach);
  await upsertOutreachInIndex(clientId, outreach);
  await regenerateOutreachCurrent(clientId, date);
  return outreach;
}

export async function listOutreach(clientId: string, opts: { startDate?: string; endDate?: string } = {}): Promise<DailyOutreach[]> {
  const index = await readOutreachIndex(clientId);
  let records = index.records;

  if (opts.startDate) records = records.filter((r) => r.date >= opts.startDate!);
  if (opts.endDate) records = records.filter((r) => r.date <= opts.endDate!);

  const results: DailyOutreach[] = [];
  for (const r of records) {
    const data = await getOutreachByDate(clientId, r.date);
    if (data) results.push(data);
  }

  return results.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getOutreachCurrentData(clientId: string) {
  return readJson(getOutreachCurrentPath(clientId));
}
