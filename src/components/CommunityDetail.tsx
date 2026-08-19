import { useEffect, useRef, useState } from 'react';
import type { CommunityPrediction } from '../types/community';
import type { SavedCardItem } from '../types/card';
import { SavedCardAttachModal } from './SavedCardAttachModal';

interface CommunityDetailProps {
  prediction: CommunityPrediction;
  stockCode: string;
  pointBalance: number;
  authenticated?: boolean; // 로그인 여부 — 실제 인증 연결 전까지 기본 false
  onBack: () => void;
  onDelete: () => void;
}

function formatPrice(price: number, currency: 'KRW' | 'USD') {
  return currency === 'USD'
    ? `${price.toLocaleString()}달러`
    : `${price.toLocaleString()}원`;
}

export default function CommunityDetail({
  prediction,
  stockCode,
  pointBalance,
  authenticated = false,
  onBack,
  onDelete,
}: CommunityDetailProps) {
  const [betAmount, setBetAmount] = useState(500);
  const [myBet, setMyBet] = useState<'up' | 'down' | null>(null);
  const [comments, setComments] = useState(prediction.comments);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentSide, setCommentSide] = useState<'up' | 'down'>('up');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [savedCardModalOpen, setSavedCardModalOpen] = useState(false);
  const [attachedCard, setAttachedCard] = useState<SavedCardItem | null>(null);
  const [participationNotice, setParticipationNotice] = useState('');
  const toastTimerRef = useRef<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [participantCount, setParticipantCount] = useState(prediction.participantCount);
  const [upParticipantCount, setUpParticipantCount] = useState(
    Math.round(prediction.upRatio * prediction.participantCount),
  );
  const [totalPoints, setTotalPoints] = useState(prediction.totalPoints);

  useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
  }, []);

  function showParticipationNotice(message: string) {
    setParticipationNotice(message);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setParticipationNotice(''), 2600);
  }

  const totalPeople = participantCount;
  const upRatio = totalPeople ? Math.round((upParticipantCount / totalPeople) * 100) : 0;
  const downRatio = 100 - upRatio;
  const priceLabel = formatPrice(prediction.targetPrice, prediction.currency);
  const upPeople = Math.round((upRatio / 100) * totalPeople);
  const downPeople = totalPeople - upPeople;
  const upPool = Math.round((upRatio / 100) * totalPoints);
  const downPool = totalPoints - upPool;

  function handleBet(side: 'up' | 'down', points = 0) {
    if (myBet || totalPeople >= prediction.maxParticipants) return;
    if (!points || points > 1000 || points > pointBalance) {
      showParticipationNotice('참여 포인트는 보유 포인트 안에서 1,000P 이하로 입력해주세요.');
      return;
    }
    setMyBet(side);
    setParticipantCount((current) => current + 1);
    if (side === 'up') setUpParticipantCount((current) => current + 1);
    setTotalPoints((current) => current + points);
    showParticipationNotice(`${side === 'up' ? '간다' : '안 간다'}에 ${points.toLocaleString()}P를 참여 포인트로 냈어요.`);
  }

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

  function submitComment() {
    if (!authenticated) return;
    const body = commentDraft.trim();
    if (!body) return;
    setComments((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        author: '나',
        side: commentSide,
        body,
        likes: 0,
        replies: [],
        attachedCard: attachedCard
          ? {
              title: typeof attachedCard.snapshot.title === 'string' ? attachedCard.snapshot.title : '저장한 자료',
              sourceName: typeof attachedCard.snapshot.source_name === 'string' ? attachedCard.snapshot.source_name : attachedCard.tab,
            }
          : undefined,
      },
    ]);
    setCommentDraft('');
    setAttachedCard(null);
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
    <div>
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
          <div className="flex items-center gap-3"><span className="text-xs text-white/30">만든 사람 {prediction.creatorName || '반도체러버'} · 2일 전</span><button type="button" onClick={() => setDeleteConfirmOpen(true)} className="text-xs text-white/35 hover:text-[#ff8d72]">삭제</button></div>
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
            {totalPoints.toLocaleString()}P
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
              onClick={() => handleBet('up', betAmount)}
              className="py-3 rounded-lg bg-[#4ade80] text-[#0b1c12] font-bold text-sm disabled:opacity-40"
            >
              간다
            </button>
            <button
              type="button"
              disabled={Boolean(myBet) || totalPeople >= prediction.maxParticipants}
              onClick={() => handleBet('down', betAmount)}
              className="py-3 rounded-lg bg-[#fb923c] text-[#2b1608] font-bold text-sm disabled:opacity-40"
            >
              안 간다
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-white/30">
            판가름 날짜의 종가로 자동 판정돼요.
          </p>
        </div>
      </div>

      {/* 댓글 */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#1c2029] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-base">댓글 {comments.length}</h2>
          <span className="text-xs text-white/30">공개 자료에 대한 근거를 남겨보세요.</span>
        </div>

        <div className="mb-3 space-y-2.5">
          {comments.map((comment) => (
            <div key={comment.id}>
              <div className="rounded-xl bg-[#171b23] px-4 py-3.5">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
                    comment.side === 'up'
                      ? 'bg-[#1e3a2f] text-[#4ade80]'
                      : 'bg-[#4a2e17] text-[#fb923c]'
                    }`}
                  >
                    {comment.side === 'up' ? '간다' : '안 간다'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white"><span className="font-bold">{comment.author}</span>{' '}<span className="text-white/85">{comment.body}</span></p>
                    {comment.attachedCard && <div className="mt-2 rounded-lg border border-[#2c4f7c] bg-[#12213a] px-3 py-2"><span className="text-[10px] font-bold text-[#79b8ff]">첨부 자료 · {comment.attachedCard.sourceName}</span><p className="mt-1 text-xs font-semibold text-[#e3eefc]">{comment.attachedCard.title}</p></div>}
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-4">
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
        <div className="rounded-xl border border-[#3a4250] bg-[#171a21] p-3">
        <textarea
          value={commentDraft}
          onChange={(e) => setCommentDraft(e.target.value.slice(0, 200))}
          rows={2}
          disabled={!authenticated}
          placeholder={authenticated ? '자료를 보고 든 생각을 남겨보세요.' : '로그인하면 댓글을 남길 수 있어요.'}
          className="h-16 w-full resize-none border-0 bg-transparent p-0 text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-60"
        />
        {attachedCard && <div className="mt-2 flex items-center justify-between rounded-md border border-[#2c4f7c] bg-[#12213a] px-2.5 py-2"><span className="truncate text-xs text-[#b9d9ff]">⌁ {typeof attachedCard.snapshot.title === 'string' ? attachedCard.snapshot.title : '저장한 자료'}</span><button type="button" onClick={() => setAttachedCard(null)} className="ml-3 text-sm text-[#9aa3b2] hover:text-white" aria-label="첨부 자료 제거">×</button></div>}
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSavedCardModalOpen(true)}
              className="rounded-full border border-[#3a4250] px-2.5 py-1.5 text-xs text-white/60 hover:text-white"
            >
              ↪ 자료 카드
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
            <span className="hidden text-xs text-white/30 sm:inline">{commentDraft.length}/200 · ⌘/Ctrl+Enter</span>
            <button
              type="button"
              onClick={submitComment}
              disabled={!authenticated}
              className="text-sm font-semibold px-4 py-2 rounded-full bg-[#3b82f6] text-white hover:bg-[#2563eb] disabled:opacity-40"
            >
              {authenticated ? '댓글 남기기' : '로그인하고 댓글 쓰기'}
            </button>
          </div>
        </div></div>
      </div>
      {savedCardModalOpen && <SavedCardAttachModal stockCode={stockCode} onClose={() => setSavedCardModalOpen(false)} onSelect={(item) => { setAttachedCard(item); setSavedCardModalOpen(false); }} />}
      {deleteConfirmOpen && <div className="fixed inset-0 z-70 grid place-items-center bg-black/70 p-4" onMouseDown={() => setDeleteConfirmOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="delete-community-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-90 rounded-xl border border-[#303744] bg-[#1c2029] p-5 shadow-2xl"><h2 id="delete-community-title" className="text-base font-bold">커뮤니티를 삭제할까요?</h2><p className="mt-3 text-sm leading-5 text-[#9aa3b2]">삭제한 커뮤니티와 참여 기록은 이 화면에서 되돌릴 수 없어요.</p><div className="mt-6 grid grid-cols-2 gap-2"><button type="button" onClick={() => setDeleteConfirmOpen(false)} className="h-10 rounded-md border border-[#3a4250] text-sm text-[#c8ccd4]">취소</button><button type="button" onClick={onDelete} className="h-10 rounded-md bg-[#e15b4d] text-sm font-bold text-white">삭제하기</button></div></section></div>}
      {participationNotice && <div role="status" className="fixed bottom-6 left-1/2 z-80 -translate-x-1/2 rounded-md border border-[#2f6b45] bg-[#152a1e] px-4 py-2 text-xs font-medium text-[#c6f7dc] shadow-2xl"><span aria-hidden="true" className="mr-1.5 text-[#4ade80]">●</span>{participationNotice}</div>}
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
