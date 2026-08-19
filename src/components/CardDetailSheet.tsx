import { useEffect, useRef, useState } from "react";
import { ApiError, postApi } from "../api/client";
import type { Card, TermExplainResponse } from "../types/card";
import { youtubeEmbedUrl } from "../utils/youtube";

type CardDetailSheetProps = {
  card: Card;
  tab?: string;
  onClose: () => void;
  onToggleSave: (card: Card) => void;
};

// API 날짜 문자열을 화면에서 사용하는 한국어 날짜로 변환한다.
function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// 영향 라벨에 맞는 판단 근거 제목을 반환한다.
function reasonTitle(label: string | null) {
  if (label === "긍정" || label === "positive") return "왜 긍정일까요?";
  if (label === "부정" || label === "negative") return "왜 부정일까요?";
  return "왜 중립일까요?";
}

// 백엔드의 영문·한글 영향 라벨을 한글 화면 표기로 통일한다.
function labelText(label: string | null) {
  if (label === "positive" || label === "긍정") return "긍정";
  if (label === "negative" || label === "부정") return "부정";
  if (label === "neutral" || label === "중립") return "중립";
  return label;
}

// 용어 풀이 API 오류 코드를 사용자가 이해할 수 있는 메시지로 변환한다.
function termErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "rate_limited") {
      return "요청이 많아요. 잠시 후 다시 선택해주세요.";
    }
    if (error.code === "llm_unavailable") {
      return "지금은 용어 설명을 만들 수 없어요. 잠시 후 다시 시도해주세요.";
    }
    return error.message;
  }
  return error instanceof Error
    ? error.message
    : "용어 설명을 불러오지 못했어요.";
}

// 용어 풀이 출처 식별자를 사용자용 이름으로 변환한다.
function termSourceLabel(source: string) {
  if (source === "bok_700") return "한국은행 경제금융용어 700선";
  if (source === "dart_doctype") return "DART 공시 유형 해설";
  if (source === "sec_formtype") return "SEC 공시 유형 해설";
  return source;
}

/** 카드 목록 응답으로 상세 모달을 표시하고 선택한 용어의 풀이를 요청한다. */
export function CardDetailSheet({
  card,
  tab,
  onClose,
  onToggleSave,
}: CardDetailSheetProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const explanationRequestRef = useRef(0);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const [termLoading, setTermLoading] = useState(false);
  const [termError, setTermError] = useState("");
  const [termResponse, setTermResponse] = useState<TermExplainResponse | null>(
    null,
  );
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

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

  const paragraphs = (card.summary_full ?? card.summary_short ?? "")
    .split(/\n\s*\n/)
    .filter(Boolean);
  const publishedAt = formatDate(card.published_at);
  const videoCard = tab === "youtube";
  const embedUrl = videoCard ? youtubeEmbedUrl(card.origin_url) : null;
  const displayLabel = labelText(card.label);

  const explainTerm = async (term: string) => {
    if (!tab) {
      setTermError("용어 설명에 필요한 탭 정보를 확인하지 못했어요.");
      return;
    }
    const requestId = ++explanationRequestRef.current;
    setTermLoading(true);
    setTermError("");
    setTermResponse(null);
    try {
      const response = await postApi<TermExplainResponse>("/terms/explain", {
        term,
        tab,
        context: card.summary_full ?? card.summary_short,
      });
      if (requestId === explanationRequestRef.current) {
        setTermResponse(response);
      }
    } catch (error) {
      if (requestId === explanationRequestRef.current) {
        setTermError(termErrorMessage(error));
      }
    } finally {
      if (requestId === explanationRequestRef.current) {
        setTermLoading(false);
      }
    }
  };

  const captureSelectedTerm = () => {
    const selection = window.getSelection();
    const container = summaryRef.current;
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
      explanationRequestRef.current += 1;
      setSelectedTerm("");
      setSelectionError("용어는 50자 이내로 선택해주세요.");
      setTermLoading(false);
      setTermError("");
      setTermResponse(null);
      return;
    }
    setSelectionError("");
    setSelectedTerm(term);
    void explainTerm(term);
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/75 p-6 backdrop-blur-[2px] max-[640px]:p-3"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="relative max-h-[calc(100vh-48px)] w-full max-w-237.5 overflow-y-auto rounded-[20px] border border-[#303746] bg-[#1b1f2b] px-10 pb-10 pt-10 shadow-[0_28px_90px_rgba(0,0,0,.55)] max-[640px]:max-h-[calc(100vh-24px)] max-[640px]:rounded-2xl max-[640px]:px-5 max-[640px]:pb-6 max-[640px]:pt-6"
      >
        <button
          type="button"
          aria-label="상세 닫기"
          onClick={onClose}
          className="absolute right-6 top-6 grid size-12 place-items-center rounded-full border-0 bg-[#2a2f3a] text-[28px] font-light text-[#b9c1ce] transition hover:bg-[#343b48] hover:text-white max-[640px]:right-4 max-[640px]:top-4 max-[640px]:size-10"
        >
          ×
        </button>

        <div className="flex flex-wrap items-center gap-2 pr-14">
          <span className="rounded-md bg-[#2a2e36] px-2.5 py-1.5 text-xs font-bold text-[#c8ccd4]">
            {card.source_name}
          </span>
          {displayLabel && (
            <span
              className={`rounded-md px-2.5 py-1.5 text-xs font-bold ${displayLabel === "긍정" ? "bg-[#244734] text-[#8dd2a8]" : displayLabel === "부정" ? "bg-[#513b24] text-[#f0bd7a]" : "bg-[#2c313d] text-[#c8ccd4]"}`}
            >
              {displayLabel}
            </span>
          )}
        </div>
        <h1
          id="card-detail-title"
          className="mb-0 mt-6 max-w-162.5 text-[28px] font-bold leading-[1.38] tracking-[-0.052em] text-[#f4f6fa] max-[640px]:text-2xl"
        >
          {card.title}
        </h1>

        {videoCard && (
          <div
            className="relative mt-6 flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-[#252b34]"
          >
            {isVideoPlaying && embedUrl ? (
              <iframe
                src={embedUrl}
                title={`${card.title} 영상`}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : card.thumbnail_url ? (
              <img
                src={card.thumbnail_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-45"
              />
            ) : null}
            {!isVideoPlaying && (
              <button
                type="button"
                onClick={() => {
                  if (embedUrl) setIsVideoPlaying(true);
                }}
                disabled={!embedUrl}
                className="relative flex items-center gap-2 rounded-full border border-white/15 bg-[#0f1115]/80 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span aria-hidden="true">▶</span> 영상 확인하기
              </button>
            )}
          </div>
        )}

        {card.details && card.details.length > 0 && (
          <div className="mt-6 grid overflow-hidden rounded-[10px] bg-[#282d38] grid-cols-[repeat(auto-fit,minmax(130px,1fr))]">
            {card.details.map((detail, index) => (
              <div
                key={`${detail.label}-${index}`}
                className="min-h-20.5 border-b border-r border-[#343a47] px-4.5 py-4.25"
              >
                <span className="block text-xs text-[#a8b1c0]">
                  {detail.label}
                </span>
                <strong
                  className={`mt-2 block text-[17px] ${index === 0 ? "text-[#4d9fff]" : "text-[#f4f6fa]"}`}
                >
                  {detail.value}
                </strong>
              </div>
            ))}
          </div>
        )}

        {card.indicator_value && (
          <div className="mt-6 rounded-[10px] bg-[#282d38] px-5 py-4">
            <span className="text-xs text-[#a8b1c0]">현재 지표</span>
            <strong className="mt-2 block text-xl text-[#4d9fff]">
              {card.indicator_value}
            </strong>
          </div>
        )}

        <div
          ref={summaryRef}
          onMouseUp={captureSelectedTerm}
          onTouchEnd={captureSelectedTerm}
          className="mt-7 text-[15px] leading-[1.85] text-[#d9dee7]"
        >
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p key={index} className="mb-4 mt-0">
                {paragraph}
              </p>
            ))
          ) : !videoCard ? (
            <p className="text-[#9aa3b2]">제공된 요약 내용이 없습니다.</p>
          ) : null}
        </div>

        {card.label_reason && (
          <aside className="mt-6 rounded-[10px] bg-[#282d38] px-5 py-4.5">
            <strong className="text-xs text-[#aab3c1]">
              {reasonTitle(card.label)}
            </strong>
            <p className="mb-0 mt-2 text-sm leading-6 text-[#d9dee7]">
              {card.label_reason}
            </p>
          </aside>
        )}

        {!videoCard && (
          <p className="mb-0 mt-6 text-xs text-[#9aa3b2]">
            모르는 용어를 드래그하면 쉽게 설명해드려요.
          </p>
        )}

        {selectedTerm && (
          <aside
            role="status"
            className="mt-3 rounded-[10px] border border-[#315b84] bg-[#17283a] px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#79b8ff]">
                선택한 용어
              </span>
              <strong className="text-sm text-[#e6f1ff]">{selectedTerm}</strong>
            </div>
            {termLoading && (
              <p className="mb-0 mt-3 text-sm text-[#b7c6d9]">
                쉬운 설명을 불러오고 있어요...
              </p>
            )}
            {termResponse && (
              <div className="mt-3 border-t border-[#31506d] pt-3">
                <p className="m-0 text-sm leading-6 text-[#e1e8f2]">
                  {termResponse.explanation ??
                    "이 용어는 현재 설명하기 어려워요."}
                </p>
                {termResponse.sources.length > 0 && (
                  <p className="mb-0 mt-2 text-[11px] text-[#8fa9c4]">
                    근거:{" "}
                    {termResponse.sources
                      .map((source) => termSourceLabel(source.source))
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
            {termError && (
              <p role="alert" className="mb-0 mt-3 text-sm text-[#f0a868]">
                {termError}
              </p>
            )}
          </aside>
        )}
        {selectionError && (
          <p role="alert" className="mb-0 mt-3 text-xs text-[#f0a868]">
            {selectionError}
          </p>
        )}

        <footer className="mt-7 flex min-h-14.5 items-center justify-between gap-4 border-t border-[#313744] pt-5 max-[540px]:items-stretch max-[540px]:flex-col">
          <span className="text-[13px] text-[#b4bdca]">
            {[card.source_name, publishedAt].filter(Boolean).join(" · ")}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleSave(card)}
              className={`grid size-11 place-items-center rounded-lg border-0 bg-[#282d38] text-xl ${card.is_saved ? "text-[#4d9fff]" : "text-[#c8ccd4]"}`}
              aria-label={card.is_saved ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            >
              {card.is_saved ? "★" : "☆"}
            </button>
            {card.origin_url && !videoCard && (
              <a
                href={card.origin_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#4d9fff] px-5 text-[13px] font-bold text-[#0d1929] no-underline transition hover:bg-[#71b0ff]"
              >
                원문 보기 <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
