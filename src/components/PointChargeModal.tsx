import { useEffect, useState } from "react";

interface PointChargeModalProps {
  pointBalance: number;
  pointCap?: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

const TOPUP_OPTIONS = [
  { amount: 5000, recommended: false },
  { amount: 10000, recommended: true },
  { amount: 30000, recommended: false },
];

export default function PointChargeModal({
  pointBalance,
  pointCap = 30000,
  onClose,
  onConfirm,
}: PointChargeModalProps) {
  const [selectedAmount, setSelectedAmount] = useState(5000);

  const remainingCap = pointCap - pointBalance;
  const canPay = selectedAmount > 0 && selectedAmount <= remainingCap;

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
        aria-labelledby="point-charge-title"
        className="relative flex max-h-[calc(100vh-48px)] w-full max-w-[640px] flex-col overflow-hidden rounded-[20px] border border-[#303746] bg-[#1b1f2b] shadow-[0_28px_90px_rgba(0,0,0,.55)] max-[640px]:max-h-[calc(100vh-24px)] max-[640px]:rounded-2xl"
      >
        <div className="z-10 flex shrink-0 items-center justify-between bg-[#1b1f2b] px-10 pb-6 pt-10 max-[640px]:px-5 max-[640px]:pb-5 max-[640px]:pt-6">
          <h2
            id="point-charge-title"
            className="m-0 text-[28px] font-bold tracking-[-0.04em] text-[#f4f6fa] max-[640px]:text-2xl"
          >
            포인트 충전
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid size-12 place-items-center rounded-full border-0 bg-[#2a2f3a] text-[28px] font-light text-[#b9c1ce] transition hover:bg-[#343b48] hover:text-white max-[640px]:size-10"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-10 pb-10 max-[640px]:px-5 max-[640px]:pb-6">
        <div className="mb-10 rounded-[16px] bg-[#273044] px-7 py-7 max-[640px]:mb-7 max-[640px]:px-5">
          <span className="text-sm font-bold text-[#6fa8ff]">현재 보유</span>
          <div className="mt-4 flex items-end justify-between gap-4 max-[480px]:items-start max-[480px]:flex-col">
            <strong className="text-[36px] font-bold text-[#f4f6fa] max-[640px]:text-[30px]">
              {pointBalance.toLocaleString()}P
            </strong>
            <span className="pb-1 text-sm text-[#aeb7c6]">
            보유 상한 {pointCap.toLocaleString()}P
            </span>
          </div>
        </div>

        <p className="mb-7 mt-0 text-sm font-bold text-[#9fb0cc]">1P = 1원</p>

        <div className="mb-8 space-y-3">
          {TOPUP_OPTIONS.map((option) => (
            <button
              key={option.amount}
              type="button"
              onClick={() => setSelectedAmount(option.amount)}
              className={`flex min-h-[84px] w-full items-center justify-between rounded-[16px] border px-7 py-5 text-left transition-colors max-[640px]:min-h-[72px] max-[640px]:px-5 ${
                selectedAmount === option.amount
                  ? "border-[#6f9fff] bg-[#151820] ring-1 ring-[#6f9fff]"
                  : "border-transparent bg-[#151820] hover:border-[#35425c]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <strong className="text-xl font-bold text-[#f4f6fa] max-[480px]:text-lg">
                  {option.amount.toLocaleString()}P
                </strong>
                {option.recommended && (
                  <span className="rounded-md bg-[#2f4165] px-2 py-1 text-xs font-bold text-[#6fa8ff]">
                    추천
                  </span>
                )}
              </div>
              <span className="shrink-0 text-lg text-[#d9dee7] max-[480px]:text-base">
                {option.amount.toLocaleString()}원
              </span>
            </button>
          ))}
        </div>

        <p className="mb-7 mt-0 text-sm text-[#9fb0cc]">
          ⚠ 테스트 결제입니다. 실제로 결제되지 않아요.
        </p>

        <div className="mb-8 grid grid-cols-2 gap-5 max-[480px]:grid-cols-1 max-[480px]:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-14 rounded-[12px] border border-[#414958] bg-[#151820] text-base font-bold text-[#d9dee7] transition hover:bg-[#202530]"
          >
            결제 취소 시연
          </button>
          <button
            type="button"
            disabled={!canPay}
            onClick={() => onConfirm(selectedAmount)}
            className="min-h-14 rounded-[12px] border-0 bg-[#6f9fff] text-base font-bold text-[#0d1929] transition hover:bg-[#83adff] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {selectedAmount.toLocaleString()}원 결제하기
          </button>
        </div>

        <p className="m-0 text-xs leading-6 text-[#9aa3b2]">
          카드 · 카카오페이 · 토스페이
          <br />
          1회 참여 최대 1,000P · 보유 상한 {pointCap.toLocaleString()}P ·
          미성년자 결제 불가
          <br />
          신규 가입 지급 포인트는 없어요.
        </p>
        </div>
      </section>
    </div>
  );
}
