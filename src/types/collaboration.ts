/**
 * Real-time Collaboration Types
 * Provides type definitions for multi-user collaboration features
 */

// ============================================================================
// User Presence Types
// ============================================================================

export type UserActivityStatus = 'active' | 'idle' | 'editing' | 'playing' | 'recording' | 'offline';

export interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  color: string; // Unique color for user cursors
  status: UserActivityStatus;
  currentTrackId?: string;
  currentRegion?: { trackId: string; startTime: number; endTime: number };
  cursor?: {
    time: number; // Timeline position
    trackId?: string;
  };
  lastActiveAt: Date;
  joinedAt: Date;
}

export interface PresenceUpdate {
  userId: string;
  status?: UserActivityStatus;
  cursor?: { time: number; trackId?: string };
  currentTrackId?: string;
  currentRegion?: { trackId: string; startTime: number; endTime: number };
}

// ============================================================================
// CRDT & Sync Types
// ============================================================================

export type OperationType =
  | 'track:add'
  | 'track:update'
  | 'track:delete'
  | 'track:reorder'
  | 'clip:add'
  | 'clip:update'
  | 'clip:delete'
  | 'clip:move'
  | 'effect:add'
  | 'effect:update'
  | 'effect:delete'
  | 'automation:add'
  | 'automation:update'
  | 'automation:delete'
  | 'project:update';

export interface Operation {
  id: string;
  type: OperationType;
  userId: string;
  timestamp: number;
  data: Record<string, unknown>;
  vectorClock: VectorClock;
}

export interface VectorClock {
  [userId: string]: number;
}

export interface SyncMessage {
  type: 'sync' | 'update' | 'ack';
  operations?: Operation[];
  vectorClock: VectorClock;
  stateVector?: Uint8Array; // Y.js state vector
  update?: Uint8Array; // Y.js update
}

// ============================================================================
// Track Lock Types
// ============================================================================

export interface TrackLock {
  trackId: string;
  userId: string;
  username: string;
  lockedAt: Date;
  expiresAt: Date;
  autoRelease: boolean; // Auto-release on inactivity
}

export interface LockRequest {
  trackId: string;
  duration?: number; // Lock duration in seconds (default: 300 = 5 min)
}

export interface LockResponse {
  success: boolean;
  lock?: TrackLock;
  currentHolder?: {
    userId: string;
    username: string;
  };
  message?: string;
}

// ============================================================================
// Comment & Chat Types
// ============================================================================

export interface Comment {
  id: string;
  projectId: string;
  userId: string;
  username: string;
  avatar?: string;
  trackId?: string;
  regionId?: string;
  timestamp?: number; // Timeline position for region comments
  text: string;
  mentions: string[]; // User IDs
  replies?: Comment[];
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  userId: string;
  username: string;
  avatar?: string;
  text: string;
  mentions: string[]; // User IDs
  attachments?: ChatAttachment[];
  replyToId?: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatAttachment {
  id: string;
  type: 'audio' | 'image' | 'file';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// ============================================================================
// Permission Types
// ============================================================================

export type CollaboratorRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface ProjectPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManagePermissions: boolean;
  canExport: boolean;
  canComment: boolean;
  canChat: boolean;
  canLockTracks: boolean;
}

export const ROLE_PERMISSIONS: Record<CollaboratorRole, ProjectPermissions> = {
  OWNER: {
    canEdit: true,
    canDelete: true,
    canInvite: true,
    canManagePermissions: true,
    canExport: true,
    canComment: true,
    canChat: true,
    canLockTracks: true,
  },
  EDITOR: {
    canEdit: true,
    canDelete: false,
    canInvite: false,
    canManagePermissions: false,
    canExport: true,
    canComment: true,
    canChat: true,
    canLockTracks: true,
  },
  VIEWER: {
    canEdit: false,
    canDelete: false,
    canInvite: false,
    canManagePermissions: false,
    canExport: false,
    canComment: true,
    canChat: true,
    canLockTracks: false,
  },
};

export interface ProjectCollaborator {
  id: string;
  projectId: string;
  userId: string;
  email: string;
  username?: string;
  avatar?: string;
  role: CollaboratorRole;
  inviteStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  invitedBy: string;
  invitedAt: Date;
  acceptedAt?: Date;
}

// ============================================================================
// Version History Types
// ============================================================================

export interface ProjectVersion {
  id: string;
  projectId: string;
  version: number;
  snapshot: string; // JSON serialized project state
  changeDescription?: string;
  createdBy: string;
  createdAt: Date;
  size: number; // Snapshot size in bytes
}

export interface VersionDiff {
  versionA: number;
  versionB: number;
  changes: VersionChange[];
}

export interface VersionChange {
  type: 'added' | 'removed' | 'modified';
  path: string; // JSON path to changed field
  oldValue?: unknown;
  newValue?: unknown;
}

// ============================================================================
// Conflict Resolution Types
// ============================================================================

export type ConflictStrategy = 'last-write-wins' | 'merge' | 'manual';

export interface Conflict {
  id: string;
  projectId: string;
  type: OperationType;
  operationA: Operation;
  operationB: Operation;
  strategy: ConflictStrategy;
  resolution?: ConflictResolution;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface ConflictResolution {
  chosenOperation?: 'A' | 'B' | 'merged';
  mergedData?: Record<string, unknown>;
  resolvedBy: string;
}

// ============================================================================
// WebSocket Event Payloads
// ============================================================================

export interface UserJoinedPayload {
  userId: string;
  username: string;
  avatar?: string;
  color: string;
  timestamp: Date;
}

export interface UserLeftPayload {
  userId: string;
  username: string;
  timestamp: Date;
}

export interface PresenceUpdatePayload {
  userId: string;
  presence: Partial<UserPresence>;
  timestamp: Date;
}

export interface CursorMovedPayload {
  userId: string;
  username: string;
  color: string;
  cursor: {
    time: number;
    trackId?: string;
  };
  timestamp: Date;
}

export interface TrackLockedPayload {
  trackId: string;
  userId: string;
  username: string;
  expiresAt: Date;
  timestamp: Date;
}

export interface TrackUnlockedPayload {
  trackId: string;
  userId: string;
  timestamp: Date;
}

export interface CommentAddedPayload {
  comment: Comment;
  timestamp: Date;
}

export interface ChatMessagePayload {
  message: ChatMessage;
  timestamp: Date;
}

export interface SyncUpdatePayload {
  update: Uint8Array; // Y.js update
  userId: string;
  timestamp: Date;
}

// ============================================================================
// Collaboration Session Types
// ============================================================================

export interface CollaborationSession {
  projectId: string;
  activeUsers: Map<string, UserPresence>;
  trackLocks: Map<string, TrackLock>;
  sharedDocument: any; // Y.js shared document
  vectorClock: VectorClock;
  createdAt: Date;
  lastActivityAt: Date;
}

export interface SessionStats {
  projectId: string;
  activeUsers: number;
  totalOperations: number;
  lockedTracks: number;
  unreadMessages: number;
  unresolvedComments: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface InviteCollaboratorRequest {
  email: string;
  role: 'EDITOR' | 'VIEWER';
  message?: string;
}

export interface UpdateCollaboratorRequest {
  role: CollaboratorRole;
}

export interface CreateCommentRequest {
  trackId?: string;
  regionId?: string;
  timestamp?: number;
  text: string;
  mentions?: string[];
}

export interface UpdateCommentRequest {
  text?: string;
  isResolved?: boolean;
}

export interface SendChatMessageRequest {
  text: string;
  mentions?: string[];
  replyToId?: string;
  attachments?: ChatAttachment[];
}

export interface ForkProjectRequest {
  name: string;
  description?: string;
  includeCollaborators?: boolean;
}

export interface RestoreVersionRequest {
  versionId: string;
  createBackup?: boolean;
}

// ============================================================================
// Voice Chat Types (Optional WebRTC)
// ============================================================================

export interface VoiceChatSession {
  projectId: string;
  participants: VoiceChatParticipant[];
  isActive: boolean;
  startedAt: Date;
  startedBy: string;
}

export interface VoiceChatParticipant {
  userId: string;
  username: string;
  isMuted: boolean;
  isSpeaking: boolean;
  peerId: string; // WebRTC peer ID
  joinedAt: Date;
}

export interface VoiceChatSignal {
  type: 'offer' | 'answer' | 'candidate';
  fromUserId: string;
  toUserId: string;
  data: unknown; // RTCSessionDescriptionInit or RTCIceCandidateInit
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType =
  | 'mention'
  | 'comment'
  | 'invite'
  | 'lock-expired'
  | 'track-changed'
  | 'user-joined'
  | 'user-left';

export interface CollaborationNotification {
  id: string;
  userId: string;
  projectId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}
