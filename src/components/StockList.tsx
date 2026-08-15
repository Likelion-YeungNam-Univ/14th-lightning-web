import type { MyStockItem } from "../types/api";

type StockListProps = {
  stocks: MyStockItem[];
  activeStockCode: string;
  stocksLoading: boolean;
  stocksError: string;
  onSelectStock: (stockCode: string) => void;
};

export function StockList({
  stocks,
  activeStockCode,
  stocksLoading,
  stocksError,
  onSelectStock,
}: StockListProps) {
  return (
    <section
      aria-label="관심 종목"
      className="-mx-6 flex min-h-[82px] flex-col justify-center border-y border-[#20242c] bg-[#12151b] px-6 py-4 max-[760px]:min-h-[78px] max-[760px]:px-[18px]"
    >
      <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stocksLoading ? (
          <>
            <span className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-[#1c2029]" />
            <span className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-[#1c2029]" />
            <span className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-[#1c2029]" />
          </>
        ) : (
          stocks.map((stock) => (
            <button
              key={stock.stock_code}
              type="button"
              aria-pressed={activeStockCode === stock.stock_code}
              onClick={() => onSelectStock(stock.stock_code)}
              className={`shrink-0 rounded-full border border-transparent px-3.5 py-2 text-[13px] font-bold transition-colors duration-[180ms] ease-[cubic-bezier(.23,1,.32,1)] ${
                activeStockCode === stock.stock_code
                  ? "bg-[#4d9fff] text-[#0f1115]"
                  : "bg-[#1c2029] text-[#9aa3b2] hover:border-[#303846] hover:bg-[#202530] hover:text-[#f2f3f5]"
              }`}
            >
              {stock.name}
            </button>
          ))
        )}
        {!stocksLoading && (
          <button
            type="button"
            className="shrink-0 rounded-full border border-dashed border-[#4d9fff]/50 bg-[#1c2029] px-3.5 py-2 text-[13px] font-bold text-[#4d9fff] transition-colors duration-[180ms] ease-[cubic-bezier(.23,1,.32,1)]"
          >
            ＋ 종목 추가
          </button>
        )}
        {!stocksLoading && stocks.length === 0 && !stocksError && (
          <span className="shrink-0 text-xs text-[#9aa3b2]">
            등록한 종목이 없어요.
          </span>
        )}
      </div>
      {stocksError && (
        <p role="status" className="mt-2 text-xs text-[#f0a868]">
          종목 정보를 불러오지 못했습니다: {stocksError}
        </p>
      )}
    </section>
  );
}
