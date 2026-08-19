import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string;
  height?: number;
}

declare global {
  interface Window {
    TradingView?: any;
  }
}

let scriptLoadingPromise: Promise<void> | null = null;

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

// 추가: 실제 렌더링을 담당하는 내부 컴포넌트 (key로 완전히 새로 마운트시킬 대상)
function TradingViewChartInner({ symbol, height = 420 }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = `tv-chart-${symbol.replace(/[^a-zA-Z0-9]/g, '-')}`;

  useEffect(() => {
    let cancelled = false;

    loadTradingViewScript().then(() => {
      if (cancelled || !containerRef.current || !window.TradingView) return;

      containerRef.current.innerHTML = '';

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
      className="rounded-2xl overflow-hidden border border-white/6 bg-[#131722]"
      style={{ height }}
    >
      <div id={containerId} ref={containerRef} className="h-full w-full" />
    </div>
  );
}

// 수정: 바깥에서 key={symbol}로 감싸서, 심볼이 바뀌면 완전히 새로운 DOM 트리로 강제 재마운트
export default function TradingViewChart({ symbol, height = 420 }: TradingViewChartProps) {
  return <TradingViewChartInner key={symbol} symbol={symbol} height={height} />;
}