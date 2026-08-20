import type { StockListProps } from "../types/stock";
import { useStockReorder } from "../hooks/useStockReorder";
import { displayStockName } from "../utils/stock-name";

/** 등록 종목을 표시하고 선택 및 순서 변경 입력을 처리한다. */
export function StockList({
  editable,
  stocks,
  activeStockCode,
  stocksLoading,
  stocksError,
  onSelectStock,
  onRequireLogin,
  onAddStock,
  onReorderStocks,
  reordering = false,
}: StockListProps) {
  const {
    reorderMode,
    toggleReorderMode,
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleKeyDown,
  } = useStockReorder({ stocks, onReorderStocks, reordering });

  return (
    <section
      aria-label="관심 종목"
      className="-mx-8 flex min-h-[62px] flex-col items-center justify-center gap-0 border-y border-[#20242c] bg-[#12151b] px-6 py-[18px] max-[760px]:px-[18px]"
    >
      <div className="flex w-full items-center gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stocksLoading ? (
          <>
            <span className="h-11 w-24 shrink-0 animate-pulse rounded-full bg-[#1c2029]" />
            <span className="h-11 w-24 shrink-0 animate-pulse rounded-full bg-[#1c2029]" />
            <span className="h-11 w-24 shrink-0 animate-pulse rounded-full bg-[#1c2029]" />
          </>
        ) : (
          // useStocks가 display_order 기준으로 정렬한 종목을 표시한다.
          stocks.map((stock, index) => {
            const displayName = displayStockName(stock);
            return (
              <div
                key={stock.stock_code}
                draggable={reorderMode && !reordering}
                onDragStart={(event) => handleDragStart(event, index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragOver={handleDragOver}
                onDrop={(event) => handleDrop(event, index)}
                onDragEnd={handleDragEnd}
                className={`shrink-0 rounded-full transition-all ${
                  reorderMode ? "cursor-grab active:cursor-grabbing" : ""
                } ${draggedIndex === index ? "opacity-40" : "opacity-100"} ${
                  dragOverIndex === index
                    ? "ring-2 ring-[#4d9fff] ring-offset-2 ring-offset-[#12151b]"
                    : ""
                }`}
              >
                <button
                  type="button"
                  aria-pressed={activeStockCode === stock.stock_code}
                  aria-label={
                    reorderMode
                      ? `${displayName} 종목. 드래그하여 순서 변경`
                      : displayName
                  }
                  onClick={() => {
                    // 순서 변경 중에는 클릭으로 활성 종목이 바뀌지 않게 한다.
                    if (!reorderMode) onSelectStock(stock.stock_code);
                  }}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  className={`h-11 shrink-0 whitespace-nowrap rounded-full border px-[18px] text-sm font-bold transition-colors duration-[180ms] ease-[cubic-bezier(.23,1,.32,1)] ${
                    reorderMode
                      ? "border-[#4d9fff]/60 bg-[#203651] text-[#79b8ff]"
                      : activeStockCode === stock.stock_code
                        ? "border-[#4d9fff] bg-[#4d9fff] text-[#07111f]"
                        : "border-[#222832] bg-[#171b22] text-[#8fa1b8] hover:border-[#344152] hover:bg-[#1c222c] hover:text-[#d9e4f2]"
                  }`}
                >
                  {reorderMode && (
                    <span aria-hidden="true" className="mr-1.5">
                      ⋮⋮
                    </span>
                  )}
                  {displayName}
                </button>
              </div>
            );
          })
        )}

        {/* 종목이 두 개 이상이고 저장 콜백이 연결된 경우에만 순서 변경을 제공한다. */}
        {!stocksLoading && stocks.length > 1 && (onReorderStocks || !editable) && (
          <button
            type="button"
            aria-pressed={reorderMode}
            onClick={editable ? toggleReorderMode : onRequireLogin}
            disabled={reordering}
            className={`h-11 shrink-0 whitespace-nowrap rounded-full border px-[18px] text-sm font-bold transition-colors ${
              reorderMode
                ? "border-[#4d9fff]/70 bg-[#203651] text-[#79b8ff]"
                : "border-[#303846] bg-[#171b22] text-[#9aa3b2] hover:text-[#f2f3f5]"
            } disabled:opacity-50`}
          >
            {reordering
              ? "저장 중..."
              : reorderMode
                ? "순서 변경 완료"
                : "순서 변경"}
          </button>
        )}

        {/* 순서 변경 중에는 종목 추가로 목록이 달라지지 않도록 버튼을 비활성화한다. */}
        {!stocksLoading && (
          <button
            type="button"
            onClick={onAddStock}
            disabled={!onAddStock || reorderMode}
            className="h-11 shrink-0 whitespace-nowrap rounded-full border border-dashed border-[#4d9fff]/80 bg-transparent px-[18px] text-sm font-bold text-[#4d9fff] transition-colors duration-[180ms] ease-[cubic-bezier(.23,1,.32,1)] hover:bg-[#172334] disabled:cursor-default disabled:opacity-50"
          >
            ＋ 종목 추가
          </button>
        )}

        {/* 조회는 성공했지만 현재 시장에 등록된 종목이 없는 상태를 표시한다. */}
        {!stocksLoading && stocks.length === 0 && !stocksError && (
          <span className="shrink-0 text-xs text-[#9aa3b2]">
            등록된 종목이 없어요.
          </span>
        )}
      </div>

      {/* 드래그 모드임을 사용자에게 알리고 키보드 조작 방법도 안내한다. */}
      {reorderMode && !reordering && (
        <p className="mt-2 text-xs text-[#788292]">
          종목을 원하는 위치로 드래그하세요. 키보드에서는 좌우 방향키를 사용할
          수 있습니다.
        </p>
      )}
      {/* GET /me/stocks 조회 실패 메시지는 빈 목록 안내와 구분하여 표시한다. */}
      {stocksError && (
        <p role="status" className="mt-2 text-xs text-[#f0a868]">
          종목 정보를 불러오지 못했습니다: {stocksError}
        </p>
      )}
    </section>
  );
}
