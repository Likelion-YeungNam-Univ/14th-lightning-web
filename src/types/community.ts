export type CommunityDirection = 'up' | 'down';
export type CommunityCurrency = 'KRW' | 'USD';

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
}