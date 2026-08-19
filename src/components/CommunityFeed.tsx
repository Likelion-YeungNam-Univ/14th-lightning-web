import { useEffect, useState } from 'react';
import type { CommunityPrediction, CommunityCurrency } from '../types/community';
import CommunityCard from './CommunityCard';
import CommunityDetail from './CommunityDetail';
import CommunityCreateModal, { type CommunityCreateFormData } from './CommunityCreateModal';
import TradingViewChart from './TradingViewChart';
import { fetchChartSymbol } from '../api/chart';

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
  pointBalance?: number; // 실제 포인트 API 연결 전까지는 기본값 사용
  authenticated: boolean;
}

export default function CommunityFeed({
  stockName,
  stockCode,
  pointBalance = 7200,
  authenticated,
}: CommunityFeedProps) {
  const predictions = generatePredictions(stockName);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chartSymbol, setChartSymbol] = useState<string | null>(null);

  const selectedPrediction = predictions.find((p) => p.id === selectedId) ?? null;

  // 종목이 바뀔 때마다 실제 차트 심볼을 백엔드에서 조회
  useEffect(() => {
    let cancelled = false;
    setChartSymbol(null);
    console.log('요청하는 stockCode:', stockCode);
    fetchChartSymbol(stockCode)
      .then((symbol) => {
        console.log('받은 심볼:', symbol); 
        if (!cancelled) setChartSymbol(symbol);
      })
      .catch(() => {
        console.error('심볼 조회 실패:', error);
        if (!cancelled) setChartSymbol(null);
      });
    return () => {
      cancelled = true;
    };
  }, [stockCode]);

  // 카드 클릭 시 같은 자리에서 상세 화면으로 전환
  if (selectedPrediction) {
    return (
      <CommunityDetail
        prediction={selectedPrediction}
        pointBalance={pointBalance}
        authenticated={authenticated}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  function handleCreateSubmit(data: CommunityCreateFormData) {
    console.log('제출된 폼 데이터:', data); // TODO: 실제 저장 API 연결 지점 (postApi 등)
    setIsCreateOpen(false);
  }

  return (
    <div>
      {/* 차트 */}
      <div className="mb-5">
        {chartSymbol ? (
          <TradingViewChart symbol={chartSymbol} height={420} />
        ) : (
          <div className="h-[420px] rounded-2xl bg-[#171a21] border border-white/[0.06] flex items-center justify-center">
            <span className="text-sm text-white/30">차트를 불러오는 중이에요...</span>
          </div>
        )}
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
          pointBalance={pointBalance}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}
    </div>
  );
}