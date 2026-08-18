import { useState } from 'react';
import type { CommunityDirection } from '../types/community';

export interface CommunityCreateFormData {
  stockName: string;
  title: string;
  expectedPrice: number;
  deadlineDate: string; // YYYY-MM-DD
  content: string;
  direction: CommunityDirection;
  betAmount: number;
  maxParticipants: number;
}

interface CommunityCreateModalProps {
  stockName: string;
  pointBalance: number;
  onClose: () => void;
  onSubmit: (data: CommunityCreateFormData) => void;
}

const MAX_BET_PER_ROUND = 1000;
const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 20;
const DEFAULT_PARTICIPANTS = 4;

export default function CommunityCreateModal({
  stockName,
  pointBalance,
  onClose,
  onSubmit,
}: CommunityCreateModalProps) {
  const [title, setTitle] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [content, setContent] = useState('');
  const [direction, setDirection] = useState<CommunityDirection>('up');
  const [betAmount, setBetAmount] = useState(500);
  const [maxParticipants, setMaxParticipants] = useState(DEFAULT_PARTICIPANTS);

  const canSubmit =
    title.trim().length > 0 &&
    expectedPrice.trim().length > 0 &&
    deadlineDate.trim().length > 0 &&
    betAmount > 0 &&
    betAmount <= MAX_BET_PER_ROUND &&
    betAmount <= pointBalance;

  function handleParticipantsChange(delta: number) {
    setMaxParticipants((prev) =>
      Math.min(MAX_PARTICIPANTS, Math.max(MIN_PARTICIPANTS, prev + delta)),
    );
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      stockName,
      title: title.trim(),
      expectedPrice: Number(expectedPrice),
      deadlineDate,
      content: content.trim(),
      direction,
      betAmount,
      maxParticipants,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-10 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-[#171a21] border border-white/[0.06] p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-lg font-bold">
            {stockName} 커뮤니티 만들기
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-white/40 hover:text-white/70 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          {/* 종목 (읽기 전용) */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5">종목</label>
            <div className="flex items-center justify-between rounded-lg bg-[#131417] border border-white/[0.06] px-3.5 py-3">
              <span className="text-white font-semibold text-sm">{stockName}</span>
              <span className="text-xs text-white/30">상단에서 선택한 종목이에요</span>
            </div>
          </div>

          {/* 방 제목 */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5">방 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 9월 말까지 8만원 간다"
              className="w-full rounded-lg bg-[#131417] border border-white/[0.06] px-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-sky-500/50"
            />
          </div>

          {/* 생성자 예상 가격 + 판가름 날짜 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                생성자 예상 가격
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={expectedPrice}
                onChange={(e) => setExpectedPrice(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="80,000원"
                className="w-full rounded-lg bg-[#131417] border border-white/[0.06] px-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-sky-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">판가름 날짜</label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full rounded-lg bg-[#131417] border border-white/[0.06] px-3.5 py-3 text-sm text-white outline-none focus:border-sky-500/50 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* 게시글 작성 */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5">게시글 작성</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="왜 그렇게 보는지 적어주세요. 사진과 링크를 함께 올릴 수 있어요."
              className="w-full resize-none rounded-lg bg-[#131417] border border-white/[0.06] px-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-sky-500/50"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="text-xs text-white/50 border border-white/10 rounded-md px-2.5 py-1.5 hover:text-white/80"
              >
                📎 사진 첨부
              </button>
              <button
                type="button"
                className="text-xs text-white/50 border border-white/10 rounded-md px-2.5 py-1.5 hover:text-white/80"
              >
                🔗 자료 카드 첨부
              </button>
            </div>
          </div>

          {/* 생성자 예상 방향 */}
          <div>
            <label className="block text-xs text-white/40 mb-4">
              생성자 예상 방향
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDirection('up')}
                className={`px-5 py-1 rounded-full text-sm font-semibold transition-colors ${
                  direction === 'up'
                    ? ' text-emerald-300 border'
                    : 'bg-[#131417] text-white/50 border border-white/[0.06]'
                }`}
              >
                간다
              </button>
              <button
                type="button"
                onClick={() => setDirection('down')}
                className={`px-5 py-1 rounded-full text-sm font-semibold transition-colors ${
                  direction === 'down'
                    ? ' text-orange-300 border'
                    : 'bg-[#131417] text-white/50 border border-white/[0.06]'
                }`}
              >
                안 간다
              </button>
            </div>
          </div>

          {/* 참여 인원 (신규) */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5">참여 인원</label>
            <div className="flex items-center justify-between rounded-lg bg-[#131417] border border-white/[0.06] px-3.5 py-2.5">
              <span className="text-sm text-white/50">
                최소 {MIN_PARTICIPANTS}명 ~ 최대 {MAX_PARTICIPANTS}명
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleParticipantsChange(-1)}
                  disabled={maxParticipants <= MIN_PARTICIPANTS}
                  className="size-7 rounded-full bg-white/[0.06] text-white disabled:opacity-30 disabled:cursor-default hover:bg-white/[0.1]"
                >
                  −
                </button>
                <span className="text-white font-semibold text-sm w-6 text-center">
                  {maxParticipants}
                </span>
                <button
                  type="button"
                  onClick={() => handleParticipantsChange(1)}
                  disabled={maxParticipants >= MAX_PARTICIPANTS}
                  className="size-7 rounded-full bg-white/[0.06] text-white disabled:opacity-30 disabled:cursor-default hover:bg-white/[0.1]"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 참여 금액 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-white/40">참여 금액</label>
              <span className="text-xs text-white/30">
                1회 최대 {MAX_BET_PER_ROUND.toLocaleString()}P · 내 포인트{' '}
                {pointBalance.toLocaleString()}P
              </span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={betAmount}
              onChange={(e) => {
                const value = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                setBetAmount(Math.min(value, MAX_BET_PER_ROUND));
              }}
              className="w-full rounded-lg bg-[#131417] border border-white/[0.06] px-3.5 py-3 text-sm text-white outline-none focus:border-sky-500/50"
            />
          </div>

          {/* 제출 */}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="w-full rounded-full bg-[#2161c9] text-white font-semibold text-sm py-3.5 hover:bg-[#2563eb] transition-colors disabled:opacity-40 disabled:cursor-default"
          >
            커뮤니티 만들고 {betAmount.toLocaleString()}P 참여하기
          </button>
        </div>
      </div>
    </div>
  );
}