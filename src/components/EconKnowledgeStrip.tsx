import { useEffect, useRef, useState } from "react";
import { ApiError, getApi, postApi } from "../api/client";
import type { TermExplainResponse } from "../types/card";
import type {
  EconCardDetailResponse,
  EconCardItem,
  EconCardListResponse,
} from "../types/econCard";

const mockDefaultSources = [
  {
    number: 1,
    org: "한국은행",
    doc_title: "경제금융용어 및 경제교육 자료",
    url: "https://www.bok.or.kr",
  },
  {
    number: 2,
    org: "금융위원회",
    doc_title: "금융정책 자료",
    url: "https://www.fsc.go.kr",
  },
];

function sourceHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "원문 보기";
  }
}

const mockEconCards: EconCardDetailResponse[] = [
  {
    id: -1,
    title: "산업을 지원하는 법은 언제 효과가 나타날까요?",
    body: "산업 지원 정책은 발표 즉시 모든 효과가 나타나기보다 예산 편성, 사업자 선정, 실제 투자 집행을 거치며 단계적으로 영향을 줘요. 정책의 효과를 볼 때는 발표 시점뿐 아니라 집행 일정과 대상 기업의 투자 계획도 함께 살펴보는 것이 좋아요.",
    sources: [
      { number: 1, org: "산업연구원", doc_title: "산업 정책 연구자료", url: "https://www.kiet.re.kr" },
      { number: 2, org: "기획재정부", doc_title: "경제정책 자료", url: "https://www.moef.go.kr" },
    ],
  },
  {
    id: -2,
    title: "주가가 비싸면 큰 회사일까요?",
    body: "주가 한 주의 가격만으로 회사의 크기를 비교하기는 어려워요. 회사의 시장 가치는 보통 주가에 전체 발행 주식 수를 곱한 시가총액으로 비교해요.",
    sources: [
      { number: 1, org: "자본시장연구원", doc_title: "자본시장 연구자료", url: "https://www.kcmi.re.kr" },
      { number: 2, org: "금융위원회", doc_title: "자본시장 제도자료", url: "https://www.fsc.go.kr" },
    ],
  },
  {
    id: -3,
    title: "주식을 공짜로 주는데 왜 재산은 그대로일까요?",
    body: "무상증자는 보유 주식 수를 늘리지만 그만큼 주당 가격이 조정될 수 있어요. 주식 수가 늘었다는 사실만으로 전체 투자 가치가 같은 비율로 증가하는 것은 아니에요.",
    sources: mockDefaultSources,
  },
  {
    id: -4,
    title: "금리는 누가 어떻게 결정할까요?",
    body: "중앙은행은 물가와 경기, 금융 안정 등을 고려해 기준금리를 결정해요. 기준금리 변화는 예금과 대출 금리, 소비와 투자에 걸쳐 점차 영향을 줘요.",
    sources: mockDefaultSources,
  },
  {
    id: -5,
    title: "환율이 오르면 수출 기업은 항상 유리할까요?",
    body: "환율 상승은 수출 대금의 원화 환산액을 늘릴 수 있지만 원재료 수입 비용과 외화 부채 부담도 키울 수 있어요. 기업마다 매출과 비용 구조가 달라 영향을 따로 확인해야 해요.",
    sources: mockDefaultSources,
  },
  {
    id: -6,
    title: "물가가 오르면 현금의 가치는 어떻게 될까요?",
    body: "같은 금액으로 살 수 있는 상품과 서비스가 줄어들면 현금의 실질 구매력은 낮아져요. 자산의 수익률을 볼 때 물가 상승률을 함께 보는 이유예요.",
    sources: mockDefaultSources,
  },
  {
    id: -7,
    title: "배당을 받으면 주가는 왜 조정될까요?",
    body: "회사가 주주에게 현금을 배당하면 기업 안에 남아 있는 자산이 그만큼 줄어요. 배당락일에는 이 변화를 반영해 주가가 이론적으로 조정될 수 있어요.",
    sources: mockDefaultSources,
  },
  {
    id: -8,
    title: "국채 금리가 오르면 주식에는 어떤 영향이 있을까요?",
    body: "국채 금리가 오르면 상대적으로 안전한 자산의 기대수익이 높아지고 기업의 자금 조달 비용도 커질 수 있어요. 다만 경기 상황과 업종에 따라 주식시장 반응은 달라져요.",
    sources: mockDefaultSources,
  },
  {
    id: -9,
    title: "기업이 자사주를 사면 무엇이 달라질까요?",
    body: "자사주 매입은 시장에 유통되는 주식 수를 줄이고 주당 지표에 영향을 줄 수 있어요. 실제 효과는 매입 목적과 소각 여부, 기업의 재무 상태에 따라 달라져요.",
    sources: mockDefaultSources,
  },
  {
    id: -10,
    title: "경기가 좋아져도 모든 업종이 함께 오를까요?",
    body: "업종마다 경기 변화에 반응하는 시점과 정도가 달라요. 소비, 금리, 원자재 가격처럼 각 업종에 중요한 조건을 함께 살펴봐야 해요.",
    sources: mockDefaultSources,
  },
];

function EconCardButton({
  card,
  onOpen,
  duplicate = false,
}: {
  card: EconCardItem;
  onOpen: (card: EconCardItem) => void;
  duplicate?: boolean;
}) {
  return (
    <button
      type="button"
      tabIndex={duplicate ? -1 : 0}
      onClick={() => onOpen(card)}
      className="flex h-[200px] w-[315px] shrink-0 snap-start flex-col justify-between rounded-[18px] border border-[#303744] bg-[#1c2029] px-6 py-7 text-left transition duration-200 hover:-translate-y-1 hover:border-[#4d9fff]/60 hover:bg-[#202530] focus-visible:outline-offset-[-2px]"
    >
      <strong className="line-clamp-3 text-[21px] leading-[1.45] font-bold tracking-[-0.035em] text-[#f2f3f5]">
        {card.title}
      </strong>
      <span className="inline-flex items-center gap-2 text-sm font-bold text-[#6fa8ff]">
        자세히 보기
        <span aria-hidden="true" className="text-lg leading-none">
          ›
        </span>
      </span>
    </button>
  );
}

function EconCardDialog({
  card,
  detail,
  loading,
  error,
  onClose,
}: {
  card: EconCardItem;
  detail: EconCardDetailResponse | null;
  loading: boolean;
  error: string;
  onClose: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [termLoading, setTermLoading] = useState(false);
  const [termError, setTermError] = useState("");
  const [termResponse, setTermResponse] = useState<TermExplainResponse | null>(
    null,
  );
  const [popoverPosition, setPopoverPosition] = useState({ left: 16, top: 16 });

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const explainTerm = async (term: string) => {
    if (!detail) return;
    const requestId = ++requestRef.current;
    setTermLoading(true);
    setTermError("");
    setTermResponse(null);
    try {
      let response: TermExplainResponse;
      try {
        response = await postApi<TermExplainResponse>("/terms/explain", {
          term,
          tab: "econ",
          context: detail.body,
        });
      } catch (error) {
        if (!(error instanceof ApiError) || error.code !== "invalid_tab") {
          throw error;
        }
        response = await postApi<TermExplainResponse>("/terms/explain", {
          term,
          tab: "bok",
          context: detail.body,
        });
      }
      if (requestId === requestRef.current) setTermResponse(response);
    } catch (termRequestError) {
      if (requestId !== requestRef.current) return;
      if (termRequestError instanceof ApiError) {
        setTermError(termRequestError.message);
      } else {
        setTermError("용어 설명을 불러오지 못했어요.");
      }
    } finally {
      if (requestId === requestRef.current) setTermLoading(false);
    }
  };

  const scheduleSelectedTermCapture = () => {
    window.setTimeout(captureSelectedTerm, 0);
  };

  const captureSelectedTerm = () => {
    const selection = window.getSelection();
    const container = bodyRef.current;
    if (!selection || selection.isCollapsed || !container) return;
    const range = selection.getRangeAt(0);
    const selectedNode = range.commonAncestorContainer;
    const selectedElement =
      selectedNode.nodeType === Node.ELEMENT_NODE
        ? (selectedNode as Element)
        : selectedNode.parentElement;
    if (!selectedElement || !container.contains(selectedElement)) return;

    const term = selection.toString().trim().replace(/\s+/g, " ");
    if (!term) return;
    if (term.length > 50) {
      setSelectedTerm(term.slice(0, 50));
      setTermResponse(null);
      setTermError("용어는 50자 이내로 선택해주세요.");
      return;
    }
    const selectionRect = range.getBoundingClientRect();
    const popoverWidth = Math.min(420, window.innerWidth - 32);
    const left = Math.min(
      Math.max(16, selectionRect.left + selectionRect.width / 2 - popoverWidth / 2),
      window.innerWidth - popoverWidth - 16,
    );
    const estimatedHeight = 230;
    const top =
      selectionRect.bottom + 12 + estimatedHeight <= window.innerHeight
        ? selectionRect.bottom + 12
        : Math.max(16, selectionRect.top - estimatedHeight - 12);
    setPopoverPosition({ left, top });
    setSelectedTerm(term);
    void explainTerm(term);
  };

  const paragraphs = detail?.body.split(/\n\s*\n/).filter(Boolean) ?? [];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-6 backdrop-blur-[2px] max-[640px]:p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="econ-card-title"
        className="relative h-[calc(100vh-72px)] w-full max-w-[640px] overflow-y-auto rounded-[20px] border border-[#35425c] bg-[#1d2029] px-10 pb-10 pt-10 shadow-[0_28px_90px_rgba(0,0,0,.6)] max-[640px]:h-[calc(100vh-24px)] max-[640px]:rounded-2xl max-[640px]:px-5 max-[640px]:pb-7 max-[640px]:pt-8"
      >
        <button
          type="button"
          aria-label="경제 상식 닫기"
          onClick={onClose}
          className="absolute right-9 top-8 grid size-11 place-items-center border-0 bg-transparent text-[38px] font-light text-[#9da6b5] transition hover:text-white max-[640px]:right-3 max-[640px]:top-2"
        >
          ×
        </button>
        <h2
          id="econ-card-title"
          className="mb-0 mr-14 text-[32px] leading-[1.28] font-bold tracking-[-0.045em] text-[#f4f5f7] max-[640px]:text-[28px]"
        >
          {card.title}
        </h2>

        {loading ? (
          <div className="mt-12 space-y-3" aria-label="경제 상식 불러오는 중">
            <div className="h-4 animate-pulse rounded bg-[#2a2f39]" />
            <div className="h-4 animate-pulse rounded bg-[#2a2f39]" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-[#2a2f39]" />
          </div>
        ) : error ? (
          <p className="mb-0 mt-12 text-sm text-[#f0a868]">{error}</p>
        ) : detail ? (
          <>
            <div
              ref={bodyRef}
              onPointerUp={scheduleSelectedTermCapture}
              onKeyUp={scheduleSelectedTermCapture}
              className="mt-9 border-y border-[#3a3e48] py-7 text-[17px] leading-[1.9] tracking-[-0.025em] text-[#f0f1f4] max-[640px]:mt-8 max-[640px]:py-7"
            >
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="mb-6 mt-0 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
            <p className="mb-0 mt-8 text-[18px] text-[#9aacc8] max-[640px]:text-sm">
              모르는 단어를 드래그하면 뜻을 알려드려요
            </p>
            {detail.sources.length > 0 && (
              <div className="mt-12">
                <h3 className="m-0 text-[19px] font-bold text-[#a7b7d0]">
                  원문 출처
                </h3>
                <ol className="mb-0 mt-5 space-y-4 p-0">
                  {detail.sources.map((source) => (
                    <li
                      key={`${source.number}-${source.url}`}
                      className="flex items-center gap-6 rounded-[20px] bg-[#151820] px-7 py-5 max-[640px]:gap-4 max-[640px]:px-4"
                    >
                      <strong className="text-xl text-[#6798ff]">
                        {source.number}
                      </strong>
                      <div className="min-w-0 flex-1">
                        <strong className="block text-[18px] text-white">
                          {source.org}
                        </strong>
                        <span className="mt-1 block text-[15px] text-[#9fb0cc]">
                          {source.doc_title}
                        </span>
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${source.org} 원문 열기`}
                        className="inline-flex shrink-0 items-center gap-3 text-[15px] text-[#a8b8d2] no-underline transition hover:text-[#6fa8ff]"
                      >
                        <span className="max-[640px]:hidden">
                          {sourceHostname(source.url)}
                        </span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <p className="mb-0 mt-12 rounded-[16px] bg-[#273044] px-7 py-6 text-[17px] leading-7 text-[#9db0cf] max-[640px]:px-5 max-[640px]:py-4 max-[640px]:text-sm">
              위 자료를 바탕으로 assit이 정리한 설명이에요.<br />
              구체적인 수치는 각 출처 탭에서 확인해 주세요.
            </p>
          </>
        ) : null}
      </section>

      {selectedTerm && (
        <aside
          role="status"
          onMouseDown={(event) => event.stopPropagation()}
          style={{ left: popoverPosition.left, top: popoverPosition.top }}
          className="fixed z-[80] w-[min(420px,calc(100vw-32px))] rounded-[16px] border border-[#3c424e] bg-[#282c36] px-6 py-5 shadow-[0_24px_80px_rgba(0,0,0,.55)] max-[640px]:px-5 max-[640px]:py-5"
        >
          <button
            type="button"
            aria-label="용어 설명 닫기"
            onClick={() => setSelectedTerm("")}
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border-0 bg-[#343945] text-2xl text-[#c3cad5]"
          >
            ×
          </button>
          <div className="flex items-center gap-4 pr-10">
            <strong className="text-xl text-white">{selectedTerm}</strong>
            <span className="rounded-xl bg-[#35486c] px-3 py-1.5 text-xs font-bold text-[#70a5ff]">
              경제 상식 맥락
            </span>
          </div>
          {termLoading && (
            <p className="mb-0 mt-5 text-[15px] text-[#bbc3cf]">
              쉬운 설명을 불러오고 있어요...
            </p>
          )}
          {termResponse && (
            <>
              <p className="mb-0 mt-5 text-[16px] leading-7 text-[#d7dbe2]">
                {termResponse.explanation ?? "이 용어는 현재 설명하기 어려워요."}
              </p>
              <p className="mb-0 mt-6 text-xs text-[#959dab]">
                이 카드에 맞춰 설명한 내용이에요
              </p>
            </>
          )}
          {termError && (
            <p role="alert" className="mb-0 mt-5 text-sm text-[#f0a868]">
              {termError}
            </p>
          )}
        </aside>
      )}
    </div>
  );
}

export function EconKnowledgeStrip() {
  const [cards, setCards] = useState<EconCardItem[]>([]);
  const [selectedCard, setSelectedCard] = useState<EconCardItem | null>(null);
  const [detail, setDetail] = useState<EconCardDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadCards = async () => {
      try {
        const response = await getApi<EconCardListResponse>("/econ-cards");
        if (!cancelled) {
          setCards(
            response.items.length > 0 || !import.meta.env.DEV
              ? response.items
              : mockEconCards,
          );
        }
      } catch {
        if (!cancelled) setCards(import.meta.env.DEV ? mockEconCards : []);
      }
    };
    void loadCards();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCard = async (card: EconCardItem) => {
    setSelectedCard(card);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    const mockDetail = mockEconCards.find((item) => item.id === card.id);
    if (mockDetail) {
      setDetail(mockDetail);
      setDetailLoading(false);
      return;
    }
    try {
      const response = await getApi<EconCardDetailResponse>(
        `/econ-card/${card.id}`,
      );
      setDetail(response);
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "경제 상식을 불러오지 못했습니다.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  if (cards.length === 0) return null;

  return (
    <>
      <section
        aria-labelledby="econ-knowledge-title"
        className="econ-knowledge -mx-6 overflow-hidden border-b border-[#20242c] bg-[#0f1115] pb-8 pt-7"
      >
        <div className="flex items-center gap-5 px-6 max-[760px]:items-start max-[760px]:gap-2 max-[760px]:px-[18px]">
          <h2
            id="econ-knowledge-title"
            className="m-0 shrink-0 text-sm font-bold text-[#6fa8ff]"
          >
            알아두면 좋은 경제 상식
          </h2>
          <p className="m-0 text-sm text-[#9aa3b2] max-[760px]:text-xs max-[760px]:leading-5">
            2시간마다 10개가 새로 올라와요 · 왼쪽으로 계속 흘러가고,
            마우스를 올리면 멈춰요
          </p>
        </div>

        <div className="relative mt-4">
          <div className="econ-knowledge__viewport overflow-hidden max-[760px]:overflow-x-auto max-[760px]:px-[18px] max-[760px]:[scrollbar-width:none] max-[760px]:[&::-webkit-scrollbar]:hidden">
            <div className="econ-knowledge__track flex w-max gap-7">
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  className="flex gap-7"
                  aria-hidden={copy === 1 ? "true" : undefined}
                >
                  {cards.map((card) => (
                    <EconCardButton
                      key={`${copy}-${card.id}`}
                      card={card}
                      onOpen={openCard}
                      duplicate={copy === 1}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-[60px] bg-gradient-to-r from-[#0f1115] to-transparent max-[760px]:hidden"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-[120px] bg-gradient-to-l from-[#0f1115] to-transparent max-[760px]:hidden"
          />
        </div>
      </section>

      {selectedCard && (
        <EconCardDialog
          card={selectedCard}
          detail={detail}
          loading={detailLoading}
          error={detailError}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  );
}
