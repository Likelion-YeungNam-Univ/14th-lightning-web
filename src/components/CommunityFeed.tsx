import type { CommunityPrediction, CommunityCurrency } from '../types/community';
import CommunityCard from './CommunityCard';

// 종목별 기준 정보 (실제 API 연결 전까지 쓰는 임시 매핑)
const STOCK_MOCK_CONFIG: Record<string, { currency: CommunityCurrency; basePrice: number }> = {
  '삼성전자': { currency: 'KRW', basePrice: 80000 },
  'SK하이닉스': { currency: 'KRW', basePrice: 220000 },
  '현대차': { currency: 'KRW', basePrice: 210000 },
  'NAVER': { currency: 'KRW', basePrice: 210000 },
  'NVIDIA': { currency: 'USD', basePrice: 190 },
};

function formatPriceLabel(price: number, currency: CommunityCurrency) {
  return currency === 'USD' ? `${price}달러` : `${price.toLocaleString()}원`;
}

// 종목명을 받아서 카드 4개짜리 목업을 자동 생성
function generatePredictions(stockName: string): CommunityPrediction[] {
  const config = STOCK_MOCK_CONFIG[stockName] ?? { currency: 'KRW', basePrice: 100000 };
  const priceLabel = formatPriceLabel(config.basePrice, config.currency);

  return [
    {
      id: '1',
      stockName,
      title: `9월 말까지 ${priceLabel} 간다`,
      direction: 'up',
      targetPrice: config.basePrice,
      currency: config.currency,
      deadlineLabel: '09.30',
      participantCount: 3,
      maxParticipants: 4,
      totalPoints: 1500,
      upRatio: 0.75,
    },
    {
      id: '2',
      stockName,
      title: `실적 발표 전에 ${priceLabel} 아래로 내려간다`,
      direction: 'down',
      targetPrice: config.basePrice,
      currency: config.currency,
      deadlineLabel: '09.12',
      participantCount: 3,
      maxParticipants: 4,
      totalPoints: 1500,
      upRatio: 0.75,
    },
    {
      id: '3',
      stockName,
      title: `공개 자료 반영되면 ${priceLabel} 다시 간다`,
      direction: 'up',
      targetPrice: config.basePrice,
      currency: config.currency,
      deadlineLabel: '10.15',
      participantCount: 4,
      maxParticipants: 4,
      totalPoints: 2000,
      upRatio: 1,
    },
    {
      id: '4',
      stockName,
      title: '추석 전 조정이 올지 지켜본다',
      direction: 'down',
      targetPrice: config.basePrice,
      currency: config.currency,
      deadlineLabel: '09.25',
      participantCount: 1,
      maxParticipants: 4,
      totalPoints: 500,
      upRatio: 0.25,
    },
  ];
}

interface CommunityFeedProps {
  stockName: string;
}

export default function CommunityFeed({ stockName }: CommunityFeedProps) {
  const predictions = generatePredictions(stockName);

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-white text-lg font-bold">
            {stockName} 커뮤니티
          </h2>
          <p className="text-sm text-white/40 mt-1">
            사용자가 만든 방이에요. 판가름 날짜에 결과가 자동으로 정해져요.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
           <span className="text-xs text-blue-400 font-bold px-3.5 py-2 rounded border border-black/50 bg-white/[0.03]">
            진행 중
          </span>
          <button
            type="button"
            className="text-sm font-semibold px-6 py-3 rounded-lg bg-blue-400 text-black"
          >
            + 커뮤니티 만들기
          </button>
        </div>
      </div>

      {/* 카드 그리드 (전시용) */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        {predictions.map((prediction) => (
          <CommunityCard key={prediction.id} prediction={prediction} />
        ))}
      </div>
    </div>
  );
}