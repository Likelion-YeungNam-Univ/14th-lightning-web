import { useCallback, useEffect, useState } from 'react';
import { ApiError, getApi, postApi } from '../api/client';
import type {
  CommunityCurrency,
  CommunityPrediction,
  RoomCreateRequest,
  RoomCreateResponse,
  RoomListItem,
  RoomListResponse,
} from '../types/community';
import CommunityCard from './CommunityCard';
import CommunityDetail from './CommunityDetail';
import CommunityCreateModal, { type CommunityCreateFormData } from './CommunityCreateModal';
import TradingViewChart from './TradingViewChart';
import { toTradingViewSymbol } from '../lib/tradingview-symbol';

interface CommunityFeedProps {
  stockName: string;
  stockCode: string;
  market: string;
  pointBalance?: number;
  authenticated: boolean;
}

function apiErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : '요청을 처리하지 못했습니다.';
}

function currencyForMarket(market: string): CommunityCurrency {
  return market.toLowerCase().includes('us') || market.toLowerCase().includes('해외') ? 'USD' : 'KRW';
}

function roomToPrediction(room: RoomListItem, stockName: string, market: string): CommunityPrediction {
  const totalCount = room.up.count + room.down.count;
  const upRatio = totalCount > 0 ? room.up.count / totalCount : 0;
  const leadingSide = room.leading_side.toLowerCase();
  return {
    id: String(room.id),
    stockName,
    title: room.title,
    direction: leadingSide === 'down' ? 'down' : 'up',
    targetPrice: room.target_price,
    currency: currencyForMarket(market),
    deadlineLabel: room.judge_date.slice(5).replace('-', '.'),
    participantCount: room.participant_count,
    maxParticipants: 4,
    totalPoints: room.total_points,
    upRatio,
    creatorName: '',
    post: room.body ?? '',
    comments: [],
  };
}

export default function CommunityFeed({
  stockName,
  stockCode,
  market,
  pointBalance = 7200,
  authenticated,
}: CommunityFeedProps) {
  const [predictions, setPredictions] = useState<CommunityPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [availablePoints, setAvailablePoints] = useState(pointBalance);
  const [createdMessage, setCreatedMessage] = useState('');

  const loadRooms = useCallback(async () => {
    if (!stockCode) {
      setPredictions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const response = await getApi<RoomListResponse>(`/rooms?stock_code=${encodeURIComponent(stockCode)}&status=open`);
      setPredictions(response.items.map((room) => roomToPrediction(room, stockName, market)));
      setSelectedId(null);
    } catch (error) {
      setPredictions([]);
      setLoadError(apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [market, stockCode, stockName]);

  useEffect(() => {
    // 종목이 바뀔 때 외부 API의 방 목록과 화면 상태를 동기화한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!createdMessage) return;
    const timer = window.setTimeout(() => setCreatedMessage(''), 3000);
    return () => window.clearTimeout(timer);
  }, [createdMessage]);

  const selectedPrediction = predictions.find((prediction) => prediction.id === selectedId) ?? null;
  if (selectedPrediction) {
    return <CommunityDetail prediction={selectedPrediction} stockCode={stockCode} pointBalance={availablePoints} authenticated={authenticated} onBack={() => setSelectedId(null)} />;
  }

  async function handleCreateSubmit(data: CommunityCreateFormData) {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');
    const request: RoomCreateRequest = {
      stock_code: stockCode,
      title: data.title,
      target_price: data.expectedPrice,
      judge_date: data.deadlineDate,
      body: data.content || null,
      amount: data.betAmount,
    };
    try {
      const response = await postApi<RoomCreateResponse>('/rooms', request);
      const created = roomToPrediction(response.room, stockName, market);
      setPredictions((current) => [created, ...current.filter((room) => room.id !== created.id)]);
      setAvailablePoints((current) => Math.max(0, current - data.betAmount));
      setIsCreateOpen(false);
      setCreatedMessage(`커뮤니티를 만들고 ${data.betAmount.toLocaleString()}P를 냈어요.`);
    } catch (error) {
      setSubmitError(apiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  const symbol = toTradingViewSymbol(stockCode, market);
  return (
    <div>
      {createdMessage && <div role="status" className="status-banner--info fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-lg border border-white/10 bg-[#20252f] px-4 py-3 text-xs font-bold text-white shadow-2xl"><span className="mr-2 inline-grid size-4 place-items-center rounded-full bg-white text-[10px] text-[#20252f]">✓</span>{createdMessage}</div>}
      <div className="mb-5"><TradingViewChart symbol={symbol} height={420} /></div>
      <div className="mb-1 flex items-start justify-between gap-4">
        <div><h2 className="text-lg font-bold text-white">{stockName} 커뮤니티</h2><p className="mt-1 text-sm text-white/40">사용자가 만든 방이에요. 판가름 날짜에 결과가 자동으로 정해져요.</p></div>
        <div className="flex shrink-0 items-center gap-2"><span className="rounded border border-black/50 bg-white/3 px-3.5 py-2 text-xs font-bold text-blue-400">진행 중</span><button type="button" onClick={() => { setSubmitError(''); setIsCreateOpen(true); }} className="rounded-lg bg-blue-400 px-6 py-3 text-sm font-semibold text-black">+ 커뮤니티 만들기</button></div>
      </div>

      {loading ? (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-[#1c2029]" />)}</div>
      ) : loadError ? (
        <div role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-500/5 p-5 text-sm text-red-300">커뮤니티를 불러오지 못했습니다: {loadError}<button type="button" onClick={() => void loadRooms()} className="ml-3 underline">다시 시도</button></div>
      ) : predictions.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#15181f] px-5 py-14 text-center"><p className="font-bold text-white">아직 만들어진 커뮤니티가 없어요.</p><p className="mt-2 text-sm text-white/40">첫 번째 커뮤니티를 만들어 의견을 나눠보세요.</p></div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{predictions.map((prediction) => <CommunityCard key={prediction.id} prediction={prediction} onClick={setSelectedId} />)}</div>
      )}

      {isCreateOpen && <CommunityCreateModal stockName={stockName} pointBalance={availablePoints} submitting={submitting} submitError={submitError} onClose={() => { if (!submitting) setIsCreateOpen(false); }} onSubmit={(data) => void handleCreateSubmit(data)} />}
    </div>
  );
}
