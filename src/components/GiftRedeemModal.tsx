import { useEffect, useState } from "react";
import type { GifticonExchangeResponse } from "../types/points";

interface GiftRedeemModalProps {
  pointBalance: number;
  pizzaCost?: number;
  redeemedThisMonth?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  error?: string;
  exchangeResult?: GifticonExchangeResponse | null;
}

export default function GiftRedeemModal({
  pointBalance,
  pizzaCost = 23000,
  redeemedThisMonth = false,
  onClose,
  onConfirm,
  loading = false,
  error = "",
  exchangeResult = null,
}: GiftRedeemModalProps) {
  const [copied, setCopied] = useState(false);
  const percent = Math.min(100, Math.round((pointBalance / pizzaCost) * 100));
  const remaining = Math.max(0, pizzaCost - pointBalance);
  const canRedeem = !redeemedThisMonth && pointBalance >= pizzaCost;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const copyCouponCode = async () => {
    if (!exchangeResult?.issued_code) return;
    try {
      await navigator.clipboard.writeText(exchangeResult.issued_code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

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
        aria-labelledby="gift-redeem-title"
        className="relative flex max-h-[calc(100vh-48px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[20px] border border-[#303746] bg-[#1b1f2b] shadow-[0_28px_90px_rgba(0,0,0,.55)] max-[640px]:max-h-[calc(100vh-24px)] max-[640px]:rounded-2xl"
      >
        <div className="z-10 flex shrink-0 items-center justify-between bg-[#1b1f2b] px-7 pb-4 pt-7 max-[640px]:px-5 max-[640px]:pt-6">
          <h2
            id="gift-redeem-title"
            className="m-0 text-2xl font-bold tracking-[-0.04em] text-[#f4f6fa]"
          >
            {exchangeResult ? "교환이 끝났어요" : "피자 기프티콘 교환"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid size-10 place-items-center rounded-full border-0 bg-[#2a2f3a] text-2xl font-light text-[#b9c1ce] transition hover:bg-[#343b48] hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-7 pb-7 max-[640px]:px-5 max-[640px]:pb-6">
        {exchangeResult ? (
          <div>
            <div className="rounded-[16px] bg-[#151820] px-5 py-6">
              <h3 className="m-0 text-xl font-bold text-[#f4f6fa]">🍕 피자 한 판 기프티콘</h3>
              <div className="mt-6 flex items-center justify-between gap-4">
                <p className="m-0 min-w-0 text-sm text-[#9aa3b2]">
                  쿠폰번호
                  <strong className="ml-2 break-all text-base text-[#6f9fff]">
                    {exchangeResult.issued_code}
                  </strong>
                </p>
                <button
                  type="button"
                  onClick={() => void copyCouponCode()}
                  className="h-10 shrink-0 rounded-[8px] border border-[#414958] bg-transparent px-4 text-sm text-[#c8ccd4] transition hover:bg-[#252a34] hover:text-white"
                >
                  {copied ? "복사됨" : "복사"}
                </button>
              </div>
              <p className="mb-0 mt-5 text-sm text-[#9aa3b2]">유효기간은 발급된 쿠폰에서 확인해주세요.</p>
              <p className="mb-0 mt-6 text-xl font-bold text-[#f4f6fa]">
                남은 포인트 {exchangeResult.balance.toLocaleString()}P
              </p>
              <p className="mb-0 mt-5 text-xs text-[#d89b55]">⚠ 해커톤 시연용 데모 코드예요. 실제로 사용할 수 없어요.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-7 h-12 w-full rounded-[12px] border-0 bg-[#6f9fff] text-sm font-bold text-[#0d1929] transition hover:bg-[#83adff]"
            >
              확인
            </button>
          </div>
        ) : (
          <>
        <div className="mb-7 rounded-[16px] bg-[#273044] px-5 py-5">
          <div className="mb-5 flex items-center justify-between gap-4 max-[520px]:items-start max-[520px]:flex-col">
            <span className="flex items-center gap-1 text-sm font-bold text-[#6fa8ff]">
              🍕 피자까지
            </span>
            <strong className="text-2xl font-bold text-[#f4f6fa]">
              {pointBalance.toLocaleString()} / {pizzaCost.toLocaleString()}P
            </strong>
          </div>
          <strong className="mb-3 block text-base text-[#6fa8ff]">{percent}%</strong>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#2b3039]">
            <div
              className="h-full rounded-full bg-[#4d9fff]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="mb-6 flex items-center gap-5 rounded-[16px] bg-[#151820] px-5 py-5 max-[520px]:gap-4 max-[520px]:px-4">
          <div className="grid size-24 shrink-0 place-items-center rounded-[14px] bg-[#2a2f38] text-4xl max-[520px]:size-20">
            🍕
          </div>
          <div className="min-w-0">
            <p className="m-0 text-xl font-bold text-white max-[520px]:text-lg">
              피자 한 판 기프티콘
            </p>
            <p className="mb-0 mt-3 text-2xl font-bold text-[#a5adbc]">
              {pizzaCost.toLocaleString()}P
            </p>
            {!canRedeem && !redeemedThisMonth && (
              <p className="mb-0 mt-3 text-sm text-[#9fb0cc]">
                {remaining.toLocaleString()}P 더 모으면 교환할 수 있어요
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={!canRedeem || loading}
          onClick={onConfirm}
          className={`min-h-12 w-full rounded-[12px] border-0 text-sm font-bold transition-colors ${
            canRedeem
              ? "bg-[#4d9fff] text-[#0d1929] hover:bg-[#71b0ff]"
              : "cursor-default bg-[#35476a] text-[#aeb6c5]"
          }`}
        >
          {loading
            ? "교환 중..."
            : redeemedThisMonth
            ? "이번 달 교환을 완료했어요"
            : canRedeem
              ? `${pizzaCost.toLocaleString()}P로 교환하기`
              : "포인트가 부족해요"}
        </button>

        {error && <p role="alert" className="mb-0 mt-4 text-sm text-[#ef7b7b]">{error}</p>}

        <div className="mt-7 rounded-[16px] bg-[#151820] px-5 py-5">
          <p className="mb-4 mt-0 text-base font-bold text-[#6fa8ff]">
            포인트 모으는 법
          </p>
          <p className="m-0 text-[15px] leading-7 text-[#d9dee7]">
            참여 결과가 좋으면 상대 진영의 포인트가 넘어와요.
            <br />
            4인 방에서 2대2로 이기면 한 판에 500P를 벌어요.
          </p>
        </div>

        <p className="mb-0 mt-6 text-xs text-[#9aa3b2]">
          교환은 계정당 월 1회, 교환한 기프티콘은 취소·환불되지 않아요.
        </p>
          </>
        )}
        </div>
      </section>
    </div>
  );
}
