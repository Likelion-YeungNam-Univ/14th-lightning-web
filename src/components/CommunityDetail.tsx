import { useEffect, useState } from 'react';
import { getApi, postApi } from '../api/client';
import type { SavedCardItem } from '../types/card';
import type { CommentApiItem, CommentCreateResponse, CommentListResponse, CommunityComment, CommunityPrediction } from '../types/community';
import CommunityCardAttachModal from './CommunityCardAttachModal';

interface CommunityDetailProps {
  prediction: CommunityPrediction;
  pointBalance: number;
  authenticated?: boolean; // 로그인 여부 — 실제 인증 연결 전까지 기본 false
  stockCode: string;
  onPointsSpent?: (amount: number) => void;
  onBack: () => void;
}

function formatPrice(price: number, currency: 'KRW' | 'USD') {
  return currency === 'USD'
    ? `${price.toLocaleString()}달러`
    : `${price.toLocaleString()}원`;
}

export default function CommunityDetail({
  prediction,
  pointBalance,
  authenticated = false,
  stockCode,
  onPointsSpent,
  onBack,
}: CommunityDetailProps) {
  const [betAmount, setBetAmount] = useState(500);
  const [myBet, setMyBet] = useState<'up' | 'down' | null>(null);
  const [comments, setComments] = useState(prediction.comments);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentSide, setCommentSide] = useState<'up' | 'down'>('up');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachedCard, setAttachedCard] = useState<SavedCardItem | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [participationMessage, setParticipationMessage] = useState('');
  const isDemoRoom = prediction.id.startsWith('demo-');

  function mapComment(item: CommentApiItem): CommunityComment {
    return { id: String(item.id), author: item.author_tag, side: item.side === 'down' ? 'down' : 'up', body: item.body ?? '', likes: 0, replies: [], attachedCard: item.saved_card_snapshot };
  }

  useEffect(() => {
    if (prediction.id.startsWith('demo-')) return;
    let cancelled = false;
    void getApi<CommentListResponse>(`/rooms/${encodeURIComponent(prediction.id)}/comments`)
      .then((response) => { if (!cancelled) setComments(response.items.filter((item) => !item.deleted).map(mapComment)); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [prediction.id]);

  const totalPeople = prediction.participantCount;
  const upRatio = Math.round(prediction.upRatio * 100);
  const downRatio = 100 - upRatio;
  const priceLabel = formatPrice(prediction.targetPrice, prediction.currency);
  const upPeople = Math.round((upRatio / 100) * totalPeople);
  const downPeople = totalPeople - upPeople;
  const upPool = Math.round((upRatio / 100) * prediction.totalPoints);
  const downPool = prediction.totalPoints - upPool;

  function handleBet(side: 'up' | 'down') {
    if (myBet || totalPeople >= prediction.maxParticipants) return;
    const amount = Math.min(1000, Math.max(100, betAmount));
    if (amount > pointBalance) {
      setParticipationMessage('참여 포인트가 부족해요.');
      return;
    }
    setBetAmount(amount);
    setMyBet(side);
    onPointsSpent?.(amount);
    setParticipationMessage(`${side === 'up' ? '간다' : '안 간다'}에 ${amount.toLocaleString()}P를 냈어요.`);
  }

  useEffect(() => {
    if (!participationMessage) return;
    const timer = window.setTimeout(() => setParticipationMessage(''), 3000);
    return () => window.clearTimeout(timer);
  }, [participationMessage]);

  function toggleLike(commentId: string) {
    if (!authenticated) return;
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, likedByMe: !c.likedByMe, likes: c.likes + (c.likedByMe ? -1 : 1) }
          : c,
      ),
    );
  }

  async function submitComment() {
    if (!authenticated) return;
    const body = commentDraft.trim();
    if (!body) return;
    setCommentSubmitting(true);
    setCommentError('');
    try {
      if (isDemoRoom) {
        setComments((prev) => [...prev, {
          id: `local-${Date.now()}`,
          author: '나',
          side: commentSide,
          body,
          likes: 0,
          replies: [],
          attachedCard: attachedCard?.snapshot ?? null,
        }]);
        setCommentDraft('');
        setAttachedCard(null);
        return;
      }
      const response = await postApi<CommentCreateResponse>(`/rooms/${encodeURIComponent(prediction.id)}/comments`, { body, saved_card_id: attachedCard?.card_id ?? null });
      setComments((prev) => [...prev, mapComment(response.item)]);
      setCommentDraft('');
      setAttachedCard(null);
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : '댓글을 등록하지 못했습니다.');
    } finally {
      setCommentSubmitting(false);
    }
  }

  function submitReply(commentId: string) {
    if (!authenticated) return;
    const body = replyDraft.trim();
    if (!body) return;
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, replies: [...c.replies, { id: `local-reply-${Date.now()}`, author: '나', body }] }
          : c,
      ),
    );
    setReplyDraft('');
    setReplyTargetId(null);
  }

  return (
    <div className="pb-12">
      {/* 뒤로가기 */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 mb-4"
      >
        ← {prediction.stockName} 커뮤니티로 돌아가기
      </button>

      {/* 상단 헤더 */}
      <div className="rounded-2xl bg-[#1c2029] border border-white/[0.06] p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-md bg-[#1e3a2f] text-[#4ade80]">
            진행 중
          </span>
          <span className="text-xs text-white/30">
            만든 사람 {prediction.creatorName || '반도체러버'} · 2일 전
          </span>
        </div>

        <h1 className="text-white text-xl font-bold mb-6">{prediction.title}</h1>

        <div className="grid grid-cols-4 gap-4">
          <Metric label="종목" value={prediction.stockName} />
          <Metric label="판가름 날짜" value={`2026.${prediction.deadlineLabel}`} />
          <Metric label="생성자 예상가" value={priceLabel} accent />
          <Metric label="참여 인원" value={`${totalPeople} / ${prediction.maxParticipants}명`} />
        </div>
      </div>

      {/* 본문: 생성자 글 + 참여 패널 */}
      <div className="grid grid-cols-[1fr_320px] gap-4 mb-4 max-[900px]:grid-cols-1">
        <div className="rounded-2xl bg-[#1c2029] border border-white/[0.06] p-6">
          <span className="text-xs text-white/40 font-medium">생성자 글</span>
          <p className="text-sm text-white/80 leading-6 mt-3 mb-4">
            {prediction.post ||
              `${prediction.stockName}의 공개 자료와 업황 흐름을 함께 보면, 판가름 날짜까지 이 가격대는 충분히 확인할 수 있다고 봐요. 반대로 보시는 분들은 근거를 남겨주세요.`}
          </p>

          <div className="grid grid-cols-[1fr_1.3fr] gap-3">
            <div className="rounded-xl bg-[#171a21] border border-white/[0.06] h-32 flex items-center justify-center">
              <span className="text-xs text-white/25">첨부 이미지 — 차트 캡처</span>
            </div>
            <div className="rounded-xl bg-[#12213a] border border-[#2c4f7c] p-4">
              <span className="text-xs text-[#4d9fff] font-medium">첨부 링크</span>
              <p className="text-sm text-white font-semibold mt-1.5 leading-5">
                주요사항보고서
                <br />
                (자기주식취득결과보고서)
              </p>
              <p className="text-xs text-white/30 mt-3">DART · 2026.04.24</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#1c2029] border border-white/[0.06] p-5">
          <span className="text-xs text-white/40 font-medium">참여하기</span>
          <p className="text-3xl font-bold text-white mt-1">
            {prediction.totalPoints.toLocaleString()}P
          </p>
          <p className="text-xs text-white/30 mb-4">현재 판돈 · 승자가 전부 가져가요</p>

          <SideBox label="간다" ratio={upRatio} people={upPeople} pool={upPool} isUp />
          <SideBox label="안 간다" ratio={downRatio} people={downPeople} pool={downPool} isUp={false} />

          <label className="block text-xs text-white/40 mt-4 mb-1.5">참여 금액</label>
          <input
            type="text"
            inputMode="numeric"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
            className="w-full rounded-lg bg-[#171a21] border border-white/[0.06] px-3.5 py-2.5 text-sm text-white outline-none focus:border-sky-500/50"
          />
          <p className="text-xs text-white/30 mt-1.5 mb-4">
            1회 최대 1,000P · 내 포인트 {pointBalance.toLocaleString()}P
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={Boolean(myBet) || totalPeople >= prediction.maxParticipants}
              onClick={() => handleBet('up')}
              className="py-3 rounded-lg bg-[#4ade80] text-[#0b1c12] font-bold text-sm disabled:opacity-40"
            >
              간다
            </button>
            <button
              type="button"
              disabled={Boolean(myBet) || totalPeople >= prediction.maxParticipants}
              onClick={() => handleBet('down')}
              className="py-3 rounded-lg bg-[#fb923c] text-[#2b1608] font-bold text-sm disabled:opacity-40"
            >
              안 간다
            </button>
          </div>

          {myBet && (
            <div className="mt-3 rounded-lg bg-[#15181f] px-3 py-2.5 text-xs text-emerald-300">
              ✓ {myBet === 'up' ? '간다' : '안 간다'}에 {betAmount.toLocaleString()}P 참여 중
            </div>
          )}

          <p className="text-xs text-white/30 mt-3 text-center">
            판가름 날짜의 종가로 자동 판정돼요.
          </p>
        </div>
      </div>

      {/* 댓글 */}
      <div className="rounded-2xl bg-[#1c2029] border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-base">댓글 {comments.length}</h2>
          <span className="text-xs text-white/30">공개 자료에 대한 근거를 남겨보세요.</span>
        </div>

        <div className="space-y-4 mb-5">
          {comments.map((comment) => (
            <div key={comment.id}>
              <div className="flex items-start gap-2.5">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-md shrink-0 mt-0.5 ${
                    comment.side === 'up'
                      ? 'bg-[#1e3a2f] text-[#4ade80]'
                      : 'bg-[#4a2e17] text-[#fb923c]'
                  }`}
                >
                  {comment.side === 'up' ? '간다' : '안 간다'}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-white">
                    <span className="font-bold">{comment.author}</span>{' '}
                    <span className="text-white/80">{comment.body}</span>
                  </p>
                  {comment.attachedCard && <AttachedCard snapshot={comment.attachedCard} />}
                  <div className="flex items-center gap-4 mt-1.5">
                    <button
                      type="button"
                      onClick={() => toggleLike(comment.id)}
                      className={`text-xs flex items-center gap-1 ${
                        comment.likedByMe ? 'text-[#f87171]' : 'text-white/30 hover:text-white/60'
                      }`}
                    >
                      ♡ 좋아요 {comment.likes}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        authenticated &&
                        (setReplyTargetId(replyTargetId === comment.id ? null : comment.id),
                        setReplyDraft(''))
                      }
                      className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1"
                    >
                      ↩ 대댓글
                    </button>
                  </div>
                </div>
              </div>

              {/* 답글 목록 */}
              {comment.replies.length > 0 && (
                <div className="ml-8 mt-2 space-y-1.5">
                  {comment.replies.map((reply) => (
                    <p key={reply.id} className="text-sm text-white/60">
                      <span className="text-white/30">↳</span>{' '}
                      <span className="font-bold text-white/80">{reply.author}</span>{' '}
                      {reply.body}
                    </p>
                  ))}
                </div>
              )}

              {/* 답글 입력창 */}
              {replyTargetId === comment.id && (
                <div className="ml-8 mt-2 flex gap-2">
                  <input
                    type="text"
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    placeholder="대댓글을 남겨보세요."
                    className="flex-1 rounded-lg bg-[#171a21] border border-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-sky-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => submitReply(comment.id)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#3b82f6] text-white"
                  >
                    등록
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 댓글 입력창 */}
        <textarea
          value={commentDraft}
          onChange={(e) => setCommentDraft(e.target.value.slice(0, 200))}
          rows={2}
          disabled={!authenticated}
          placeholder={authenticated ? '자료를 보고 든 생각을 남겨보세요.' : '로그인하면 댓글을 남길 수 있어요.'}
          className="w-full resize-none rounded-lg bg-[#171a21] border border-white/[0.06] px-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-sky-500/50 disabled:opacity-60"
        />
        {attachedCard && <div className="mt-2 flex items-center justify-between rounded-lg border border-blue-400/30 bg-blue-500/10 p-3"><div className="min-w-0"><span className="text-[11px] font-bold text-blue-300">첨부 자료</span><p className="truncate text-sm font-semibold text-white">{snapshotText(attachedCard.snapshot, 'title') || '저장한 자료'}</p></div><button type="button" onClick={() => setAttachedCard(null)} className="ml-3 text-xs text-white/45 hover:text-white">첨부 해제</button></div>}
        {commentError && <p role="alert" className="mt-2 text-xs text-red-300">{commentError}</p>}
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!authenticated}
              onClick={() => setAttachOpen(true)}
              className="text-xs text-white/50 border border-white/10 rounded-md px-2.5 py-1.5 hover:text-white/80"
            >
              🔗 자료 카드
            </button>
            <span className="text-xs text-white/30">내 의견</span>
            <button
              type="button"
              onClick={() => setCommentSide('up')}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                commentSide === 'up'
                  ? 'bg-[#1e3a2f] text-[#4ade80] border border-[#2f6b45]'
                  : 'bg-white/[0.04] text-white/40'
              }`}
            >
              간다
            </button>
            <button
              type="button"
              onClick={() => setCommentSide('down')}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                commentSide === 'down'
                  ? 'bg-[#4a2e17] text-[#fb923c] border border-[#7a5330]'
                  : 'bg-white/[0.04] text-white/40'
              }`}
            >
              안 간다
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30">{commentDraft.length}/200 · ⌘/Ctrl+Enter</span>
            <button
              type="button"
              onClick={() => void submitComment()}
              disabled={!authenticated || commentSubmitting || !commentDraft.trim()}
              className="text-sm font-semibold px-4 py-2 rounded-full bg-[#3b82f6] text-white hover:bg-[#2563eb] disabled:opacity-40"
            >
              {commentSubmitting ? '등록 중...' : authenticated ? '댓글 남기기' : '로그인하고 댓글 쓰기'}
            </button>
          </div>
        </div>
      </div>
      {attachOpen && <CommunityCardAttachModal stockCode={stockCode} selected={attachedCard} onClose={() => setAttachOpen(false)} onSelect={(item) => { setAttachedCard(item); setAttachOpen(false); }} />}
      {participationMessage && <div role="status" className="status-banner--info fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-lg border border-white/10 bg-[#20252f] px-4 py-3 text-xs font-bold text-white shadow-2xl"><span className="mr-2">✓</span>{participationMessage}</div>}
    </div>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-white/30 mb-1">{label}</p>
      <p className={`text-sm font-bold ${accent ? 'text-[#4d9fff]' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function SideBox({
  label,
  ratio,
  people,
  pool,
  isUp,
}: {
  label: string;
  ratio: number;
  people: number;
  pool: number;
  isUp: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 mb-2.5 ${
        isUp ? 'border-[#2f6b45] bg-[#152a1e]' : 'border-[#7a5330] bg-[#2a1f14]'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-sm font-bold ${isUp ? 'text-[#4ade80]' : 'text-[#fb923c]'}`}>
          {label}
        </span>
        <span className={`text-sm font-bold ${isUp ? 'text-[#4ade80]' : 'text-[#fb923c]'}`}>
          {ratio}%
        </span>
      </div>
      <p className="text-xs text-white/40 mb-2">
        {people}명 · {pool.toLocaleString()}P
      </p>
      <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className={`h-full rounded-full ${isUp ? 'bg-[#4ade80]' : 'bg-[#fb923c]'}`}
          style={{ width: `${ratio}%` }}
        />
      </div>
    </div>
  );
}

function snapshotText(snapshot: Record<string, unknown>, key: string) {
  return typeof snapshot[key] === 'string' ? String(snapshot[key]) : '';
}

function AttachedCard({ snapshot }: { snapshot: Record<string, unknown> }) {
  const title = snapshotText(snapshot, 'title') || '첨부된 자료';
  const summary = snapshotText(snapshot, 'summary_short');
  const source = snapshotText(snapshot, 'source_name');
  const url = snapshotText(snapshot, 'origin_url');
  const content = <><span className="text-[11px] font-bold text-blue-300">🔗 첨부 자료 {source && `· ${source}`}</span><strong className="mt-1 block text-sm text-white">{title}</strong>{summary && <span className="mt-1 block line-clamp-2 text-xs text-white/45">{summary}</span>}</>;
  return url ? <a href={url} target="_blank" rel="noreferrer" className="mt-2 block rounded-lg border border-blue-400/25 bg-[#12213a] p-3 hover:border-blue-400/50">{content}</a> : <div className="mt-2 rounded-lg border border-blue-400/25 bg-[#12213a] p-3">{content}</div>;
}
