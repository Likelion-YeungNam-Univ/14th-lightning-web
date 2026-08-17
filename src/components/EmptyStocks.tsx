/**
 * GET /me/stocks?market= 결과가 빈 배열일 때 시장별 빈 상태를 표시한다.
 * 해외 시장은 기본 종목이 없으므로 첫 진입 시 이 화면이 정상적으로 나타날 수 있다.
 */
type EmptyStocksProps = {
  market: string;
  onAddStock: () => void;
};

export function EmptyStocks({ market, onAddStock }: EmptyStocksProps) {
  // 국내와 해외는 제공되는 출처가 달라 안내 문구도 시장에 맞게 분리한다.
  const overseas = market === "overseas";

  return (
    <section className="flex min-h-[calc(100vh-216px)] flex-col items-center justify-center px-6 pb-32 pt-16 text-center">
      <div
        aria-hidden="true"
        className="relative grid size-16 place-items-center rounded-full border border-[#4d9fff]/30 bg-[#4d9fff]/10"
      >
        <span className="text-2xl font-light text-[#4d9fff]">＋</span>
        <span className="absolute -bottom-1 -right-1 size-5 rounded-full border-4 border-[#0f1115] bg-[#4d9fff]" />
      </div>
      <span className="mt-6 text-[11px] font-bold tracking-[0.14em] text-[#4d9fff]">
        {overseas ? "OVERSEAS STOCKS" : "MY STOCKS"}
      </span>
      <h1 className="mb-0 mt-3 text-[22px] font-bold tracking-[-0.05em] text-[#f2f3f5]">
        아직 담아둔 {overseas ? "해외 " : ""}종목이 없어요
      </h1>
      <p className="mb-0 mt-3 max-w-[520px] text-sm leading-6 text-[#c8ccd4]">
        종목을 담으면 유튜브·공시·규제 동향
        {/* 한국은행 탭이 없는 해외 시장에는 금리 소식 문구를 붙이지 않는다. */}
        {!overseas && "·금리 소식"}을 한자리에서 볼 수 있어요.
      </p>
      {/* 종목 검색과 선택을 진행할 수 있도록 AddStockModal을 연다. */}
      <button
        type="button"
        onClick={onAddStock}
        className="mt-6 min-h-12 rounded-lg bg-[#4d9fff] px-7 text-sm font-bold text-[#0f1115] transition duration-200 hover:-translate-y-0.5 hover:bg-[#71b0ff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4d9fff]"
      >
        종목 담으러 가기
      </button>
      {/* 국내는 확정된 10개 상한을, 해외는 화이트리스트 검색 안내를 표시한다. */}
      <p className="mb-0 mt-3 text-xs text-[#727c8b]">
        {overseas
          ? "지원되는 해외 종목은 검색에서 확인할 수 있어요."
          : "관심 종목은 시장별로 최대 10개까지 담을 수 있어요."}
      </p>
    </section>
  );
}
