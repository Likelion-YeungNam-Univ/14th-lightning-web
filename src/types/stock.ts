// stocks 종목 추가 모달창(검색, 관심종목) && my-stocks 사용자 종목 처리

/** GET /me/stocks : 관심 종목, 순서 */
// 요청
export type MyStockItem = {
  stock_code: string;
  name: string;
  market: string;
  display_order: number;
  is_default: boolean;
};

// 응답
export type MyStocksResponse = { items: MyStockItem[] };

/** PUT /me/stocks/order  종목코드 순서*/
export type StockOrderRequest = {
  market: string;
  stock_codes: string[];
};
export type StockOrderResponse = {
  stocks: string[];
};

// api/stocks/search
export type StockSearchItem = {
  stock_code: string;
  name: string;
  market: string;
  already_added: boolean;
};
export type StockSearchResponse = {
  items: StockSearchItem[];
  reason?: string | null;
};

/** GET /stocks/popular 인기종목 */
export type PopularStockItem = {
  stock_code: string;
  name: string;
  market: string;
  already_added: boolean;
};

/** POST /me/stocks  종목 추가 (로그인) */
export type StockAddRequest = {
  stock_codes: string[];
};
// 응답
// (+ 시장)
export type AddedStock = {
  stock_code: string;
  name: string;
  market: string;
};

// 이미 등록된 카드
export type StockAddResponse = {
  added: AddedStock[];
  already_registered: string[];
};
