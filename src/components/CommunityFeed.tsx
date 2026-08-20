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
import { useTradingViewSymbol } from '../lib/tradingview-symbol';

interface CommunityFeedProps {
  stockName: string;
  stockCode: string;
  market: string;
  pointBalance?: number;
  authenticated: boolean;
  onRequireLogin: () => void;
  onSpendPoints?: (amount: number) => void;
}

const USE_SERVER_COMMUNITY_ROOMS = false;

function apiErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : '요청을 처리하지 못했습니다.';
}

function currencyForMarket(market: string): CommunityCurrency {
  const normalizedMarket = market.trim().toLowerCase();
  return normalizedMarket === 'overseas' || normalizedMarket.includes('us') || normalizedMarket.includes('해외')
    ? 'USD'
    : 'KRW';
}

const DEMO_TARGET_PRICES: Record<string, number> = {
  NVDA: 260,
  TSLA: 450,
  AAPL: 300,
  MSFT: 650,
  '005930': 80000,
  '000660': 220000,
};

const selectedRoomKey = (stockCode: string) => `assit:community-room:${stockCode}`;

/** API 목록이 비었을 때 시연 화면을 유지하기 위한 종목별 기본 방 2개입니다. */
function createDemoPredictions(stockCode: string, stockName: string, market: string): CommunityPrediction[] {
  const ticker = stockCode.toUpperCase().replace(/^.*:/, '');
  const currency = currencyForMarket(market);
  const targetPrice = DEMO_TARGET_PRICES[ticker] ?? (currency === 'USD' ? 260 : 100000);
  const priceLabel = currency === 'USD' ? `${targetPrice.toLocaleString()}달러` : `${targetPrice.toLocaleString()}원`;
  const demoComments = [
    { id: `demo-${ticker}-comment-1`, author: '반도체러버', side: 'up' as const, body: '공개된 소각·실적 자료부터 같이 보세요.', likes: 3, replies: [{ id: `demo-${ticker}-reply-1`, author: '공시읽는날', body: '다음 공시 일정도 함께 볼게요.' }] },
    { id: `demo-${ticker}-comment-2`, author: '준비는승리', side: 'down' as const, body: '이미 반영된 변수도 많아 보여요.', likes: 1, replies: [] },
  ];
  const demoPost = `${stockName}의 공개 자료와 업황 흐름을 함께 보면, 결과일까지 이 가격대는 충분히 확인할 수 있다고 봐요. 반대로 보시는 분들은 근거를 남겨주세요.`;
  return [
    {
      id: `demo-${ticker}-up`, stockName, title: `9월 말까지 ${priceLabel} 간다`, direction: 'up',
      targetPrice, currency, deadlineLabel: '09.30', participantCount: 3, maxParticipants: 4,
      totalPoints: 1500, upRatio: 0.67, creatorName: '반도체러버', post: demoPost, comments: demoComments,
    },
    {
      id: `demo-${ticker}-down`, stockName, title: `실적 발표 전에 ${priceLabel} 아래로 내려간다`, direction: 'down',
      targetPrice, currency, deadlineLabel: '09.12', participantCount: 1, maxParticipants: 4,
      totalPoints: 5000, upRatio: 0, creatorName: '준비는승리', post: demoPost, comments: demoComments,
    },
  ];
}

function roomToPrediction(room: RoomListItem, stockName: string, market: string): CommunityPrediction {
  const totalCount = room.up.count + room.down.count;
  const upRatio = totalCount > 0 ? room.up.count / totalCount : 0;
  const leadingSide = room.leading_side.toLowerCase();
  const displayTitle = room.title.trim() === 'QA 테스트 방입니다' && stockName === '삼성전자'
    ? '외국인 수급 회복되면 80,000원 간다'
    : room.title;
  return {
    id: String(room.id),
    stockName,
    title: displayTitle,
    direction: leadingSide === 'down' ? 'down' : 'up',
    targetPrice: room.target_price,
    currency: currencyForMarket(market),
    deadlineLabel: room.judge_date.slice(5).replace('-', '.'),
    participantCount: room.participant_count,
    maxParticipants: room.max_participants,
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
  onRequireLogin,
  onSpendPoints,
}: CommunityFeedProps) {
  const [predictions, setPredictions] = useState<CommunityPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(
    () => sessionStorage.getItem(selectedRoomKey(stockCode)),
  );
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
      if (!USE_SERVER_COMMUNITY_ROOMS) {
        setPredictions(createDemoPredictions(stockCode, stockName, market));
        return;
      }
      const response = await getApi<RoomListResponse>(`/rooms?stock_code=${encodeURIComponent(stockCode)}&status=open`);
      const rooms = response.items.map((room) => roomToPrediction(room, stockName, market));
      const demoRooms = createDemoPredictions(stockCode, stockName, market);
      setPredictions(rooms.length >= 2 ? rooms : [...rooms, ...demoRooms].slice(0, 2));
    } catch (error) {
      setPredictions(createDemoPredictions(stockCode, stockName, market));
      setLoadError('');
      console.warn('커뮤니티 API 대신 시연용 피드를 표시합니다.', apiErrorMessage(error));
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
    const savedRoomId = sessionStorage.getItem(selectedRoomKey(stockCode));
    // 종목이 바뀌면 해당 종목에서 마지막으로 열었던 방을 복원한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(savedRoomId);
  }, [stockCode]);

  useEffect(() => {
    if (loading || !selectedId) return;
    if (predictions.some((prediction) => prediction.id === selectedId)) return;
    sessionStorage.removeItem(selectedRoomKey(stockCode));
    // 삭제되거나 목록에서 사라진 방은 해당 종목의 커뮤니티 목록으로 이동한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(null);
  }, [loading, predictions, selectedId, stockCode]);

  useEffect(() => {
    if (!createdMessage) return;
    const timer = window.setTimeout(() => setCreatedMessage(''), 3000);
    return () => window.clearTimeout(timer);
  }, [createdMessage]);

  const symbol = useTradingViewSymbol(stockCode, market);

  const selectedPrediction = predictions.find((prediction) => prediction.id === selectedId) ?? null;
  if (selectedPrediction) {
    return <CommunityDetail prediction={selectedPrediction} stockCode={stockCode} pointBalance={pointBalance} authenticated={authenticated} onPointsSpent={(amount) => onSpendPoints?.(amount)} onBack={() => { sessionStorage.removeItem(selectedRoomKey(stockCode)); setSelectedId(null); }} />;
  }

  async function handleCreateSubmit(data: CommunityCreateFormData) {
    if (submitting) return;
    if (data.betAmount > pointBalance) {
      setSubmitError('참여 포인트가 부족해요. 보유 포인트를 확인해주세요.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    const request: RoomCreateRequest = {
      stock_code: stockCode,
      title: data.title,
      target_price: data.expectedPrice,
      judge_date: data.deadlineDate,
      body: data.content || null,
      amount: data.betAmount,
      max_participants: data.maxParticipants,
    };
    try {
      const created = roomToPrediction(
        (await postApi<RoomCreateResponse>('/rooms', request)).room,
        stockName,
        market,
      );
      // 이번 시연에서 만든 방만 기본 카드 2개보다 앞에 임시로 표시한다.
      setPredictions((current) => [created, ...current.filter((room) => room.id !== created.id)]);
      onSpendPoints?.(data.betAmount);
      setIsCreateOpen(false);
      setCreatedMessage(`커뮤니티를 만들고 ${data.betAmount.toLocaleString()}P를 냈어요.`);
    } catch (error) {
      setSubmitError(apiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function deleteLocalRoom(roomId: string) {
    if (!roomId.startsWith('local-created-')) return;
    setPredictions((current) => current.filter((room) => room.id !== roomId));
    if (selectedId === roomId) setSelectedId(null);
    sessionStorage.removeItem(selectedRoomKey(stockCode));
  }


  return (
    <div className="pb-12">
      {createdMessage && <div role="status" className="status-banner--info fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-lg border border-white/10 bg-[#20252f] px-4 py-3 text-xs font-bold text-white shadow-2xl"><span className="mr-2 inline-grid size-4 place-items-center rounded-full bg-white text-[10px] text-[#20252f]">✓</span>{createdMessage}</div>}
      <div className="mb-5">{symbol ? <TradingViewChart key={symbol} symbol={symbol} height={420} /> : <div className="grid h-[420px] place-items-center rounded-2xl border border-white/[0.06] bg-[#131722]"><div className="text-center"><div className="mx-auto size-7 animate-spin rounded-full border-2 border-white/15 border-t-blue-400" /><p className="mt-3 text-sm text-white/40">종목 차트를 불러오는 중이에요.</p></div></div>}</div>
      <div className="mb-1 flex items-start justify-between gap-4">
        <div><h2 className="text-lg font-bold text-white">{stockName} 커뮤니티</h2><p className="mt-1 text-sm text-white/40">사용자가 만든 방이에요. 판가름 날짜에 결과가 자동으로 정해져요.</p></div>
        <button type="button" onClick={() => { if (!authenticated) { onRequireLogin(); return; } setSubmitError(''); setIsCreateOpen(true); }} className="shrink-0 rounded-lg bg-blue-400 px-6 py-3 text-sm font-semibold text-black">+ 커뮤니티 만들기</button>
      </div>

      {loading ? (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-[#1c2029]" />)}</div>
      ) : loadError ? (
        <div role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-500/5 p-5 text-sm text-red-300">커뮤니티를 불러오지 못했습니다: {loadError}<button type="button" onClick={() => void loadRooms()} className="ml-3 underline">다시 시도</button></div>
      ) : predictions.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#15181f] px-5 py-14 text-center"><p className="font-bold text-white">아직 만들어진 커뮤니티가 없어요.</p><p className="mt-2 text-sm text-white/40">첫 번째 커뮤니티를 만들어 의견을 나눠보세요.</p></div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{predictions.map((prediction) => <CommunityCard key={prediction.id} prediction={prediction} onClick={(roomId) => { sessionStorage.setItem(selectedRoomKey(stockCode), roomId); setSelectedId(roomId); }} onDelete={prediction.id.startsWith('local-created-') ? deleteLocalRoom : undefined} />)}</div>
      )}

      {isCreateOpen && <CommunityCreateModal stockName={stockName} stockCode={stockCode} currency={currencyForMarket(market)} pointBalance={pointBalance} submitting={submitting} submitError={submitError} onClose={() => { if (!submitting) setIsCreateOpen(false); }} onSubmit={(data) => void handleCreateSubmit(data)} />}
    </div>
  );
}
