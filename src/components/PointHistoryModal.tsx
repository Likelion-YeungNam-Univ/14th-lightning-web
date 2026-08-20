import { useEffect } from 'react';
import type { PointHistoryEntry } from '../types/points';

interface PointHistoryModalProps {
  entries: PointHistoryEntry[];
  onClose: () => void;
}

export default function PointHistoryModal({ entries, onClose }: PointHistoryModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
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
        aria-labelledby="point-history-title"
        className="max-h-[calc(100vh-48px)] w-full max-w-[640px] overflow-y-auto rounded-[20px] border border-[#343a48] bg-[#1b1f2b] px-8 pb-8 pt-7 shadow-2xl max-[640px]:max-h-[calc(100vh-24px)] max-[640px]:px-5 max-[640px]:pb-5"
      >
        <header className="flex items-start justify-between gap-5">
          <h2
            id="point-history-title"
            className="text-[28px] font-bold tracking-[-0.03em] text-[#f4f6fb] max-[640px]:text-[24px]"
          >
            내 포인트 내역
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[24px] leading-none text-[#9aa3b2] transition hover:bg-[#292e3a] hover:text-white"
            aria-label="내 포인트 내역 닫기"
          >
            ×
          </button>
        </header>

        <p className="mt-10 text-[16px] leading-7 text-[#c3c8d2] max-[640px]:mt-7 max-[640px]:text-[15px]">
          충전·참여·획득·교환 기록을 시간순으로 보여줘요.
        </p>

        <div className="mt-7 space-y-6 max-[640px]:mt-5 max-[640px]:space-y-3">
          {entries.length > 0 ? (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="grid min-h-[76px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-8 rounded-[15px] bg-[#151820] px-7 py-5 max-[640px]:grid-cols-[minmax(0,1fr)_auto] max-[640px]:gap-x-4 max-[640px]:gap-y-2 max-[640px]:px-5"
              >
                <p className="min-w-0 text-[17px] font-semibold tracking-[-0.02em] text-[#edf0f6] max-[640px]:text-[15px]">
                  {entry.label}
                </p>
                <time className="whitespace-nowrap text-[14px] text-[#858e9e] max-[640px]:row-start-2">
                  {entry.date_label}
                </time>
                <span
                  className={`min-w-[82px] whitespace-nowrap text-right text-[16px] font-bold max-[640px]:row-span-2 max-[640px]:row-start-1 max-[640px]:text-[15px] ${
                    entry.amount > 0 ? 'text-[#7dd99c]' : 'text-[#b8bfcc]'
                  }`}
                >
                  {entry.amount > 0 ? '+' : ''}
                  {entry.amount.toLocaleString()}P
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-[15px] bg-[#151820] px-6 py-10 text-center text-[15px] text-[#858e9e]">
              아직 포인트 내역이 없어요.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
