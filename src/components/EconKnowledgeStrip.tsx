import { useEffect, useState } from "react";
import { getApi } from "../api/client";
import type {
  EconCardDetailResponse,
  EconCardItem,
  EconCardListResponse,
} from "../types/econCard";

const mockEconCards: EconCardDetailResponse[] = [
  {
    id: -1,
    title: "산업을 지원하는 법은 언제 효과가 나타날까요?",
    body: "산업 지원 정책은 발표 즉시 모든 효과가 나타나기보다 예산 편성, 사업자 선정, 실제 투자 집행을 거치며 단계적으로 영향을 줘요. 정책의 효과를 볼 때는 발표 시점뿐 아니라 집행 일정과 대상 기업의 투자 계획도 함께 살펴보는 것이 좋아요.",
    sources: [],
  },
  {
    id: -2,
    title: "주가가 비싸면 큰 회사일까요?",
    body: "주가 한 주의 가격만으로 회사의 크기를 비교하기는 어려워요. 회사의 시장 가치는 보통 주가에 전체 발행 주식 수를 곱한 시가총액으로 비교해요.",
    sources: [],
  },
  {
    id: -3,
    title: "주식을 공짜로 주는데 왜 재산은 그대로일까요?",
    body: "무상증자는 보유 주식 수를 늘리지만 그만큼 주당 가격이 조정될 수 있어요. 주식 수가 늘었다는 사실만으로 전체 투자 가치가 같은 비율로 증가하는 것은 아니에요.",
    sources: [],
  },
  {
    id: -4,
    title: "금리는 누가 어떻게 결정할까요?",
    body: "중앙은행은 물가와 경기, 금융 안정 등을 고려해 기준금리를 결정해요. 기준금리 변화는 예금과 대출 금리, 소비와 투자에 걸쳐 점차 영향을 줘요.",
    sources: [],
  },
  {
    id: -5,
    title: "환율이 오르면 수출 기업은 항상 유리할까요?",
    body: "환율 상승은 수출 대금의 원화 환산액을 늘릴 수 있지만 원재료 수입 비용과 외화 부채 부담도 키울 수 있어요. 기업마다 매출과 비용 구조가 달라 영향을 따로 확인해야 해요.",
    sources: [],
  },
  {
    id: -6,
    title: "물가가 오르면 현금의 가치는 어떻게 될까요?",
    body: "같은 금액으로 살 수 있는 상품과 서비스가 줄어들면 현금의 실질 구매력은 낮아져요. 자산의 수익률을 볼 때 물가 상승률을 함께 보는 이유예요.",
    sources: [],
  },
  {
    id: -7,
    title: "배당을 받으면 주가는 왜 조정될까요?",
    body: "회사가 주주에게 현금을 배당하면 기업 안에 남아 있는 자산이 그만큼 줄어요. 배당락일에는 이 변화를 반영해 주가가 이론적으로 조정될 수 있어요.",
    sources: [],
  },
  {
    id: -8,
    title: "국채 금리가 오르면 주식에는 어떤 영향이 있을까요?",
    body: "국채 금리가 오르면 상대적으로 안전한 자산의 기대수익이 높아지고 기업의 자금 조달 비용도 커질 수 있어요. 다만 경기 상황과 업종에 따라 주식시장 반응은 달라져요.",
    sources: [],
  },
  {
    id: -9,
    title: "기업이 자사주를 사면 무엇이 달라질까요?",
    body: "자사주 매입은 시장에 유통되는 주식 수를 줄이고 주당 지표에 영향을 줄 수 있어요. 실제 효과는 매입 목적과 소각 여부, 기업의 재무 상태에 따라 달라져요.",
    sources: [],
  },
  {
    id: -10,
    title: "경기가 좋아져도 모든 업종이 함께 오를까요?",
    body: "업종마다 경기 변화에 반응하는 시점과 정도가 달라요. 소비, 금리, 원자재 가격처럼 각 업종에 중요한 조건을 함께 살펴봐야 해요.",
    sources: [],
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
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/65 px-4 py-8 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="econ-card-title"
        className="relative max-h-[calc(100vh-64px)] w-full max-w-[680px] overflow-y-auto rounded-2xl border border-[#303744] bg-[#171a21] p-7 shadow-2xl max-[640px]:p-5"
      >
        <button
          type="button"
          aria-label="경제 상식 닫기"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-[#303744] bg-[#202530] text-xl text-[#c8ccd4] transition hover:text-white"
        >
          ×
        </button>
        <span className="text-xs font-bold tracking-[0.08em] text-[#4d9fff]">
          ECONOMY BASICS
        </span>
        <h2
          id="econ-card-title"
          className="mb-0 mr-10 mt-3 text-2xl leading-[1.45] font-bold tracking-[-0.04em] text-[#f2f3f5]"
        >
          {card.title}
        </h2>

        {loading ? (
          <div className="mt-7 space-y-3" aria-label="경제 상식 불러오는 중">
            <div className="h-4 animate-pulse rounded bg-[#2a2f39]" />
            <div className="h-4 animate-pulse rounded bg-[#2a2f39]" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-[#2a2f39]" />
          </div>
        ) : error ? (
          <p className="mb-0 mt-7 text-sm text-[#f0a868]">{error}</p>
        ) : detail ? (
          <>
            <div className="mt-7 whitespace-pre-line text-[15px] leading-7 text-[#d7dae0]">
              {detail.body}
            </div>
            {detail.sources.length > 0 && (
              <div className="mt-8 border-t border-[#303744] pt-5">
                <h3 className="m-0 text-sm font-bold text-[#f2f3f5]">
                  원문 출처
                </h3>
                <ol className="mb-0 mt-3 space-y-2 pl-5 text-sm text-[#9aa3b2]">
                  {detail.sources.map((source) => (
                    <li key={`${source.number}-${source.url}`}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="transition hover:text-[#6fa8ff]"
                      >
                        {source.org} · {source.doc_title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <p className="mb-0 mt-7 text-xs leading-5 text-[#727c8b]">
              공식 자료를 바탕으로 assit이 정리한 설명이에요. 구체적인 수치는
              각 출처 원문에서 확인해 주세요.
            </p>
          </>
        ) : null}
      </section>
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
