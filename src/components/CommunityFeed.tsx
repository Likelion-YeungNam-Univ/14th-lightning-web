import { useCallback, useEffect, useState } from 'react';
import { ApiError, getApi, postApi } from '../api/client';
import type {
  CommunityCurrency,
  CommunityPrediction,
  RoomCreateRequest,
  RoomCreateResponse,
  RoomDetailResponse,
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

const selectedRoomKey = (stockCode: string) => `assit:community-room:${stockCode}`;

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
  const [selectedRoomDetail, setSelectedRoomDetail] = useState<CommunityPrediction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
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
      const rooms = response.items.map((room) => roomToPrediction(room, stockName, market));
      setPredictions(rooms);
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
    const savedRoomId = sessionStorage.getItem(selectedRoomKey(stockCode));
    // 종목이 바뀌면 해당 종목에서 마지막으로 열었던 방을 복원한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(savedRoomId);
    setSelectedRoomDetail(null);
    setDetailError('');
  }, [stockCode]);

  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;
    // 선택한 방의 본문과 최신 참여 현황을 서버에서 조회한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetailLoading(true);
    setDetailError('');
    void getApi<RoomDetailResponse>(`/rooms/${encodeURIComponent(selectedId)}`)
      .then((room) => {
        if (!cancelled) setSelectedRoomDetail(roomToPrediction(room, stockName, market));
      })
      .catch((error) => {
        if (!cancelled) setDetailError(apiErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => { cancelled = true; };
  }, [market, selectedId, stockName]);

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

  const selectedPrediction = selectedRoomDetail
    ?? predictions.find((prediction) => prediction.id === selectedId)
    ?? null;
  if (selectedPrediction) {
    if (detailLoading && !selectedRoomDetail) {
      return <div className="grid min-h-72 place-items-center"><div className="size-7 animate-spin rounded-full border-2 border-white/15 border-t-blue-400" aria-label="커뮤니티 상세 불러오는 중" /></div>;
    }
    if (detailError) {
      return <div role="alert" className="rounded-xl border border-red-400/20 bg-red-500/5 p-5 text-sm text-red-300">커뮤니티 상세를 불러오지 못했습니다: {detailError}<button type="button" onClick={() => { sessionStorage.removeItem(selectedRoomKey(stockCode)); setSelectedId(null); setSelectedRoomDetail(null); }} className="ml-3 underline">목록으로 돌아가기</button></div>;
    }
    return <CommunityDetail prediction={selectedPrediction} stockCode={stockCode} pointBalance={pointBalance} authenticated={authenticated} onPointsSpent={(amount) => onSpendPoints?.(amount)} onRoomDeleted={() => {
      const deletedId = selectedPrediction.id;
      setPredictions((current) => current.filter((room) => room.id !== deletedId));
      sessionStorage.removeItem(selectedRoomKey(stockCode));
      setSelectedId(null);
      setSelectedRoomDetail(null);
      setCreatedMessage('커뮤니티 방을 삭제했어요.');
    }} onBack={() => { sessionStorage.removeItem(selectedRoomKey(stockCode)); setSelectedId(null); setSelectedRoomDetail(null); }} />;
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
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{predictions.map((prediction) => <CommunityCard key={prediction.id} prediction={prediction} onClick={(roomId) => { sessionStorage.setItem(selectedRoomKey(stockCode), roomId); setSelectedRoomDetail(null); setSelectedId(roomId); }} onDelete={prediction.id.startsWith('local-created-') ? deleteLocalRoom : undefined} />)}</div>
      )}

      {isCreateOpen && <CommunityCreateModal stockName={stockName} stockCode={stockCode} currency={currencyForMarket(market)} pointBalance={pointBalance} submitting={submitting} submitError={submitError} onClose={() => { if (!submitting) setIsCreateOpen(false); }} onSubmit={(data) => void handleCreateSubmit(data)} />}
    </div>
  );
}
