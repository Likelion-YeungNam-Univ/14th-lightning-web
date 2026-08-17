// 종목 조회, 추가, 검색, 노출 순서 API에서 사용하는 타입을 정의한다.

/** GET /me/stocks 응답의 관심 종목 한 건을 나타낸다. */
export type MyStockItem = {
  stock_code: string;
  name: string;
  market: string;
  display_order: number;
  is_default: boolean;
};

/** StockList가 종목 상태와 사용자 동작을 전달받는 속성을 정의한다. */
export type StockListProps = {
  stocks: MyStockItem[];
  activeStockCode: string;
  stocksLoading: boolean;
  stocksError: string;
  onSelectStock: (stockCode: string) => void;
  onAddStock?: () => void;
  onReorderStocks?: (stockCodes: string[]) => void;
  reordering?: boolean;
};

// GET /me/stocks의 종목 목록 응답을 나타낸다.
export type MyStocksResponse = { items: MyStockItem[] };

/** PUT /me/stocks/order에 시장과 전체 종목 코드 순서를 전달한다. */
export type StockOrderRequest = {
  market: string;
  stock_codes: string[];
};
export type StockOrderResponse = {
  stocks: string[];
};

// GET /stocks/search의 검색 결과 한 건을 나타낸다.
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

/** GET /stocks/popular의 인기 종목 한 건을 나타낸다. */
export type PopularStockItem = {
  stock_code: string;
  name: string;
  market: string;
  already_added: boolean;
};

/** POST /me/stocks에 추가할 전체 종목 코드 목록을 전달한다. */
export type StockAddRequest = {
  stock_codes: string[];
};
// POST /me/stocks로 추가된 종목 한 건을 나타낸다.
export type AddedStock = {
  stock_code: string;
  name: string;
  market: string;
};

// POST /me/stocks의 추가 결과와 이미 등록된 종목 코드를 나타낸다.
export type StockAddResponse = {
  added: AddedStock[];
  already_registered: string[];
};
