import { useState, useRef, useEffect } from "react";


type MarketTab = "국내" | "해외";

interface Stock {
  id: string;
  name: string;
}

// TODO: 실제로는 검색 API로 종목을 조회 (여기서는 추가 가능한 종목 풀만 예시로 정의)
const AVAILABLE_STOCKS: Stock[] = [
  { id: "005930", name: "삼성전자" },
  { id: "000660", name: "SK하이닉스" },
  { id: "005380", name: "현대차" },
  { id: "035420", name: "NAVER" },
  { id: "035720", name: "카카오" },
  { id: "005935", name: "삼성전자우" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<MarketTab>("국내");

  // 등록된 종목이 없는 디폴트 상태로 시작
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const addMenuRef = useRef<HTMLDivElement>(null);

  // 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        addMenuRef.current &&
        !addMenuRef.current.contains(e.target as Node)
      ) {
        setIsAddMenuOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // TODO: 종목 클릭 시 공시 / 유튜브 / 기타 정보 카테고리 패널 + 각 API 연결
  const handleSelectStock = (stockId: string) => {
    setSelectedStock(stockId);
  };

  const handleAddStock = (stock: Stock) => {
    setStocks((prev) => [...prev, stock]);
    setSelectedStock(stock.id);
    setIsAddMenuOpen(false);
    setQuery("");
  };

  const handleRemoveStock = (stockId: string) => {
    setStocks((prev) => prev.filter((s) => s.id !== stockId));
    if (selectedStock === stockId) {
      setSelectedStock(null);
    }
  };

  const addedIds = new Set(stocks.map((s) => s.id));
  const candidates = AVAILABLE_STOCKS.filter(
    (s) => !addedIds.has(s.id) && s.name.toLowerCase().includes(query.toLowerCase())
  );

  const currentStock = stocks.find((s) => s.id === selectedStock);
  const hasStocks = stocks.length > 0;

  return (
    <div className="min-h-screen bg-[#0A0B10] text-white font-sans">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <span className="text-2xl font-extrabold tracking-tight">
          <span className="text-[#3B82F6]">a</span>
          <span className="text-white">ssit</span>
        </span>

        <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-[#3B82F6] text-white hover:bg-[#2f6fe0] transition-colors">
          로그인
        </button>
      </header>

      {/* 국내 / 해외 탭 */}
      <nav className="flex items-center gap-2 px-6 pt-4">
        {(["국내", "해외"] as MarketTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === tab
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* 종목 칩 리스트 */}
      <div className="flex items-center gap-2 px-6 py-4 flex-wrap">
        {stocks.map((stock) => (
          <div
            key={stock.id}
            className={`group flex items-center gap-1.5 pl-4 pr-2 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedStock === stock.id
                ? "bg-[#3B82F6] border-[#3B82F6] text-white"
                : "bg-transparent border-white/15 text-gray-300 hover:border-white/30"
            }`}
          >
            <button onClick={() => handleSelectStock(stock.id)}>
              {stock.name}
            </button>
            <button
              onClick={() => handleRemoveStock(stock.id)}
              className={`rounded-full p-0.5 transition-colors ${
                selectedStock === stock.id
                  ? "hover:bg-white/20"
                  : "hover:bg-white/10"
              }`}
              aria-label={`${stock.name} 삭제`}
            >
              <span className="w-3 h-3">✕</span>
            </button>
          </div>
        ))}

        {/* 종목 추가 버튼 + 드롭다운 */}
        <div className="relative" ref={addMenuRef}>
          <button
            onClick={() => setIsAddMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium border border-dashed border-white/25 text-gray-300 hover:border-white/40 hover:text-white transition-colors"
          >
            <span>+</span>
            종목 추가
          </button>

          {isAddMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-56 rounded-lg border border-white/10 bg-[#12131A] shadow-xl z-10 overflow-hidden">
              <div className="p-2 border-b border-white/5">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="종목명 검색"
                  className="w-full px-2.5 py-1.5 rounded-md bg-white/5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-[#3B82F6]"
                />
              </div>
              <div className="max-h-56 overflow-y-auto">
                {candidates.length > 0 ? (
                  candidates.map((stock) => (
                    <button
                      key={stock.id}
                      onClick={() => handleAddStock(stock)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                    >
                      {stock.name}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-3 text-xs text-gray-600">
                    검색 결과가 없어요
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {!hasStocks && (
          <span className="text-xs text-gray-600">등록된 종목이 없어요</span>
        )}
      </div>

      {/* 메인 영역 - 종목 미등록 시 안내, 등록 시 공시/유튜브/기타 카테고리 + API 연동 예정 */}
      <main className="px-6 py-10 border-t border-white/5">
        {hasStocks && currentStock ? (
          <>
            <p className="text-sm text-gray-400">
              선택된 종목:{" "}
              <span className="text-white font-semibold">
                {currentStock.name}
              </span>
            </p>
            <p className="text-xs text-gray-600 mt-2">
              공시 / 유튜브 / 기타 정보 카테고리는 추후 API 연동 후 이곳에
              표시됩니다.
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            관심 종목을 추가하면 공시, 유튜브, 기타 정보를 이곳에서 확인할
            수 있어요.
          </p>
        )}
      </main>
    </div>
  );
}
