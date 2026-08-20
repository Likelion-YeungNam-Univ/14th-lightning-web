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

export default function TradingViewChart({
  symbol,
  height = 420,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const [error, setError] = useState("");
  const isRestrictedKrxSymbol = symbol.startsWith("KRX:");
  const containerId = `tv-chart-${reactId.replace(/:/g, "")}-${symbol.replace(/[^a-zA-Z0-9]/g, "-")}`;

  useEffect(() => {
    if (isRestrictedKrxSymbol) return;

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
  }, [symbol, containerId, isRestrictedKrxSymbol]);

  if (isRestrictedKrxSymbol) {
    const tradingViewUrl = `https://kr.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`;
    return (
      <div
        className="relative grid overflow-hidden rounded-2xl border border-white/[0.06] bg-[#131722]"
        style={{ height }}
      >
        <span className="absolute right-4 top-4 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold text-amber-300">
          KRX 외부 차트 제한
        </span>
        <div className="m-auto max-w-md px-6 text-center">
          <div className="mx-auto grid size-11 place-items-center rounded-full bg-blue-400/10 text-xl text-blue-300">
            ↗
          </div>
          <h3 className="mt-4 font-bold text-white">
            국내 종목 차트는 TradingView에서 확인할 수 있어요.
          </h3>
          <a
            href={tradingViewUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-lg bg-[#4d9fff] px-4 py-2.5 text-sm font-bold text-[#07111f] hover:bg-[#6aafff]"
          >
            TradingView에서 차트 보기
          </a>
        </div>
      </div>
    );
  }

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
