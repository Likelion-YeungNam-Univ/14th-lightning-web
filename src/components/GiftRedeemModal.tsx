interface GiftRedeemModalProps {
  pointBalance: number;
  pizzaCost?: number;
  redeemedThisMonth?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function GiftRedeemModal({
  pointBalance,
  pizzaCost = 18000,
  redeemedThisMonth = false,
  onClose,
  onConfirm,
}: GiftRedeemModalProps) {
  const percent = Math.min(100, Math.round((pointBalance / pizzaCost) * 100));
  const remaining = Math.max(0, pizzaCost - pointBalance);
  const canRedeem = !redeemedThisMonth && pointBalance >= pizzaCost;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-10 overflow-y-auto">
      <div className="w-full max-w-sm rounded-2xl bg-[#171a21] border border-white/[0.06] p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-lg font-bold">피자 기프티콘 교환</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-white/40 hover:text-white/70 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* 진행률 */}
        <div className="rounded-xl bg-[#12213a] border border-[#2c4f7c] p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#4d9fff] font-medium flex items-center gap-1">
              🍕 피자까지
            </span>
            <span className="text-white font-bold text-base">
              {pointBalance.toLocaleString()} / {pizzaCost.toLocaleString()}P
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full bg-[#4d9fff]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-xs text-white/40">{percent}%</span>
        </div>

        {/* 상품 카드 */}
        <div className="flex items-center gap-3.5 rounded-xl bg-[#20242e] border border-white/[0.06] p-4 mb-4">
          <div className="size-12 rounded-lg bg-[#3a2416] flex items-center justify-center text-2xl shrink-0">
            🍕
          </div>
          <div>
            <p className="text-white font-bold text-sm">피자 한 판 기프티콘</p>
            <p className="text-white/70 text-sm font-semibold mt-0.5">
              {pizzaCost.toLocaleString()}P
            </p>
            {!canRedeem && !redeemedThisMonth && (
              <p className="text-xs text-white/30 mt-1">
                {remaining.toLocaleString()}P 더 모으면 교환할 수 있어요
              </p>
            )}
          </div>
        </div>

        {/* 교환 버튼 */}
        <button
          type="button"
          disabled={!canRedeem}
          onClick={onConfirm}
          className={`w-full rounded-full font-semibold text-sm py-3.5 transition-colors ${
            canRedeem
              ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb]'
              : 'bg-white/[0.06] text-white/40 cursor-default'
          }`}
        >
          {redeemedThisMonth
            ? '이번 달 교환을 완료했어요'
            : canRedeem
              ? `${pizzaCost.toLocaleString()}P로 교환하기`
              : '포인트가 부족해요'}
        </button>

        {/* 포인트 모으는 법 */}
        <div className="rounded-xl bg-[#20242e] border border-white/[0.06] p-4 mt-5">
          <p className="text-xs text-[#4d9fff] font-semibold mb-2">포인트 모으는 법</p>
          <p className="text-xs text-white/50 leading-5">
            참여 결과가 좋으면 상대 진영의 포인트가 넘어와요.
            <br />
            4인 방에서 2대2로 이기면 한 판에 500P를 벌어요.
          </p>
        </div>

        <p className="text-xs text-white/25 mt-4">
          교환은 계정당 월 1회, 교환한 기프티콘은 취소·환불되지 않아요.
        </p>
      </div>
    </div>
  );
}