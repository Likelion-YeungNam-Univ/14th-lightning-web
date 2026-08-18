import type { Card } from "../types/card";
 


type CardFeedProps = {
  cards: Card[];
  tab: string;
  loading: boolean;
  error: string;
  reason: string | null;
  disclaimer: boolean;
  linkSentence: string | null;
  onToggleSave?: (card: Card) => void;
  onOpenCard?: (card: Card) => void;
};

// 유튜브 조회수를 만 단위의 한국어 문구로 변환한다.
function formatViews(value: number | null) {
  if (value === null) return null;
  if (value >= 10000) {
    const views = (value / 10000).toFixed(value >= 100000 ? 1 : 2);
    return `조회수 ${views.replace(/\.0$/, "")}만회`;
  }
  return `조회수 ${value.toLocaleString("ko-KR")}회`;
}

// 카드 발행일을 화면에 표시할 짧은 날짜로 변환한다.
function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// 카드가 없는 이유 코드에 따라 빈 상태 문구를 결정한다.
function emptyMessage(reason: string | null) {
  if (reason === "fetch_failed") {
    return {
      title: "자료를 불러오지 못했어요",
      description:
        "잠시 후 다시 확인해주세요. 다른 출처 탭은 계속 이용할 수 있어요.",
    };
  }
  return {
    title: "아직 표시할 자료가 없어요",
    description: "새로운 자료가 수집되면 이곳에 표시됩니다.",
  };
}

// 백엔드 영향 라벨을 한글 텍스트와 색상 정보로 변환한다.
function labelDisplay(label: string | null) {
  if (label === "positive" || label === "긍정") {
    return { text: "긍정", className: "bg-[#244734] text-[#8dd2a8]" };
  }
  if (label === "negative" || label === "부정") {
    return { text: "부정", className: "bg-[#513b24] text-[#f0bd7a]" };
  }
  if (label === "neutral" || label === "중립") {
    return { text: "중립", className: "bg-[#2c313d] text-[#c8ccd4]" };
  }
  return label
    ? { text: label, className: "bg-[#2c313d] text-[#c8ccd4]" }
    : null;
}

// 카드 목록을 불러오는 동안 고정 개수의 스켈레톤을 표시한다.
function LoadingCards() {
  return (
    <div className="grid grid-cols-5 gap-5 max-[1120px]:grid-cols-3 max-[760px]:grid-cols-1">
      {Array.from({ length: 5 }, (_, index) => (
        <article
          key={index}
          className="overflow-hidden rounded-xl bg-[#1c2029]"
        >
          <div className="h-[180px] animate-pulse bg-[#2a2e36]" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-full animate-pulse rounded bg-[#2a2e36]" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-[#2a2e36]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#2a2e36]" />
          </div>
        </article>
      ))}
    </div>
  );
}

/** GET /cards 응답을 출처별 카드 디자인과 오류·빈 상태로 표시한다. */
export function CardFeed({
  cards,
  tab,
  loading,
  error,
  reason,
  disclaimer,
  linkSentence,
  onToggleSave,
  onOpenCard,
}: CardFeedProps) {
  if (loading)
    return (
      <section aria-label="자료 로딩 중" className="py-5">
        <LoadingCards />
      </section>
    );

  if (error)
    return (
      <section
        role="alert"
        className="my-5 rounded-xl border border-[#634b2f] bg-[#2a2119] px-5 py-6"
      >
        <strong className="text-sm text-[#f0a868]">
          자료를 불러오지 못했습니다.
        </strong>
        <p className="mb-0 mt-2 text-sm text-[#c8ccd4]">{error}</p>
      </section>
    );

  if (cards.length === 0) {
    const message = emptyMessage(reason);
    return (
      <section className="my-5 flex min-h-64 flex-col items-center justify-center rounded-xl border border-[#262c36] bg-[#12151b] px-6 text-center">
        <span className="text-xs font-bold tracking-[0.12em] text-[#4d9fff]">
          PUBLIC SOURCE
        </span>
        <h2 className="mb-2 mt-3 text-xl font-bold">{message.title}</h2>
        <p className="m-0 text-sm text-[#9aa3b2]">{message.description}</p>
      </section>
    );
  }

  return (
    <section className="py-5">
      {disclaimer && (
        <aside className="mb-4 flex items-start gap-3 rounded-lg bg-[#171a21] px-4 py-3 text-sm text-[#c8ccd4]">
          <span aria-hidden="true" className="text-[#4d9fff]">
            ⓘ
          </span>
          <p className="m-0">
            <strong className="text-[#f2f3f5]">
              참고용 · 개인 의견입니다.
            </strong>{" "}
            영상은 개인의 해석을 담고 있어요. 기관 자료와 함께 비교해보세요.
          </p>
        </aside>
      )}
      {linkSentence && (
        <aside className="mb-4 rounded-lg border border-[#2c3644] bg-[#171d26] px-4 py-3">
          <span className="text-xs font-bold text-[#4d9fff]">내 종목엔</span>
          <p className="mb-0 mt-1 text-sm leading-6 text-[#c8ccd4]">
            {linkSentence}
          </p>
        </aside>
      )}
      <div className="grid grid-cols-5 items-start gap-5 max-[1120px]:grid-cols-3 max-[760px]:grid-cols-1">
        {cards.map((card) => {
          const videoCard = tab === "youtube";
          const views = formatViews(card.view_count);
          const publishedAt = formatDate(card.published_at);
          const displayLabel = labelDisplay(card.label);
          return (
            <article
              key={card.card_id}
              tabIndex={0}
              role={onOpenCard ? "button" : undefined}
              onClick={() => onOpenCard?.(card)}
              onKeyDown={(event) => {
                if (
                  onOpenCard &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  onOpenCard(card);
                }
              }}
              className={`group overflow-hidden rounded-xl bg-[#1c2029] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(0,0,0,.35)] focus-visible:outline-2 focus-visible:outline-[#4d9fff] ${onOpenCard ? "cursor-pointer" : ""}`}
            >
              {videoCard && (
                <div className="relative h-[180px] overflow-hidden bg-[#2a2e36]">
                  {card.thumbnail_url ? (
                    <img
                      src={card.thumbnail_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_70%_35%,#46586e_0_10%,transparent_11%),linear-gradient(145deg,#35475b,#252b34)]" />
                  )}
                  <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-[#0f1115]/80 px-3 py-2 text-xs font-bold opacity-0 transition group-hover:opacity-100">
                    <span aria-hidden="true">▶</span> 재생
                  </span>
                  <button
                    type="button"
                    aria-label={
                      card.is_saved ? "즐겨찾기 해제" : "즐겨찾기 추가"
                    }
                    disabled={!onToggleSave}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleSave?.(card);
                    }}
                    className={`absolute right-2 top-2 grid size-9 place-items-center rounded-full border-0 bg-[#0f1115]/60 text-lg transition ${card.is_saved ? "text-[#ffbf00]" : "text-[#c8ccd4] hover:text-[#f2f3f5]"} disabled:cursor-default`}
                  >
                    {card.is_saved ? "★" : "☆"}
                  </button>
                </div>
              )}
              <div className={videoCard ? "p-4" : "min-h-[194px] p-4"}>
                {!videoCard && (
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {displayLabel && (
                        <span
                          className={`rounded-md px-2 py-1 text-[11px] font-bold ${displayLabel.className}`}
                        >
                          {displayLabel.text}
                        </span>
                      )}
                      <span className="rounded-md bg-[#2a2e36] px-2 py-1 text-[11px] font-bold text-[#c8ccd4]">
                        {card.source_name}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label={
                        card.is_saved ? "즐겨찾기 해제" : "즐겨찾기 추가"
                      }
                      disabled={!onToggleSave}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleSave?.(card);
                      }}
                      className={`-mr-1 -mt-1 shrink-0 border-0 bg-transparent px-1 text-lg transition ${card.is_saved ? "text-[#ffbf00]" : "text-[#c8ccd4] hover:text-[#f2f3f5]"} disabled:cursor-default`}
                    >
                      {card.is_saved ? "★" : "☆"}
                    </button>
                  </div>
                )}
                {card.indicator_value && (
                  <strong className="mb-2 block text-lg text-[#4d9fff]">
                    {card.indicator_value}
                  </strong>
                )}
                <h2 className="m-0 line-clamp-2 text-[15px] font-bold leading-[1.45] text-[#f2f3f5]">
                  {card.title}
                </h2>
                {card.channel_name && (
                  <p className="mb-1 mt-2 text-[13px] text-[#c8ccd4]">
                    {card.channel_name}
                  </p>
                )}
                {!videoCard && card.summary_short && (
                  <p className="mb-0 mt-2 line-clamp-3 text-[13px] leading-5 text-[#c8ccd4]">
                    {card.summary_short}
                  </p>
                )}
                {(views || publishedAt) && (
                  <p className="mb-0 mt-2 text-xs text-[#9aa3b2]">
                    {[views, publishedAt].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
