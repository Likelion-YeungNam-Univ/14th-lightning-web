/**
 * GET /markets
 * 국내/해외
 * tabs 가 국내 해외 // makret으로 구분 하면 안됨
 */
export type MarketInfo = {
  market: string;
  tabs: string[];
  stock_count: number;
  last_stock_code: string | null;
  reason: string | null;
};

// 값 확인
export type MarketsResponse = { markets: MarketInfo[] };

export type MarketNavProps = {
  markets: MarketInfo[];
  activeMarket: string;
  marketsLoading: boolean;
  onSelectMarket: (market: string) => void;
};
