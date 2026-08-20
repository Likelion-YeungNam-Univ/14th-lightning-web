import { useEffect, useState } from 'react';
import type { CommunityPrediction, CommunityCurrency } from '../types/community';
import CommunityCard from './CommunityCard';
import CommunityDetail from './CommunityDetail';
import CommunityCreateModal, { type CommunityCreateFormData } from './CommunityCreateModal';
import TradingViewChart from './TradingViewChart';
import { toTradingViewSymbol } from '../lib/tradingview-symbol';

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
      creatorName: '',
      post: '',
      comments: [],
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
      creatorName: '',
      post: '',
      comments: [],
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
      creatorName: '',
      post: '',
      comments: [],
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
      creatorName: '',
      post: '',
      comments: [],
    },
  ];
}

interface CommunityFeedProps {
  stockName: string;
  stockCode: string;
  market: string;
  pointBalance?: number; // 실제 포인트 API 연결 전까지는 기본값 사용
  authenticated: boolean; 
}

export default function CommunityFeed({
  stockName,
  stockCode,
  market,
  pointBalance = 7200,
  authenticated,
}: CommunityFeedProps) {
  const [predictions, setPredictions] = useState(() => generatePredictions(stockName));
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [availablePoints, setAvailablePoints] = useState(pointBalance);
  const [createdMessage, setCreatedMessage] = useState('');

  useEffect(() => {
    setPredictions(generatePredictions(stockName));
    setSelectedId(null);
  }, [stockName]);

  useEffect(() => {
    if (!createdMessage) return;
    const timer = window.setTimeout(() => setCreatedMessage(''), 3000);
    return () => window.clearTimeout(timer);
  }, [createdMessage]);

  const selectedPrediction = predictions.find((p) => p.id === selectedId) ?? null;

  // 카드 클릭 시 같은 자리에서 상세 화면으로 전환
  if (selectedPrediction) {
    return (
      <CommunityDetail
        prediction={selectedPrediction}
        pointBalance={availablePoints}
        authenticated={authenticated}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const symbol = toTradingViewSymbol(stockCode, market);

  function handleCreateSubmit(data: CommunityCreateFormData) {
    const config = STOCK_MOCK_CONFIG[stockName] ?? { currency: 'KRW' as const, basePrice: 100000 };
    // 생성 직후 최근 생성된 방과 피드 최상단에서 바로 확인할 수 있게 반영한다.
    setPredictions((current) => [{
      id: `local-${Date.now()}`,
      stockName: data.stockName,
      title: data.title,
      direction: data.direction,
      targetPrice: data.expectedPrice,
      currency: config.currency,
      deadlineLabel: data.deadlineDate.slice(5).replace('-', '.'),
      participantCount: 1,
      maxParticipants: data.maxParticipants,
      totalPoints: data.betAmount,
      upRatio: data.direction === 'up' ? 1 : 0,
      creatorName: '나',
      post: data.content,
      comments: [],
    }, ...current]);
    setIsCreateOpen(false);
    setAvailablePoints((current) => current - data.betAmount);
    setCreatedMessage(`커뮤니티를 만들고 ${data.betAmount.toLocaleString()}P를 냈어요.`);
  }

  return (
    <div>
      {createdMessage && (
        <div role="status" className="status-banner--info fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-lg border border-white/10 bg-[#20252f] px-4 py-3 text-xs font-bold text-white shadow-2xl">
          <span className="mr-2 inline-grid size-4 place-items-center rounded-full bg-white text-[10px] text-[#20252f]">✓</span>
          {createdMessage}
        </div>
      )}
      {/* 차트 */}
      <div className="mb-5">
        <TradingViewChart symbol={symbol} height={420} />
      </div>

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
          <span className="text-xs text-blue-400 font-bold px-3.5 py-2 rounded border border-black/50 bg-white/3">
            진행 중
          </span>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="text-sm font-semibold px-6 py-3 rounded-lg bg-blue-400 text-black"
          >
            + 커뮤니티 만들기
          </button>
        </div>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        {predictions.map((prediction) => (
          <CommunityCard
            key={prediction.id}
            prediction={prediction}
            onClick={setSelectedId}
          />
        ))}
      </div>

      {/* 커뮤니티 만들기 모달 */}
      {isCreateOpen && (
        <CommunityCreateModal
          stockName={stockName}
          pointBalance={availablePoints}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}
    </div>
  );
}
