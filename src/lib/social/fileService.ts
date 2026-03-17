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
  CLIENT_ID,
} from './types';

// ── Base paths ──────────────────────────────────────────────────────────────

const DATA_BASE = '/data/mission-control-data/clients/absolute-pest-services';
const POSTS_BASE = path.join(DATA_BASE, 'social-posts');
const OUTREACH_BASE = path.join(DATA_BASE, 'outreach');

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

function getPostsDayPath(date: string): string {
  // date: YYYY-MM-DD
  const [year, month] = date.split('-');
  return path.join(POSTS_BASE, year, month, `posts-${date}.json`);
}

function getOutreachDayPath(date: string): string {
  const [year, month] = date.split('-');
  return path.join(OUTREACH_BASE, year, month, `outreach-${date}.json`);
}

function getPostIndexPath(): string {
  return path.join(POSTS_BASE, 'index.json');
}

function getPostCurrentPath(): string {
  return path.join(POSTS_BASE, 'current.json');
}

function getOutreachIndexPath(): string {
  return path.join(OUTREACH_BASE, 'index.json');
}

function getOutreachCurrentPath(): string {
  return path.join(OUTREACH_BASE, 'current.json');
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
async function readDayPosts(date: string): Promise<SocialPost[]> {
  const filePath = getPostsDayPath(date);
  const data = await readJson<{ date: string; posts: SocialPost[] }>(filePath);
  return data?.posts ?? [];
}

/**
 * Write posts array to a given daily file.
 */
async function writeDayPosts(date: string, posts: SocialPost[]): Promise<void> {
  const filePath = getPostsDayPath(date);
  await writeJson(filePath, { date, posts });
}

/**
 * Read post index.
 */
export async function readPostIndex(): Promise<SocialPostIndex> {
  const data = await readJson<SocialPostIndex>(getPostIndexPath());
  return data ?? {
    clientId: CLIENT_ID,
    totalPosts: 0,
    statsByStatus: { draft: 0, review: 0, approved: 0, posted: 0 },
    lastUpdated: new Date().toISOString(),
    posts: [],
  };
}

/**
 * Rebuild and save post index from existing posts (full rebuild).
 */
async function rebuildPostIndex(): Promise<SocialPostIndex> {
  const index = await readPostIndex();
  // Recalculate stats from existing entries
  const stats: SocialPostIndex['statsByStatus'] = { draft: 0, review: 0, approved: 0, posted: 0 };
  const activePosts = index.posts.filter((p) => !p.deleted);
  for (const p of activePosts) {
    if (p.status in stats) stats[p.status]++;
  }
  index.statsByStatus = stats;
  index.totalPosts = activePosts.length;
  index.lastUpdated = new Date().toISOString();
  await writeJson(getPostIndexPath(), index);
  return index;
}

/**
 * Regenerate current.json (today + this week snapshots).
 */
async function regeneratePostCurrent(today?: string): Promise<void> {
  const todayStr = today ?? new Date().toISOString().split('T')[0];
  const { start, end } = getWeekRange(todayStr);
  const dates = getDatesInRange(start, end);

  const todaysApproved: SocialPost[] = [];
  const thisWeeksPosts: SocialPost[] = [];
  const draftPosts: SocialPost[] = [];
  const reviewPosts: SocialPost[] = [];

  for (const date of dates) {
    const dayPosts = await readDayPosts(date);
    for (const post of dayPosts) {
      if (post.deleted) continue;
      thisWeeksPosts.push(post);
      if (date === todayStr && post.status === 'approved') todaysApproved.push(post);
      if (post.status === 'draft') draftPosts.push(post);
      if (post.status === 'review') reviewPosts.push(post);
    }
  }

  const current = {
    clientId: CLIENT_ID,
    generatedAt: new Date().toISOString(),
    today: todayStr,
    thisWeekRange: `${start} to ${end}`,
    todaysApprovedPosts: todaysApproved,
    thisWeeksPosts,
    draftPosts,
    reviewPosts,
  };

  await writeJson(getPostCurrentPath(), current);
}

/**
 * Add or update a post entry in the index.
 */
async function upsertPostInIndex(post: SocialPost): Promise<void> {
  const index = await readPostIndex();
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

  await writeJson(getPostIndexPath(), index);
}

// ── Public API: Posts ────────────────────────────────────────────────────────

export interface ListPostsOptions {
  week?: string; // YYYY-Www
  startDate?: string;
  endDate?: string;
  status?: PostStatus;
  platform?: Platform;
}

export async function listPosts(opts: ListPostsOptions = {}): Promise<SocialPost[]> {
  let start: string;
  let end: string;

  if (opts.week) {
    const range = getWeekDatesFromISO(opts.week);
    start = range.start;
    end = range.end;
  } else if (opts.startDate && opts.endDate) {
    start = opts.startDate;
    end = opts.endDate;
  } else {
    // Default: current week
    const range = getWeekRange();
    start = range.start;
    end = range.end;
  }

  const dates = getDatesInRange(start, end);
  const posts: SocialPost[] = [];

  for (const date of dates) {
    const dayPosts = await readDayPosts(date);
    for (const post of dayPosts) {
      if (post.deleted) continue;
      if (opts.status && post.status !== opts.status) continue;
      if (opts.platform && post.platform !== opts.platform) continue;
      posts.push(post);
    }
  }

  return posts.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

export async function getPost(id: string): Promise<SocialPost | null> {
  const index = await readPostIndex();
  const entry = index.posts.find((p) => p.id === id);
  if (!entry) return null;

  const dayPosts = await readDayPosts(entry.ref.match(/posts-(\d{4}-\d{2}-\d{2})\.json/)?.[1] ?? '');
  return dayPosts.find((p) => p.id === id) ?? null;
}

export interface CreatePostInput {
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
    clientId: CLIENT_ID,
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

  const existing = await readDayPosts(input.scheduledDate);
  existing.push(post);
  await writeDayPosts(input.scheduledDate, existing);
  await upsertPostInIndex(post);
  await regeneratePostCurrent();

  return post;
}

export interface UpdatePostInput {
  content?: string;
  pillar?: Pillar;
  scheduledDate?: string;
  notes?: string;
  tags?: string[];
}

export async function updatePost(id: string, input: UpdatePostInput): Promise<SocialPost> {
  const post = await getPost(id);
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
    const oldPosts = await readDayPosts(oldDate);
    await writeDayPosts(oldDate, oldPosts.filter((p) => p.id !== id));
    // Add to new day
    const newPosts = await readDayPosts(newDate);
    newPosts.push(post);
    await writeDayPosts(newDate, newPosts);
  } else {
    const dayPosts = await readDayPosts(oldDate);
    const idx = dayPosts.findIndex((p) => p.id === id);
    if (idx >= 0) dayPosts[idx] = post;
    await writeDayPosts(oldDate, dayPosts);
  }

  await upsertPostInIndex(post);
  await regeneratePostCurrent();
  return post;
}

export async function transitionPostStatus(
  id: string,
  newStatus: PostStatus,
  updatedBy = 'mike-1'
): Promise<SocialPost> {
  const post = await getPost(id);
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

  const dayPosts = await readDayPosts(post.scheduledDate);
  const idx = dayPosts.findIndex((p) => p.id === id);
  if (idx >= 0) dayPosts[idx] = post;
  await writeDayPosts(post.scheduledDate, dayPosts);

  await upsertPostInIndex(post);
  await regeneratePostCurrent();
  return post;
}

export async function softDeletePost(id: string): Promise<SocialPost> {
  const post = await getPost(id);
  if (!post) throw new Error('Post not found');

  post.deleted = true;
  post.deletedAt = new Date().toISOString();

  const dayPosts = await readDayPosts(post.scheduledDate);
  const idx = dayPosts.findIndex((p) => p.id === id);
  if (idx >= 0) dayPosts[idx] = post;
  await writeDayPosts(post.scheduledDate, dayPosts);

  await upsertPostInIndex(post);
  await regeneratePostCurrent();
  return post;
}

export async function getReminderData(today?: string): Promise<{
  today: string;
  approvedCount: number;
  posts: SocialPost[];
}> {
  const todayStr = today ?? new Date().toISOString().split('T')[0];
  const dayPosts = await readDayPosts(todayStr);
  const approved = dayPosts.filter((p) => p.status === 'approved' && !p.deleted);
  return {
    today: todayStr,
    approvedCount: approved.length,
    posts: approved,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTREACH — Service Layer
// ─────────────────────────────────────────────────────────────────────────────

export async function readOutreachIndex(): Promise<OutreachIndex> {
  const data = await readJson<OutreachIndex>(getOutreachIndexPath());
  return data ?? {
    clientId: CLIENT_ID,
    totalDaysLogged: 0,
    targets: { accountsLikedPerDay: 25, commentsWrittenPerDay: 5, minCommentWordCount: 5 },
    lastUpdated: new Date().toISOString(),
    records: [],
  };
}

async function upsertOutreachInIndex(outreach: DailyOutreach): Promise<void> {
  const index = await readOutreachIndex();
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
  await writeJson(getOutreachIndexPath(), index);
}

async function regenerateOutreachCurrent(today?: string): Promise<void> {
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
    const data = await readJson<DailyOutreach>(getOutreachDayPath(date));
    if (!data) continue;
    weekDaysLogged++;
    weekLikes += data.likes.length;
    weekComments += data.comments.length;
    if (data.completed) weekDaysMet++;
    if (date === todayStr) todayOutreach = data;
  }

  // Streak: count consecutive completed days up to yesterday
  const index = await readOutreachIndex();
  const yesterday = new Date(todayStr + 'T00:00:00');
  yesterday.setDate(yesterday.getDate() - 1);
  let streak = 0;
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
  streak = currentStreak;

  const current = {
    clientId: CLIENT_ID,
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

  await writeJson(getOutreachCurrentPath(), current);
}

export async function getOutreachByDate(date: string): Promise<DailyOutreach | null> {
  return readJson<DailyOutreach>(getOutreachDayPath(date));
}

export async function initOutreach(date: string): Promise<DailyOutreach> {
  const existing = await getOutreachByDate(date);
  if (existing) return existing;

  const now = new Date().toISOString();
  const outreach: DailyOutreach = {
    date,
    clientId: CLIENT_ID,
    likes: [],
    comments: [],
    completed: false,
    createdAt: now,
    updatedAt: now,
  };

  await writeJson(getOutreachDayPath(date), outreach);
  await upsertOutreachInIndex(outreach);
  await regenerateOutreachCurrent(date);
  return outreach;
}

export async function addLike(date: string, like: Omit<OutreachLike, 'timestamp'>): Promise<DailyOutreach> {
  let outreach = await getOutreachByDate(date);
  if (!outreach) outreach = await initOutreach(date);

  const entry: OutreachLike = {
    ...like,
    timestamp: new Date().toISOString(),
  };
  outreach.likes.push(entry);
  outreach.updatedAt = new Date().toISOString();

  const TARGETS = { likes: 25, comments: 5 };
  outreach.completed =
    outreach.likes.length >= TARGETS.likes && outreach.comments.length >= TARGETS.comments;

  await writeJson(getOutreachDayPath(date), outreach);
  await upsertOutreachInIndex(outreach);
  await regenerateOutreachCurrent(date);
  return outreach;
}

export async function addComment(
  date: string,
  comment: Omit<OutreachComment, 'timestamp' | 'wordCount'>
): Promise<DailyOutreach> {
  let outreach = await getOutreachByDate(date);
  if (!outreach) outreach = await initOutreach(date);

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

  await writeJson(getOutreachDayPath(date), outreach);
  await upsertOutreachInIndex(outreach);
  await regenerateOutreachCurrent(date);
  return outreach;
}

export async function updateOutreach(
  date: string,
  patch: { notes?: string; completed?: boolean }
): Promise<DailyOutreach> {
  let outreach = await getOutreachByDate(date);
  if (!outreach) throw new Error(`Outreach log for ${date} not found`);

  if (patch.notes !== undefined) outreach.notes = patch.notes;
  if (patch.completed !== undefined) outreach.completed = patch.completed;
  outreach.updatedAt = new Date().toISOString();

  await writeJson(getOutreachDayPath(date), outreach);
  await upsertOutreachInIndex(outreach);
  await regenerateOutreachCurrent(date);
  return outreach;
}

export async function listOutreach(opts: { startDate?: string; endDate?: string } = {}): Promise<DailyOutreach[]> {
  const index = await readOutreachIndex();
  let records = index.records;

  if (opts.startDate) records = records.filter((r) => r.date >= opts.startDate!);
  if (opts.endDate) records = records.filter((r) => r.date <= opts.endDate!);

  const results: DailyOutreach[] = [];
  for (const r of records) {
    const data = await getOutreachByDate(r.date);
    if (data) results.push(data);
  }

  return results.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getOutreachCurrentData() {
  return readJson(getOutreachCurrentPath());
}
