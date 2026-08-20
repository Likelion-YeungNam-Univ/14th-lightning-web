import type { CommunityPrediction } from '../types/community';

interface CommunityCardProps {
  prediction: CommunityPrediction;
  onClick: (id: string) => void;
}

function formatPrice(price: number, currency: 'KRW' | 'USD') {
  return currency === 'USD'
    ? `${price.toLocaleString()}달러`
    : `${price.toLocaleString()}원`;
}

export default function CommunityCard({ prediction, onClick }: CommunityCardProps) {
  const isUp = prediction.direction === 'up';
  const leadingRatio = isUp ? prediction.upRatio : 1 - prediction.upRatio;
  const progressPercent = Math.min(100, Math.max(0, Math.round(leadingRatio * 100)));

  return (
    <button
      type="button"
      onClick={() => onClick(prediction.id)}
      className="text-left bg-[#1c2029] rounded-2xl p-5 border border-white/[0.06] w-full hover:border-white/[0.15] transition-colors"
    >
      {/* 상단: 뱃지 + 판가름 날짜 */}
      <div className="flex items-center gap-2 mb-3.5">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
            isUp
              ? 'bg-[#1e3a2f] text-[#81f6ac]'
              : 'bg-[#4a2e17] text-[rgb(231,162,106)]'
          }`}
        >
          {isUp ? '간다 우세' : '안간다 우세'}
        </span>
        <span className="text-xs text-[#8b93a3]">
          판가름 {prediction.deadlineLabel}
        </span>
      </div>

      {/* 제목 */}
      <h3 className="text-[#f2f3f5] font-bold text-[16px] leading-snug mb-3">
        {prediction.title}
      </h3>

      {/* 목표가 */}
      <p className="text-sm text-[#4d9fff] font-semibold mb-2.5">
        목표가 {formatPrice(prediction.targetPrice, prediction.currency)}
      </p>

      {/* 참여/판돈 */}
      <p className="text-xs text-[#8b93a3] mb-4">
        참여 {prediction.participantCount}/{prediction.maxParticipants}명 ·
        판돈 {prediction.totalPoints.toLocaleString()}P
      </p>

      {/* 프로그레스바 */}
      <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className={`h-full rounded-full ${
            isUp ? 'bg-[#81f6ac]' : 'bg-[rgb(231,162,106)]'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </button>
  );
}
