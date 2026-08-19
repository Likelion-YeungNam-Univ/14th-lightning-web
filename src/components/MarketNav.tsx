import { marketLabels } from "../constants/market";
import type { MarketNavProps } from "../types/market";

/** GET /markets로 받은 시장을 국내·해외 선택 탭으로 표시한다. */
export function MarketNav({
  markets,
  activeMarket,
  marketsLoading,
  onSelectMarket,
}: MarketNavProps) {
  return (
    <nav
      aria-label="시장 선택"
      className="-mx-6 flex h-17.5 items-center gap-1.5 px-6 max-[760px]:h-15 max-[760px]:px-4.5"
    >
      {/* 시장 조회 중에는 실제 탭과 같은 크기의 스켈레톤을 표시한다. */}
      {marketsLoading ? (
        <>
          <span className="h-10 w-16.5 animate-pulse rounded-lg bg-[#171a21]" />
          <span className="h-10 w-16.5 animate-pulse rounded-lg bg-[#171a21]" />
        </>
      ) : (
        // API 식별자는 유지하고 화면에는 사용자용 한글 이름을 표시한다.
        markets.map((market) => (
          <button
            key={market.market}
            type="button"
            aria-pressed={activeMarket === market.market}
            onClick={() => onSelectMarket(market.market)}
            className={`min-w-16.5 rounded-lg px-4.5 py-2.5 text-sm font-bold transition-colors duration-180 ease-[cubic-bezier(.23,1,.32,1)] ${
              activeMarket === market.market
                ? "bg-[#171a21] text-[#f2f3f5]"
                : "bg-transparent text-[#9aa3b2] hover:bg-[#171a21]/60 hover:text-[#c8ccd4]"
            }`}
          >
            {marketLabels[market.market] ?? market.market}
          </button>
        ))
      )}
    </nav>
  );
}
