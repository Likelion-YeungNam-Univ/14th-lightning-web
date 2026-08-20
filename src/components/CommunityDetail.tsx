import { useEffect, useState } from 'react';
import { deleteApi, getApi, postApi } from '../api/client';
import type { SavedCardItem } from '../types/card';
import type { BettingEntryResponse, CommentApiItem, CommentCreateResponse, CommentLikeResponse, CommentListResponse, CommunityComment, CommunityPrediction, RoomDeleteResponse } from '../types/community';
import { LOGIN_ID_STORAGE_KEY } from '../types/session';
import CommunityCardAttachModal from './CommunityCardAttachModal';

interface CommunityDetailProps {
  prediction: CommunityPrediction;
  pointBalance: number;
  authenticated?: boolean; // 로그인 여부 — 실제 인증 연결 전까지 기본 false
  stockCode: string;
  onPointsSpent?: (amount: number) => void;
  onRoomDeleted: () => void;
  onBack: () => void;
}

function formatPrice(price: number, currency: 'KRW' | 'USD') {
  return currency === 'USD'
    ? `${price.toLocaleString()}달러`
    : `${price.toLocaleString()}원`;
}

const demoCommentsKey = (roomId: string) => `assit:demo-comments:${roomId}`;

function initialComments(prediction: CommunityPrediction) {
  if (!prediction.id.startsWith('demo-')) return prediction.comments;
  try {
    const saved = JSON.parse(localStorage.getItem(demoCommentsKey(prediction.id)) ?? 'null') as unknown;
    return Array.isArray(saved) ? saved as CommunityComment[] : prediction.comments;
  } catch {
    return prediction.comments;
  }
}

function saveDemoComments(roomId: string, comments: CommunityComment[]) {
  try {
    localStorage.setItem(demoCommentsKey(roomId), JSON.stringify(comments));
  } catch {
    // 저장 공간을 사용할 수 없어도 현재 화면의 댓글 기능은 유지한다.
  }
}

type SavedParticipation = { side: 'up' | 'down'; amount: number };

function participationKey(roomId: string) {
  const loginId = localStorage.getItem(LOGIN_ID_STORAGE_KEY) ?? 'anonymous';
  return `assit:community-entry:${loginId}:${roomId}`;
}

function readParticipation(roomId: string): SavedParticipation | null {
  try {
    const value = JSON.parse(localStorage.getItem(participationKey(roomId)) ?? 'null') as SavedParticipation | null;
    return value && (value.side === 'up' || value.side === 'down') && Number.isFinite(value.amount) ? value : null;
  } catch {
    return null;
  }
}

export default function CommunityDetail({
  prediction,
  pointBalance,
  authenticated = false,
  stockCode,
  onPointsSpent,
  onRoomDeleted,
  onBack,
}: CommunityDetailProps) {
  const savedParticipation = readParticipation(prediction.id);
  const [betAmount, setBetAmount] = useState(savedParticipation?.amount ?? 500);
  const [myBet, setMyBet] = useState<'up' | 'down' | null>(savedParticipation?.side ?? null);
  const [betSubmitting, setBetSubmitting] = useState(false);
  const [comments, setComments] = useState(() => initialComments(prediction));
  const [commentDraft, setCommentDraft] = useState('');
  const [commentSide, setCommentSide] = useState<'up' | 'down'>('up');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachedCard, setAttachedCard] = useState<SavedCardItem | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<string>>(() => new Set());
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(() => new Set());
  const [participationMessage, setParticipationMessage] = useState('');
  const [roomDeletePending, setRoomDeletePending] = useState(false);
  const [roomDeleteError, setRoomDeleteError] = useState('');
  const isDemoRoom = prediction.id.startsWith('demo-') || prediction.id.startsWith('local-created-');

  function mapComment(item: CommentApiItem): CommunityComment {
    return { id: String(item.id), author: item.author_tag, isMine: item.is_mine, side: item.side === 'down' ? 'down' : 'up', body: item.body ?? '', likes: item.like_count, likedByMe: item.liked_by_me, replies: [], attachedCard: item.saved_card_snapshot };
  }

  useEffect(() => {
    if (isDemoRoom) return;
    let cancelled = false;
    void getApi<CommentListResponse>(`/rooms/${encodeURIComponent(prediction.id)}/comments`)
      .then((response) => { if (!cancelled) setComments(response.items.filter((item) => !item.deleted).map(mapComment)); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [authenticated, isDemoRoom, prediction.id]);

  const totalPeople = prediction.participantCount;
  const upRatio = Math.round(prediction.upRatio * 100);
  const downRatio = 100 - upRatio;
  const priceLabel = formatPrice(prediction.targetPrice, prediction.currency);
  const upPeople = Math.round((upRatio / 100) * totalPeople);
  const downPeople = totalPeople - upPeople;
  const upPool = Math.round((upRatio / 100) * prediction.totalPoints);
  const downPool = prediction.totalPoints - upPool;

  async function handleBet(side: 'up' | 'down') {
    if (!authenticated) {
      setParticipationMessage('로그인 후 참여할 수 있어요.');
      return;
    }
    if (myBet || betSubmitting || totalPeople >= prediction.maxParticipants) return;
    const amount = Math.min(1000, Math.max(100, betAmount));
    if (amount > pointBalance) {
      setParticipationMessage('참여 포인트가 부족해요.');
      return;
    }
    setBetSubmitting(true);
    try {
      if (!isDemoRoom) {
        await postApi<BettingEntryResponse>(`/rooms/${encodeURIComponent(prediction.id)}/entries`, { side, amount });
      }
      localStorage.setItem(participationKey(prediction.id), JSON.stringify({ side, amount } satisfies SavedParticipation));
      setBetAmount(amount);
      setMyBet(side);
      onPointsSpent?.(amount);
      setParticipationMessage(`${side === 'up' ? '간다' : '안 간다'}에 ${amount.toLocaleString()}P를 냈어요.`);
    } catch (error) {
      setParticipationMessage(error instanceof Error ? error.message : '커뮤니티에 참여하지 못했습니다.');
    } finally {
      setBetSubmitting(false);
    }
  }

  useEffect(() => {
    if (!participationMessage) return;
    const timer = window.setTimeout(() => setParticipationMessage(''), 3000);
    return () => window.clearTimeout(timer);
  }, [participationMessage]);

  async function toggleLike(commentId: string) {
    if (!authenticated) return;
    const comment = comments.find((item) => item.id === commentId);
    if (!comment || pendingLikeIds.has(commentId)) return;

    if (isDemoRoom) {
      setComments((prev) => {
        const next = prev.map((item) => item.id === commentId
          ? { ...item, likedByMe: !item.likedByMe, likes: item.likes + (item.likedByMe ? -1 : 1) }
          : item);
        saveDemoComments(prediction.id, next);
        return next;
      });
      return;
    }

    setPendingLikeIds((current) => new Set(current).add(commentId));
    setCommentError('');
    try {
      const path = `/comments/${encodeURIComponent(commentId)}/like`;
      const response = comment.likedByMe
        ? await deleteApi<CommentLikeResponse>(path)
        : await postApi<CommentLikeResponse>(path);
      setComments((prev) => prev.map((item) => item.id === commentId
        ? { ...item, likedByMe: response.liked, likes: response.like_count }
        : item));
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : '댓글 좋아요를 변경하지 못했습니다.');
    } finally {
      setPendingLikeIds((current) => {
        const next = new Set(current);
        next.delete(commentId);
        return next;
      });
    }
  }

  async function submitComment() {
    if (!authenticated) return;
    const body = commentDraft.trim();
    if (!body) return;
    setCommentSubmitting(true);
    setCommentError('');
    try {
      if (isDemoRoom) {
        setComments((prev) => {
          const next = [...prev, {
            id: `local-${Date.now()}`,
            author: '나',
            isMine: true,
            side: commentSide,
            body,
            likes: 0,
            replies: [],
            attachedCard: attachedCard?.snapshot ?? null,
          }];
          saveDemoComments(prediction.id, next);
          return next;
        });
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

  async function deleteComment(commentId: string) {
    const comment = comments.find((item) => item.id === commentId);
    if (!comment?.isMine || pendingDeleteIds.has(commentId)) return;
    if (!window.confirm('이 댓글을 삭제할까요?')) return;

    setPendingDeleteIds((current) => new Set(current).add(commentId));
    setCommentError('');
    try {
      if (!isDemoRoom) {
        await deleteApi<null>(`/comments/${encodeURIComponent(commentId)}`);
      }
      setComments((prev) => {
        const next = prev.filter((item) => item.id !== commentId);
        if (isDemoRoom) saveDemoComments(prediction.id, next);
        return next;
      });
      if (replyTargetId === commentId) {
        setReplyTargetId(null);
        setReplyDraft('');
      }
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : '댓글을 삭제하지 못했습니다.');
    } finally {
      setPendingDeleteIds((current) => {
        const next = new Set(current);
        next.delete(commentId);
        return next;
      });
    }
  }

  async function deleteRoom() {
    if (!authenticated || roomDeletePending) return;
    if (!window.confirm('이 커뮤니티 방을 삭제할까요?')) return;

    setRoomDeletePending(true);
    setRoomDeleteError('');
    try {
      const response = await deleteApi<RoomDeleteResponse>(`/rooms/${encodeURIComponent(prediction.id)}`);
      if (!response?.removed) throw new Error('방이 삭제되지 않았습니다. 잠시 후 다시 시도해주세요.');
      onRoomDeleted();
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      const message = code === 'not_room_owner'
        ? '방을 만든 사용자만 삭제할 수 있어요.'
        : code === 'room_has_entrants'
          ? '다른 참여자가 있는 방은 삭제할 수 없어요.'
          : code === 'room_not_open'
            ? '진행 중인 방만 삭제할 수 있어요.'
            : code === 'room_not_found'
              ? '이미 삭제되었거나 존재하지 않는 방이에요.'
              : code === 'login_required'
                ? '로그인 후 방을 삭제할 수 있어요.'
                : error instanceof Error ? error.message : '방을 삭제하지 못했습니다.';
      setRoomDeleteError(message);
    } finally {
      setRoomDeletePending(false);
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
      <header className="mb-5 rounded-2xl border border-white/[0.08] bg-[#1c2029] px-6 py-5 sm:px-7">
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="rounded-md bg-[#17432f] px-3 py-1 text-xs font-bold text-[#4ade80]">
            진행 중
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/35">
              만든 사람 {prediction.creatorName || '반도체러버'} · 2일 전
            </span>
            {authenticated && !isDemoRoom && (
              <button
                type="button"
                onClick={() => void deleteRoom()}
                disabled={roomDeletePending}
                className="rounded-md border border-red-300/20 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {roomDeletePending ? '삭제 중...' : '방 삭제'}
              </button>
            )}
          </div>
        </div>

        {roomDeleteError && <p role="alert" className="mb-4 text-right text-xs text-red-300">{roomDeleteError}</p>}

        <h1 className="mb-6 text-xl font-bold tracking-[-0.02em] text-white">{prediction.title}</h1>

        <div className="grid grid-cols-4 gap-x-8 gap-y-4 max-[720px]:grid-cols-2 max-[420px]:grid-cols-1">
          <Metric label="종목" value={prediction.stockName} />
          <Metric label="결과일" value={`2026.${prediction.deadlineLabel}`} />
          <Metric label="기준 가격" value={priceLabel} accent />
          <Metric label="참여 인원" value={`${totalPeople} / ${prediction.maxParticipants}명`} />
        </div>
      </header>

      {/* 본문: 생성자 글 + 참여 패널 */}
      <div className="mb-5 grid grid-cols-[minmax(0,1fr)_380px] gap-5 max-[960px]:grid-cols-1">
        <section className="min-h-[500px] rounded-2xl border border-white/[0.06] bg-[#1c2029] p-6 sm:p-7">
          <span className="text-xs font-bold text-[#4d9fff]">작성글</span>
          <p className="mb-6 mt-3 text-[15px] leading-7 text-white/85">
            {prediction.post ||
              `${prediction.stockName}의 공개 자료와 업황 흐름을 함께 보면, 결과일까지 이 가격대는 충분히 확인할 수 있다고 봐요. 반대로 보시는 분들은 근거를 남겨주세요.`}
          </p>

          <div className="grid grid-cols-2 gap-5 max-[640px]:grid-cols-1">
            <div className="flex h-46 items-center justify-center rounded-xl border border-white/[0.04] bg-[#2a2f38]">
              <span className="text-xs text-white/35">첨부 이미지 · 차트 캡처</span>
            </div>
            <div className="flex h-46 flex-col rounded-xl border border-[#315682] bg-[#171b23] p-5">
              <span className="text-xs font-bold text-[#4d9fff]">첨부 링크</span>
              <p className="mt-3 text-sm font-bold leading-6 text-white">
                주요사항보고서
                <br />
                (자기주식취득결과보고서)
              </p>
              <p className="mt-auto text-xs text-blue-200/65">DART · 2026.04.24</p>
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-white/[0.06] bg-[#1c2029] p-6">
          <span className="text-xs font-bold text-[#4d9fff]">참여하기</span>
          <p className="mt-2 text-4xl font-bold tracking-tight text-white">
            {prediction.totalPoints.toLocaleString()}P
          </p>
          <p className="mb-5 mt-1 text-xs text-white/35">방장이 정한 참여 포인트가 쌓여요</p>

          <SideBox label="간다" ratio={upRatio} people={upPeople} pool={upPool} isUp />
          <SideBox label="안 간다" ratio={downRatio} people={downPeople} pool={downPool} isUp={false} />

          <label className="mt-4 block rounded-xl bg-[#171a21] px-4 py-3.5 text-xs text-white/45">
            참여 포인트
            <input
              type="text"
              inputMode="numeric"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
              className="mt-1 block w-full border-0 bg-transparent p-0 text-lg font-bold text-white outline-none"
            />
          </label>
          <p className="mb-4 mt-2 text-[11px] text-white/30">
            1회 최대 1,000P · 내 포인트 {pointBalance.toLocaleString()}P
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={Boolean(myBet) || betSubmitting || totalPeople >= prediction.maxParticipants}
              onClick={() => void handleBet('up')}
              className="rounded-lg bg-[#5bd49e] py-3.5 text-sm font-bold text-[#0b1c12] disabled:opacity-40"
            >
              간다
            </button>
            <button
              type="button"
              disabled={Boolean(myBet) || betSubmitting || totalPeople >= prediction.maxParticipants}
              onClick={() => void handleBet('down')}
              className="rounded-lg bg-[#f2a45f] py-3.5 text-sm font-bold text-[#2b1608] disabled:opacity-40"
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
             결과일의 종가로 자동 판정돼요.
          </p>
        </aside>
      </div>

      {/* 댓글 */}
      <div>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-white">댓글 {comments.length}</h2>
          <span className="text-right text-xs text-white/40">공개 자료에 대한 근거를 남겨보세요.</span>
        </div>

        <div className="mb-5 space-y-2">
          {comments.map((comment) => (
            <div key={comment.id}>
              <div className="flex items-start gap-3 rounded-xl bg-[#1c2029] px-4 py-4">
                <span
                  className={`mt-0.5 shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
                    comment.side === 'up'
                      ? 'bg-[#1e3a2f] text-[#4ade80]'
                      : 'bg-[#4a2e17] text-[#fb923c]'
                  }`}
                >
                  {comment.side === 'up' ? '간다' : '안 간다'}
                </span>
                <div className="min-w-0 flex-1 sm:flex sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-sm leading-6 text-white">
                      <span className="font-bold">{comment.author}</span>{' '}
                      <span className="text-white/85">{comment.body}</span>
                    </p>
                    {comment.attachedCard && <AttachedCard snapshot={comment.attachedCard} />}
                  </div>
                  <div className="mt-2 flex shrink-0 items-center gap-4 sm:mt-0">
                    <button
                      type="button"
                      onClick={() => void toggleLike(comment.id)}
                      disabled={pendingLikeIds.has(comment.id)}
                      className={`flex items-center gap-1 text-xs ${
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
                      className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60"
                    >
                      ↩ 대댓글
                    </button>
                    {comment.isMine && (
                      <button
                        type="button"
                        onClick={() => void deleteComment(comment.id)}
                        disabled={pendingDeleteIds.has(comment.id)}
                        className="text-xs text-white/30 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pendingDeleteIds.has(comment.id) ? '삭제 중...' : '삭제'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 답글 목록 */}
              {comment.replies.length > 0 && (
                <div className="ml-8 mt-1 space-y-1">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="rounded-lg bg-[#151920] px-4 py-3 text-sm text-white/65">
                      <span className="mr-2 text-blue-300/70">↳</span>
                      <span className="font-bold text-white/85">{reply.author}</span>{' '}
                      <span>{reply.body}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 답글 입력창 */}
              {replyTargetId === comment.id && (
                <div className="ml-8 mt-1 flex gap-2 rounded-lg bg-[#151920] p-2">
                  <input
                    type="text"
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    placeholder="대댓글을 남겨보세요."
                    className="min-w-0 flex-1 rounded-lg border border-white/[0.06] bg-[#101319] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-sky-500/50"
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
        <div className="rounded-xl border border-white/10 bg-[#1c2029] p-3.5">
          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value.slice(0, 200))}
            rows={3}
            disabled={!authenticated}
            placeholder={authenticated ? '자료를 보고 든 생각을 남겨보세요.' : '로그인하면 댓글을 남길 수 있어요.'}
            className="w-full resize-none rounded-lg border border-white/10 bg-[#11151b] px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-sky-500/50 disabled:opacity-60"
          />
          {attachedCard && <div className="mt-2 flex items-center justify-between rounded-lg border border-blue-400/30 bg-blue-500/10 p-3"><div className="min-w-0"><span className="text-[11px] font-bold text-blue-300">첨부 자료</span><p className="truncate text-sm font-semibold text-white">{snapshotText(attachedCard.snapshot, 'title') || '저장한 자료'}</p></div><button type="button" onClick={() => setAttachedCard(null)} className="ml-3 text-xs text-white/45 hover:text-white">첨부 해제</button></div>}
          {commentError && <p role="alert" className="mt-2 text-xs text-red-300">{commentError}</p>}
          <div className="mt-2.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!authenticated}
              onClick={() => setAttachOpen(true)}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white/80"
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

          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-white/30">{commentDraft.length}/200 · ⌘/Ctrl+Enter</span>
            <button
              type="button"
              onClick={() => void submitComment()}
              disabled={!authenticated || commentSubmitting || !commentDraft.trim()}
              className="rounded-lg bg-[#4d9fff] px-4 py-2 text-sm font-semibold text-[#07111f] hover:bg-[#6aafff] disabled:opacity-40"
            >
              {commentSubmitting ? '등록 중...' : authenticated ? '댓글 남기기' : '로그인하고 댓글 쓰기'}
            </button>
          </div>
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
      <p className="mb-1.5 text-xs text-white/35">{label}</p>
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
      className="mb-3 rounded-xl border border-transparent bg-[#171b21] p-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-base font-bold ${isUp ? 'text-[#4ade80]' : 'text-[#fb923c]'}`}>
          {label}
        </span>
        <span className={`text-base font-bold ${isUp ? 'text-[#4ade80]' : 'text-[#fb923c]'}`}>
          {ratio}%
        </span>
      </div>
      <p className="mb-2.5 text-xs text-white/45">
        {people}명 · {pool.toLocaleString()}P
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.1]">
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
