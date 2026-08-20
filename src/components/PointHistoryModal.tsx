import type { PointHistoryEntry } from '../types/points';

interface PointHistoryModalProps {
  entries: PointHistoryEntry[];
  onClose: () => void;
}

export default function PointHistoryModal({ entries, onClose }: PointHistoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-10 overflow-y-auto">
      <div className="w-full max-w-sm rounded-2xl bg-[#171a21] border border-white/[0.06] p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white text-lg font-bold">내 포인트 내역</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-white/40 hover:text-white/70 text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-white/40 mb-5">
          충전·참여·획득·교환 기록을 시간순으로 보여줘요.
        </p>

        {/* 목록 */}
        {entries.length > 0 ? (
          <div className="space-y-2.5">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl bg-[#20242e] border border-white/[0.06] px-4 py-3.5"
              >
                <div>
                  <p className="text-sm text-white font-medium">{entry.label}</p>
                  <p className="text-xs text-white/30 mt-1">{entry.date_label}</p>
                </div>
                <span
                  className={`text-sm font-bold ${
                    entry.amount >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'
                  }`}
                >
                  {entry.amount >= 0 ? '+' : ''}
                  {entry.amount.toLocaleString()}P
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-[#20242e] border border-white/[0.06] px-4 py-8 text-center">
            <p className="text-sm text-white/50 font-medium">아직 포인트 내역이 없어요</p>
            <p className="text-xs text-white/25 mt-1">충전하거나 참여하면 여기에 표시돼요.</p>
          </div>
        )}
      </div>
    </div>
  );
}