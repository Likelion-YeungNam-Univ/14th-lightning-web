import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string; // 예: "KRX:005930", "NASDAQ:NVDA"
  height?: number;
}

declare global {
  interface Window {
    TradingView?: any;
  }
}

let scriptLoadingPromise: Promise<void> | null = null;

// TradingView 위젯 스크립트를 한 번만 로드한다 (여러 차트가 있어도 재사용).
function loadTradingViewScript(): Promise<void> {
  if (window.TradingView) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('TradingView 스크립트를 불러오지 못했어요.'));
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
}

export default function TradingViewChart({ symbol, height = 420 }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 심볼마다 고유한 DOM id가 있어야 위젯이 꼬이지 않는다.
  const containerId = `tv-chart-${symbol.replace(/[^a-zA-Z0-9]/g, '-')}`;

  useEffect(() => {
    let cancelled = false;

    loadTradingViewScript().then(() => {
      if (cancelled || !containerRef.current || !window.TradingView) return;

      containerRef.current.innerHTML = ''; // 이전 위젯 흔적 제거

      new window.TradingView.widget({
        symbol,
        container_id: containerId,
        autosize: true,
        interval: 'D',
        timezone: 'Asia/Seoul',
        theme: 'dark',
        style: '1',
        locale: 'kr',
        toolbar_bg: '#131722',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        allow_symbol_change: false,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [symbol, containerId]);

  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#131722]"
      style={{ height }}
    >
      <div id={containerId} ref={containerRef} className="h-full w-full" />
    </div>
  );
}