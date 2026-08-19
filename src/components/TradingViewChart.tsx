import { useEffect, useRef, useState } from "react";
import { getApi } from "../api/client";
import { toTradingViewSymbol } from "../lib/tradingview-symbol";

type Props = {
  stockCode: string;
  stockName: string;
  market: string;
  height?: number;
};

type ChartSymbolResponse = {
  chart_symbol?: string;
  tradingview_symbol?: string;
  symbol?: string;
  ticker?: string;
};

type TradingViewWidgetOptions = Record<string, unknown>;
type TradingViewApi = { widget: new (options: TradingViewWidgetOptions) => unknown };
declare global { interface Window { TradingView?: TradingViewApi; } }
let scriptLoadingPromise: Promise<void> | null = null;

function loadTradingViewScript(): Promise<void> {
  if (window.TradingView) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;
  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("TradingView 스크립트를 불러오지 못했어요."));
    document.body.appendChild(script);
  });
  return scriptLoadingPromise;
}

function responseSymbol(response: ChartSymbolResponse) {
  return [response.chart_symbol, response.tradingview_symbol, response.symbol, response.ticker]
    .find((value): value is string => typeof value === "string" && value.includes(":"));
}

function isDomesticStock(stockCode: string, market: string) {
  return ["domestic", "kospi", "kosdaq", "krx", "국내"].includes(market.trim().toLowerCase()) || /^\d{6}$/.test(stockCode.trim());
}

// 국내 종목은 다른 티커(예: NASDAQ:AAPL)를 받아도 절대 표시하지 않는다.
function isValidSymbolForStock(symbol: string, stockCode: string, market: string) {
  if (!isDomesticStock(stockCode, market)) return true;
  const normalizedCode = stockCode.trim().padStart(6, "0");
  return symbol.toUpperCase() === `KRX:${normalizedCode}`;
}

/** 서버가 확정한 TradingView 심볼로 국내·해외 종목 차트를 표시합니다. */
export default function TradingViewChart({ stockCode, stockName, market, height = 420 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const containerId = `tv-chart-${(symbol || stockCode).replace(/[^a-zA-Z0-9]/g, "-")}`;

  useEffect(() => {
    let cancelled = false;
    const loadSymbol = async () => {
      setLoading(true);
      setUsingFallback(false);
      setSymbol("");
      // 다음 종목을 기다리는 동안 이전 종목의 위젯이 남지 않게 즉시 비운다.
      if (containerRef.current) containerRef.current.innerHTML = "";
      try {
        const response = await getApi<ChartSymbolResponse>(`/stocks/${encodeURIComponent(stockCode)}/chart-symbol`);
        const apiSymbol = responseSymbol(response);
        if (!apiSymbol || !isValidSymbolForStock(apiSymbol, stockCode, market)) {
          throw new Error("선택한 종목과 일치하지 않는 차트 심볼이에요.");
        }
        if (!cancelled) setSymbol(apiSymbol);
      } catch {
        // 로컬 API 배포 전에도 화면을 유지하기 위한 호환 경로입니다.
        if (!cancelled) { setSymbol(toTradingViewSymbol(stockCode, market)); setUsingFallback(true); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadSymbol();
    return () => { cancelled = true; };
  }, [stockCode, market]);

  useEffect(() => {
    let cancelled = false;
    if (!symbol) return;
    void loadTradingViewScript().then(() => {
      if (cancelled || !containerRef.current || !window.TradingView) return;
      containerRef.current.innerHTML = "";
      new window.TradingView.widget({
        symbol,
        container_id: containerId,
        autosize: true,
        interval: "D",
        timezone: "Asia/Seoul",
        theme: "dark",
        style: "1",
        locale: "kr",
        toolbar_bg: "#101114",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        allow_symbol_change: false,
      });
    });
    return () => { cancelled = true; };
  }, [symbol, containerId]);

  return <section className="overflow-hidden rounded-2xl border border-[#303744] bg-[#171a21]">
    <header className="flex min-h-17 items-center justify-between border-b border-[#303744] px-5 py-4">
      <div><p className="text-[10px] font-bold text-[#79b8ff]">선택 종목 차트</p><h2 className="mt-1 text-base font-bold text-white">{stockName}</h2></div>
      <span className="text-[10px] text-[#8ebef4]">TradingView · 일봉</span>
    </header>
    <div className="relative bg-[#131722]" style={{ height }}>
      {loading && <div className="absolute inset-0 z-10 grid place-items-center text-sm text-[#9aa3b2]">차트 심볼을 불러오는 중이에요.</div>}
      <div id={containerId} ref={containerRef} className="h-full w-full" />
    </div>
    {usingFallback && <p className="px-5 py-1.5 text-[10px] text-[#7f8998]">차트 심볼 API 연결을 기다리는 중입니다.</p>}
  </section>;
}
