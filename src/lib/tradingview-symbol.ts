import { useEffect, useState } from 'react';
import { getApi } from '../api/client';

const OVERSEAS_EXCHANGES: Record<string, string> = {
  NVDA: 'NASDAQ', TSLA: 'NASDAQ', AAPL: 'NASDAQ', MSFT: 'NASDAQ',
  GOOGL: 'NASDAQ', AMZN: 'NASDAQ', META: 'NASDAQ', NFLX: 'NASDAQ',
  AMD: 'NASDAQ', INTC: 'NASDAQ', JPM: 'NYSE', KO: 'NYSE', DIS: 'NYSE', NKE: 'NYSE',
};

/** API 사용 전 또는 실패 시 사용할 안전한 TradingView 심볼을 생성합니다. */
export function toTradingViewSymbol(stockCode: string, market: string): string {
  const code = stockCode.toUpperCase().replace(/^.*:/, '');
  const normalizedMarket = market.toLowerCase();
  if (normalizedMarket === 'overseas' || normalizedMarket.includes('us')) {
    return `${OVERSEAS_EXCHANGES[code] ?? 'NASDAQ'}:${code}`;
  }
  return `KRX:${code.padStart(6, '0')}`;
}

/** 백엔드가 확정한 거래소 심볼을 우선 사용하고 실패 시 로컬 매핑으로 대체합니다. */
export function useTradingViewSymbol(stockCode: string, market: string) {
  const [resolved, setResolved] = useState<{ stockCode: string; symbol: string } | null>(null);

  useEffect(() => {
    if (!stockCode) return;
    let cancelled = false;
    void getApi<{ symbol: string }>(`/stocks/${encodeURIComponent(stockCode)}/chart-symbol`)
      .then((response) => { if (!cancelled && response.symbol) setResolved({ stockCode, symbol: response.symbol }); })
      .catch(() => { if (!cancelled) setResolved({ stockCode, symbol: toTradingViewSymbol(stockCode, market) }); });
    return () => { cancelled = true; };
  }, [market, stockCode]);

  return resolved?.stockCode === stockCode ? resolved.symbol : null;
}
