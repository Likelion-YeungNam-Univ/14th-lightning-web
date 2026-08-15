export type SessionResponse = {
  created: boolean;
  authenticated: boolean;
  stocks: string[];
};

export type LoginResponse = { authenticated: boolean };

export type MarketInfo = {
  market: string;
  tabs: string[];
  stock_count: number;
  last_stock_code: string | null;
  reason: string | null;
};

export type MarketsResponse = { markets: MarketInfo[] };

export type MyStockItem = {
  stock_code: string;
  name: string;
  market: string;
  display_order: number;
  is_default: boolean;
};

export type MyStocksResponse = { items: MyStockItem[] };
