const OVERSEAS_STOCK_NAMES: Record<string, string> = {
  NVDA: 'NVIDIA',
  TSLA: 'Tesla',
  AAPL: 'Apple',
  MSFT: 'Microsoft',
};

function isOverseasMarket(market: string) {
  return market.toLowerCase() === 'overseas';
}

/** 해외 종목은 영문 회사명으로, 국내 종목은 API의 한글 이름으로 표시한다. */
export function displayStockName(stock: { stock_code: string; name: string; market: string }) {
  if (!isOverseasMarket(stock.market)) return stock.name;

  const ticker = stock.stock_code.toUpperCase().replace(/^.*:/, '');
  const knownName = OVERSEAS_STOCK_NAMES[ticker];
  if (knownName) return knownName;

  // 서버가 이미 영문명을 제공하면 그대로 사용하고, 한글명뿐이면 티커를 표시한다.
  return /[A-Za-z]/.test(stock.name) ? stock.name : ticker;
}
