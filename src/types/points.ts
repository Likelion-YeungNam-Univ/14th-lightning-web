export type PizzaProgress = {
  held: number;
  target: number;
  percent: number;
};

export type PointBalanceResponse = {
  balance: number;
  pizza_progress: PizzaProgress;
};

export type PointChargeResponse = {
  balance: number;
  charged: number;
};

export type GifticonExchangeResponse = {
  order_id: number;
  points_used: number;
  issued_code: string;
  balance: number;
};

export type PointHistoryEntry = {
  id: string;
  label: string; // "삼성전자 · 베팅 정산 획득"
  amount: number; // 양수면 획득, 음수면 사용
  date_label: string; // "08.10", "지난달" 등
};
