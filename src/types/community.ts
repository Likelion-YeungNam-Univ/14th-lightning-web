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
  side: CommunityDirection;
  body: string;
  likes: number;
  likedByMe?: boolean;
  replies: CommunityReply[];
}

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