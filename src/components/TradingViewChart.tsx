import { useEffect, useId, useRef, useState } from "react";

interface TradingViewChartProps {
  symbol: string;
  height?: number;
}

declare global {
  interface Window {
    TradingView?: { widget: new (options: Record<string, unknown>) => unknown };
  }
}

let scriptLoadingPromise: Promise<void> | null = null;

function loadTradingViewScript(): Promise<void> {
  if (window.TradingView) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://s3.tradingview.com/tv.js"]',
    );
    const script = existingScript ?? document.createElement("script");

    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        scriptLoadingPromise = null;
        reject(new Error("TradingView 스크립트를 불러오지 못했어요."));
      },
      { once: true },
    );

    if (!existingScript) {
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return scriptLoadingPromise;
}

// KRX(국내) 심볼도 TradingView 무료 위젯에서 정상 렌더된다(지연 시세) —
// 이전의 "KRX 외부 차트 제한" 분기는 잘못된 전제여서 제거했다.
export default function TradingViewChart({
  symbol,
  height = 420,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const [error, setError] = useState("");
  const containerId = `tv-chart-${reactId.replace(/:/g, "")}-${symbol.replace(/[^a-zA-Z0-9]/g, "-")}`;

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    setError("");

    void loadTradingViewScript()
      .then(() => {
        if (cancelled || !window.TradingView) return;

        container.innerHTML = "";
        new window.TradingView.widget({
          symbol,
          container_id: containerId,
          autosize: true,
          interval: "D",
          timezone: "Asia/Seoul",
          theme: "dark",
          style: "1",
          locale: "kr",
          toolbar_bg: "#131722",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          allow_symbol_change: false,
        });
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : "차트를 불러오지 못했어요.",
          );
        }
      });

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [symbol, containerId]);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#131722]"
      style={{ height }}
    >
      {error ? (
        <div className="grid h-full place-items-center px-6 text-center">
          <div>
            <p className="font-bold text-white">차트를 불러오지 못했어요.</p>
            <p className="mt-2 text-sm text-white/40">
              네트워크 연결을 확인한 뒤 다시 시도해주세요.
            </p>
          </div>
        </div>
      ) : (
        <div id={containerId} ref={containerRef} className="h-full w-full" />
      )}
    </div>
  );
}
