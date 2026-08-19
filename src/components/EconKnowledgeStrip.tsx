import { useEffect, useRef, useState } from "react";
import { ApiError, getApi, postApi } from "../api/client";
import type { TermExplainResponse } from "../types/card";
import type {
  EconCardDetailResponse,
  EconCardItem,
  EconCardListResponse,
} from "../types/econCard";

function sourceHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "원문 보기";
  }
}

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
        if (!cancelled) setCards(response.items);
      } catch {
        if (!cancelled) setCards([]);
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
