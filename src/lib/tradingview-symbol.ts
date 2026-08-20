// 내부 stock_code + market을 TradingView가 요구하는 심볼("거래소:코드") 형태로 변환한다.
// market 값이 실제로 어떤 문자열("KOSPI"/"국내"/"KRX" 등)로 오는지에 맞춰
// 아래 매핑 표만 수정하면 된다.

const EXCHANGE_PREFIX_BY_MARKET: Record<string, string> = {
  KOSPI: 'KRX',
  KOSDAQ: 'KRX',
  NASDAQ: 'NASDAQ',
  NYSE: 'NYSE',
  AMEX: 'AMEX',
};

export function toTradingViewSymbol(stockCode: string, market: string): string {
  const prefix = EXCHANGE_PREFIX_BY_MARKET[market] ?? 'KRX';
  return `${prefix}:${stockCode}`;
}