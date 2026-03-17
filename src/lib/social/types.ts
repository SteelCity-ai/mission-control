// Social Content Manager — Shared Types
// Task: SC-SOCIAL-004 + SC-SOCIAL-005

export type Platform = 'facebook' | 'instagram' | 'nextdoor' | 'gmb';
export type PostStatus = 'draft' | 'review' | 'approved' | 'posted';
export type Pillar =
  | 'humane_difference'
  | 'honest_experts'
  | 'no_contract_no_pressure'
  | 'neighbors_trust_neighbors'
  | 'behind_the_uniform'
  | null;

export interface StatusHistoryEntry {
  status: PostStatus;
  timestamp: string;
  updatedBy: string;
}

export interface SocialPost {
  id: string;
  clientId: string;
  platform: Platform;
  content: string;
  pillar: Pillar;
  pillarName: string | null;
  scheduledDate: string; // YYYY-MM-DD
  status: PostStatus;
  statusHistory: StatusHistoryEntry[];
  createdAt: string; // ISO-8601
  approvedAt: string | null;
  postedAt: string | null;
  deleted: boolean;
  deletedAt: string | null;
  revision: number;
  notes?: string;
  tags?: string[];
}

export interface SocialPostIndexEntry {
  id: string;
  platform: Platform;
  scheduledDate: string;
  status: PostStatus;
  pillar: Pillar;
  deleted: boolean;
  ref: string; // path reference
}

export interface SocialPostIndex {
  clientId: string;
  totalPosts: number;
  statsByStatus: Record<PostStatus, number>;
  lastUpdated: string;
  posts: SocialPostIndexEntry[];
}

export interface OutreachLike {
  account: string;
  timestamp: string;
  url?: string;
}

export interface OutreachComment {
  account: string;
  text: string;
  wordCount: number;
  timestamp: string;
  url?: string;
}

export interface DailyOutreach {
  date: string; // YYYY-MM-DD
  clientId: string;
  likes: OutreachLike[];
  comments: OutreachComment[];
  completed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachIndexRecord {
  date: string;
  completed: boolean;
  likesCount: number;
  commentsCount: number;
  ref: string;
}

export interface OutreachIndex {
  clientId: string;
  totalDaysLogged: number;
  targets: {
    accountsLikedPerDay: number;
    commentsWrittenPerDay: number;
    minCommentWordCount: number;
  };
  lastUpdated: string;
  records: OutreachIndexRecord[];
}

// Status transition map — valid next states
export const STATUS_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  draft: ['review'],
  review: ['draft', 'approved'],
  approved: ['posted'],
  posted: [],
};

export const PILLAR_NAMES: Record<NonNullable<Pillar>, string> = {
  humane_difference: 'The Humane Difference',
  honest_experts: 'Honest Experts',
  no_contract_no_pressure: 'No Contract, No Pressure',
  neighbors_trust_neighbors: 'Neighbors Trust Neighbors',
  behind_the_uniform: 'Behind the Uniform',
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  nextdoor: '#00B54A',
  gmb: '#EA4335',
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  nextdoor: 'Nextdoor',
  gmb: 'Google Business',
};

export const STATUS_COLORS: Record<PostStatus, string> = {
  draft: '#6B7280',
  review: '#F59E0B',
  approved: '#22C55E',
  posted: '#3B82F6',
};

export const CLIENT_ID = 'absolute-pest-services';
