import { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol: string;
  height?: number;
}

const TRADINGVIEW_SCRIPT_URL =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

export default function TradingViewChart({
  symbol,
  height = 420,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!symbol) return;

    const container = containerRef.current;
    if (!container) return;

    console.log("TradingView에 실제 전달되는 symbol:", symbol);

    // 이전 종목의 TradingView 위젯 완전히 제거
    container.innerHTML = "";

    // TradingView 위젯이 삽입될 영역 생성
    const widgetContainer = document.createElement("div");

    widgetContainer.className =
      "tradingview-widget-container__widget";

    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    container.appendChild(widgetContainer);

    // TradingView 공식 Advanced Chart 스크립트 생성
    const script = document.createElement("script");

    script.src = TRADINGVIEW_SCRIPT_URL;
    script.type = "text/javascript";
    script.async = true;

    // 여기 symbol 값이 종목마다 새로 들어감
    script.innerHTML = JSON.stringify({
      autosize: true,

      symbol: symbol,

      interval: "D",

      timezone: "Asia/Seoul",

      theme: "dark",

      style: "1",

      locale: "kr",

      backgroundColor: "#131722",

      hide_top_toolbar: false,

      hide_side_toolbar: false,

      hide_legend: false,

      allow_symbol_change: false,

      save_image: false,

      calendar: false,

      support_host: "https://www.tradingview.com",
    });

    container.appendChild(script);

    return () => {
      // 다른 종목으로 이동하면 이전 위젯 제거
      container.innerHTML = "";
    };
  }, [symbol]);

  if (!symbol) {
    return (
      <div
        className="grid place-items-center overflow-hidden rounded-2xl border border-white/[0.06] bg-[#131722]"
        style={{
          height,
          minHeight: height,
        }}
      >
        <p className="text-sm text-white/40">
          차트를 불러오는 중이에요.
        </p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#131722]"
      style={{
        height,
        minHeight: height,
      }}
    >
      <div
        ref={containerRef}
        className="tradingview-widget-container h-full w-full"
      />
    </div>
  );
}