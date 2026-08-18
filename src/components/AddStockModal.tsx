import { useAddStockModal } from "../hooks/useAddStockModal";
import type { MyStockItem, StockAddResponse, StockChanges } from "../types/stock";

type Props = {
  market: string;
  currentStocks: MyStockItem[];
  onClose: () => void;
  onUpdated: (response: StockAddResponse | null) => void;
  onAuthRequired: (changes: StockChanges) => void;
};

/** 현재 시장의 종목 검색, 선택, 최대 10개 제한과 변경사항 저장을 제공한다. */
export function AddStockModal({
  market,
  currentStocks,
  onClose,
  onUpdated,
  onAuthRequired,
}: Props) {
  const {
    query,
    updateQuery,
    selected,
    selectedCodes,
    candidates,
    loading,
    submitting,
    reason,
    error,
    changed,
    maxStocks,
    addStock,
    removeStock,
    submit,
  } = useAddStockModal({ market, currentStocks, onUpdated, onAuthRequired });

  return (
    <div
      className="fixed inset-0 z-60 grid place-items-center bg-black/70 p-5 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="relative max-h-[calc(100vh-24px)] w-full max-w-170 overflow-y-auto rounded-xl border border-[#303744] bg-[#1b1f29] px-9 py-8 shadow-2xl max-[640px]:px-5"
      >
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-5 top-4 border-0 bg-transparent text-3xl font-light text-[#9aa3b2]"
        >
          ×
        </button>
        <h2 id="add-title" className="m-0 text-[22px] font-bold">
          종목 추가
        </h2>
        <div className="mt-8 flex items-center gap-3">
          <span className="rounded-lg bg-[#23446c] px-3 py-2 text-sm font-bold text-[#4d9fff]">
            {market === "overseas" ? "해외" : "국내"}
          </span>
          <span className="text-sm text-[#9aa3b2]">
            지금 보고 있는 구분에서만 검색돼요
          </span>
        </div>
        <label className="mt-10 flex h-14.5 items-center gap-3 rounded-xl border border-[#3a4250] bg-[#12151b] px-4 focus-within:border-[#4d9fff]">
          <span aria-hidden="true" className="text-2xl text-[#9aa3b2]">
            ⌕
          </span>
          <input
            autoFocus
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="종목명 또는 종목코드로 검색"
            className="w-full border-0 bg-transparent text-base outline-none placeholder:text-[#8b94a3]"
          />
        </label>

        <div className="mt-10">
          <div className="flex items-center justify-between">
            <strong className="text-sm text-[#aab3c1]">
              {query.trim() ? "검색 결과" : "인기 종목"}
            </strong>
            {loading && (
              <span className="text-xs text-[#4d9fff]">검색 중...</span>
            )}
          </div>
          <div className="mt-4 flex min-h-10 flex-wrap gap-2">
            {!loading &&
              candidates.map((stock) => {
                const picked = selectedCodes.has(stock.stock_code);
                return (
                  <button
                    key={stock.stock_code}
                    type="button"
                    disabled={picked || selected.length >= maxStocks}
                    onClick={() => addStock(stock)}
                    className="rounded-full border border-[#343b48] bg-transparent px-4 py-2 text-sm text-[#aab3c1] transition hover:border-[#4d9fff] hover:text-[#f2f3f5] disabled:cursor-default disabled:opacity-25"
                  >
                    {stock.name}
                  </button>
                );
              })}
          </div>
          {!loading && query.trim() && candidates.length === 0 && (
            <p className="text-sm text-[#9aa3b2]">
              {reason === "unsupported_overseas"
                ? "아직 지원하지 않는 해외 종목이에요."
                : "검색 결과가 없어요."}
            </p>
          )}
        </div>

        <div className="mt-12">
          <strong className="text-sm text-[#aab3c1]">
            내 종목 {selected.length} / {maxStocks}
          </strong>
          <div className="mt-4 flex min-h-10 flex-wrap gap-2">
            {selected.map((stock) => (
              <button
                key={stock.stock_code}
                type="button"
                onClick={() => removeStock(stock.stock_code)}
                className="inline-flex items-center gap-2 rounded-full border-0 bg-[#4d9fff] px-4 py-2.5 text-sm font-bold text-[#0f1115]"
              >
                {stock.name}
                <span className="font-normal opacity-60">×</span>
              </button>
            ))}
          </div>
          <p className="mb-0 mt-3 text-xs text-[#9aa3b2]">
            ×를 누르면 종목을 뺄 수 있어요. 최대 10개까지 담을 수 있어요.
          </p>
        </div>
        {error && (
          <p role="alert" className="mt-5 text-sm text-[#f0a868]">
            {error}
          </p>
        )}
        <form onSubmit={submit}>
          <button
            type="submit"
            disabled={!changed || submitting}
            className="mt-12 h-14 w-full rounded-lg border-0 bg-[#4d9fff] text-base font-bold text-[#0f1115] transition hover:bg-[#71b0ff] disabled:bg-[#2e4c70] disabled:text-[#8c9db1]"
          >
            {submitting ? "저장 중..." : "변경사항 저장하기"}
          </button>
        </form>
      </section>
    </div>
  );
}
