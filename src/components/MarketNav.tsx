import { marketLabels } from "../constants/market";
import type { MarketInfo } from "../types/api";

type MarketNavProps = {
  markets: MarketInfo[];
  activeMarket: string;
  marketsLoading: boolean;
  onSelectMarket: (market: string) => void;
};

export function MarketNav({
  markets,
  activeMarket,
  marketsLoading,
  onSelectMarket,
}: MarketNavProps) {
  return (
    <nav aria-label="시장 선택" className="flex min-h-12 items-center gap-1.5">
      {marketsLoading ? (
        <>
          <span className="h-10 w-[66px] animate-pulse rounded-lg bg-[#171a21]" />
          <span className="h-10 w-[66px] animate-pulse rounded-lg bg-[#171a21]" />
        </>
      ) : (
        markets.map((market) => (
          <button
            key={market.market}
            type="button"
            aria-pressed={activeMarket === market.market}
            onClick={() => onSelectMarket(market.market)}
            className={`min-w-[66px] rounded-lg px-[18px] py-[9px] text-sm font-bold transition-colors ${
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
