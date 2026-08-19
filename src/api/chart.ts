import { getApi } from './client';
import type { ChartSymbolResponse } from '../types/chart';

/** 종목의 TradingView 심볼을 조회한다. GET /stocks/{stock_code}/chart-symbol */
export async function fetchChartSymbol(stockCode: string): Promise<string> {
  const res = await getApi<ChartSymbolResponse>(`/stocks/${stockCode}/chart-symbol`);
  return res.symbol;
}