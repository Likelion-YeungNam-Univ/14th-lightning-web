export type CommunityDirection = 'up' | 'down';
export type CommunityCurrency = 'KRW' | 'USD';

export interface CommunityReply {
  id: string;
  author: string;
  body: string;
}

export interface CommunityComment {
  id: string;
  author: string;
  isMine?: boolean;
  side: CommunityDirection;
  body: string;
  likes: number;
  likedByMe?: boolean;
  replies: CommunityReply[];
  attachedCard?: Record<string, unknown> | null;
}

export interface CommentApiItem {
  id: number;
  author_tag: string;
  is_mine: boolean;
  side: string | null;
  body: string | null;
  deleted: boolean;
  saved_card_snapshot: Record<string, unknown> | null;
  created_at: string;
  like_count: number;
  liked_by_me: boolean;
}

export interface CommentListResponse { items: CommentApiItem[]; }
export interface CommentCreateResponse { item: CommentApiItem; }
export interface CommentLikeResponse { liked: boolean; like_count: number; }

export interface CommunityPrediction {
  id: string;
  stockName: string;
  title: string;
  direction: CommunityDirection;
  targetPrice: number;
  currency: CommunityCurrency;
  deadlineLabel: string;
  participantCount: number;
  maxParticipants: number;
  totalPoints: number;
  upRatio: number;
  creatorName: string;
  post: string;
  comments: CommunityComment[];
}

export interface RoomSideCount {
  count: number;
  points: number;
}

export interface RoomListItem {
  id: number;
  title: string;
  target_price: number;
  judge_date: string;
  participant_count: number;
  max_participants: number;
  total_points: number;
  up: RoomSideCount;
  down: RoomSideCount;
  leading_side: string;
  status: string;
  stock_code?: string;
  body?: string | null;
}

export interface RoomListResponse {
  items: RoomListItem[];
}

export interface RoomCreateRequest {
  stock_code: string;
  title: string;
  target_price: number;
  judge_date: string;
  body: string | null;
  amount: number;
  max_participants: number;
}

export interface RoomCreateResponse {
  room: RoomListItem & {
    stock_code: string;
    body: string | null;
  };
}

export type RoomDetailResponse = RoomCreateResponse['room'];

export interface RoomDeleteResponse {
  removed: boolean;
}

export interface BettingEntryResponse {
  room: RoomListItem & {
    stock_code: string;
    body: string | null;
  };
}
