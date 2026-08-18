export type PizzaProgress = {
  held: number;
  target: number;
  percent: number;
};

export type PointBalanceResponse = {
  balance: number;
  pizza_progress: PizzaProgress;
};
