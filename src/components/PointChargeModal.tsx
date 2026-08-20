import { useState } from 'react';

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
  const [selectedAmount, setSelectedAmount] = useState(10000);

  const remainingCap = pointCap - pointBalance;
  const canPay = selectedAmount > 0 && selectedAmount <= remainingCap;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-10 overflow-y-auto">
      <div className="w-full max-w-sm rounded-2xl bg-[#171a21] border border-white/[0.06] p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-lg font-bold">포인트 충전</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-white/40 hover:text-white/70 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* 현재 보유 */}
        <div className="rounded-xl bg-[#12213a] border border-[#2c4f7c] p-4 mb-5">
          <span className="text-xs text-[#4d9fff] font-medium">현재 보유</span>
          <p className="text-white text-2xl font-bold mt-1">
            {pointBalance.toLocaleString()}P
          </p>
          <p className="text-xs text-white/30 mt-1">
            보유 상한 {pointCap.toLocaleString()}P
          </p>
        </div>

        <p className="text-xs text-white/40 mb-2.5">1P = 1원</p>

        {/* 충전 금액 선택 */}
        <div className="space-y-2.5 mb-4">
          {TOPUP_OPTIONS.map((option) => (
            <button
              key={option.amount}
              type="button"
              onClick={() => setSelectedAmount(option.amount)}
              className={`w-full flex items-center justify-between rounded-xl px-4 py-3.5 border transition-colors ${
                selectedAmount === option.amount
                  ? 'border-sky-500 bg-sky-500/[0.06]'
                  : 'border-white/[0.06] bg-[#20242e]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">
                  {option.amount.toLocaleString()}P
                </span>
                {option.recommended && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400">
                    추천
                  </span>
                )}
              </div>
              <span className="text-sm text-white/50">
                {option.amount.toLocaleString()}원
              </span>
            </button>
          ))}
        </div>

        {/* 안내 */}
        <p className="text-xs text-white/30 mb-4">
          ⚠ 테스트 결제입니다. 실제로 결제되지 않아요.
        </p>

        {/* 버튼 */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button
            type="button"
            onClick={onClose}
            className="py-3 rounded-lg bg-white/[0.06] text-white/70 font-semibold text-sm hover:bg-white/[0.1]"
          >
            결제 취소 시연
          </button>
          <button
            type="button"
            disabled={!canPay}
            onClick={() => onConfirm(selectedAmount)}
            className="py-3 rounded-lg bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] disabled:opacity-40"
          >
            {selectedAmount.toLocaleString()}원 결제하기
          </button>
        </div>

        <p className="text-xs text-white/25 leading-5">
          카드 · 카카오페이 · 토스페이
          <br />
          1회 참여 최대 1,000P · 보유 상한 {pointCap.toLocaleString()}P · 미성년자 결제 불가
          <br />
          신규 가입 지급 포인트는 없어요.
        </p>
      </div>
    </div>
  );
}