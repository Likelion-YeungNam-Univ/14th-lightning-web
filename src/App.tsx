import { useState } from "react";

type MarketTab = "해외" | "국내";
type Period = "오늘" | "이번 주" | "이번 달";

interface VideoCard {
  id: string;
  rank: number;
  title: string;
  channel: string;
  views: string;
  uploadedAt: string;
  duration: string;
}

const STOCK_PILLS = ["삼성전자", "SK하이닉스", "삼성전자우", "SK스퀘어"];
const KEYWORD_PILLS = ["유튜브랭킹", "공시(DART)", "국제 동향", "한국은행", "미국 Fed", "저널일"];

const CARDS: VideoCard[] = [
  {
    id: "1",
    rank: 1,
    title: "원본 영상 제목, 두 줄을 넘어갈 시 ...으로 처리, 두 줄을 넘어갈 시 ...으로 처리",
    channel: "채널명",
    views: "xx.x만",
    uploadedAt: "x일 전",
    duration: "xx:xx",
  },
  {
    id: "2",
    rank: 2,
    title: "원본 영상 제목, 두 줄을 넘어갈 시 ...으로 처리, 두 줄을 넘어갈 시 ...으로 처리",
    channel: "채널명",
    views: "xx.x만",
    uploadedAt: "x일 전",
    duration: "xx:xx",
  },
];

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5z" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function VideoCardItem({ card }: { card: VideoCard }) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-video bg-gradient-to-br from-slate-700 to-slate-900">
        <span
          className={`absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-bold text-white ${
            card.rank === 1 ? "bg-blue-500" : "bg-slate-400"
          }`}
        >
          {card.rank}위
        </span>
        <button
          aria-label="즐겨찾기 추가"
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded bg-slate-900/55 text-white hover:bg-slate-900/80"
        >
          <StarIcon />
        </button>
        <span className="absolute bottom-2 right-2 rounded bg-slate-900/75 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {card.duration}
        </span>
      </div>
      <div className="p-3">
        <p className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{card.title}</p>
        <p className="mb-0.5 text-xs font-medium text-slate-600">{card.channel}</p>
        <p className="text-xs text-slate-400">
          조회수 {card.views}회 · {card.uploadedAt}
        </p>
      </div>
    </article>
  );
}

export default function App() {
  const [marketTab, setMarketTab] = useState<MarketTab>("해외");
  const [activeStock, setActiveStock] = useState("삼성전자");
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("이번 주");

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      {/* 상단바 */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500 text-sm font-bold">a</span>
          <span className="text-sm font-bold">
            assit <span className="ml-1.5 text-xs font-normal text-slate-400">asset + insight</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="mr-1 text-xs text-slate-400">업데이트: 오전 08:20:47</span>
          <button className="flex items-center gap-1.5 rounded-md border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> 새로고침
          </button>
          <button className="rounded-md bg-blue-500 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-600">
            로그인
          </button>
        </div>
      </header>

      {/* 해외/국내 탭 */}
      <nav className="flex gap-1 border-b border-slate-800 bg-slate-950 px-6">
        {(["해외", "국내"] as MarketTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setMarketTab(tab)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
              marketTab === tab ? "border-blue-500 text-white" : "border-transparent text-slate-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-5">
        {/* 종목 필터 */}
        <div className="mb-3 flex flex-wrap gap-2">
          {STOCK_PILLS.map((stock) => (
            <button
              key={stock}
              onClick={() => setActiveStock(stock)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                activeStock === stock
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {stock}
            </button>
          ))}
          <button
            aria-label="종목 추가"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400"
          >
            <PlusIcon />
          </button>
        </div>

        {/* 키워드 필터 + 정렬/기간 */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex flex-1 flex-wrap gap-2">
            {KEYWORD_PILLS.map((kw) => (
              <button
                key={kw}
                onClick={() => setActiveKeyword(activeKeyword === kw ? null : kw)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                  activeKeyword === kw
                    ? "border-blue-500 bg-blue-50 text-blue-500"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {kw}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600">
              조회수순 <ChevronIcon />
            </button>
            <div className="flex overflow-hidden rounded-md border border-slate-200 bg-white">
              {(["오늘", "이번 주", "이번 달"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3.5 py-1.5 text-sm font-medium ${
                    period === p ? "bg-blue-500 text-white" : "text-slate-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 카드 그리드 */}
        <section className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {CARDS.map((card) => (
            <VideoCardItem key={card.id} card={card} />
          ))}
        </section>
      </main>
    </div>
  );
}