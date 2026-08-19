// /me/stocks가 주는 stock_code와 market을 TradingView 심볼(거래소:코드)로 바꾼다.
// API의 화면 구분값은 domestic / overseas이므로, 해외 종목을 국내 KRX로
// 잘못 보내지 않도록 반드시 market을 먼저 판별한다.

const DOMESTIC_MARKETS = new Set([
  "domestic",
  "kospi",
  "kosdaq",
  "krx",
  "korea",
  "국내",
]);

// API가 거래소까지 제공하지 않는 해외 티커 중 NYSE/AMEX의 대표 종목과 ETF.
// 나머지 미국 보통주는 API의 해외 기본 종목 구성에 맞춰 NASDAQ으로 연결한다.
const NYSE_TICKERS = new Set([
  "BABA", "BAC", "BRK.B", "DIS", "GE", "IBM", "JNJ", "JPM", "KO",
  "MA", "MCD", "NKE", "ORCL", "PFE", "PG", "T", "UNH", "V", "WMT", "XOM",
]);
const AMEX_TICKERS = new Set(["SPY", "QQQ", "DIA", "IWM", "GLD", "SLV", "VTI", "VOO"]);

function normalizeMarket(market: string): string {
  return market.trim().toLowerCase();
}

/** API 종목 코드를 TradingView에서 조회 가능한 심볼로 변환한다. */
export function toTradingViewSymbol(stockCode: string, market: string): string {
  const code = stockCode.trim().toUpperCase();
  if (!code) return "KRX:005930";

  // 백엔드가 향후 NASDAQ:NVDA처럼 거래소를 포함해 주는 경우에도 그대로 사용한다.
  if (/^(KRX|NASDAQ|NYSE|AMEX|NYSEARCA):[A-Z0-9.-]+$/.test(code)) return code;

  const normalizedMarket = normalizeMarket(market);
  if (DOMESTIC_MARKETS.has(normalizedMarket) || /^\d{6}$/.test(code)) {
    return `KRX:${code.padStart(6, "0")}`;
  }

  if (normalizedMarket === "nyse") return `NYSE:${code}`;
  if (normalizedMarket === "amex" || normalizedMarket === "nysearca") {
    return `AMEX:${code}`;
  }
  if (NYSE_TICKERS.has(code)) return `NYSE:${code}`;
  if (AMEX_TICKERS.has(code)) return `AMEX:${code}`;

  // overseas/NASDAQ 및 거래소 정보가 없는 해외 종목의 기본값.
  return `NASDAQ:${code}`;
}
