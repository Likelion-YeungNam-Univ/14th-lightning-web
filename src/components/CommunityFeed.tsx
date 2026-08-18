type Stance = "간다" | "안간다";

export interface CommunityPost {
  id: string;
  stance: Stance;
  resultDateShort: string;
  title: string;
  targetPrice: string;
  participants: number;
  maxParticipants: number;
  pot: number;
  fillPercent: number;
}

const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "1",
    stance: "간다",
    resultDateShort: "09.30",
    title: "9월 말까지 80,000원 간다",
    targetPrice: "80,000원",
    participants: 3,
    maxParticipants: 4,
    pot: 1500,
    fillPercent: 92,
  },
  {
    id: "2",
    stance: "안간다",
    resultDateShort: "09.12",
    title: "실적 발표 전에 80,000원 아래로 내려간다",
    targetPrice: "80,000원",
    participants: 3,
    maxParticipants: 4,
    pot: 1500,
    fillPercent: 65,
  },
  {
    id: "3",
    stance: "간다",
    resultDateShort: "10.15",
    title: "공개 자료 반영되면 80,000원 다시 간다",
    targetPrice: "80,000원",
    participants: 4,
    maxParticipants: 4,
    pot: 2000,
    fillPercent: 92,
  },
  {
    id: "4",
    stance: "안간다",
    resultDateShort: "09.25",
    title: "추석 전 조정이 올지 지켜본다",
    targetPrice: "80,000원",
    participants: 1,
    maxParticipants: 4,
    pot: 500,
    fillPercent: 25,
  },
];

function StanceBadge({ stance }: { stance: Stance }) {
  const isGo = stance === "간다";
  return (
    <span
      className={`rounded px-2 py-0.5 text-[11px] font-bold ${
        isGo ? "bg-[#1f3d2c] text-[#5fd489]" : "bg-[#402a1c] text-[#f2a35b]"
      }`}
    >
      {stance} 우세
    </span>
  );
}

function CommunityEmptyState() {
  return (
    <section className="flex min-h-[360px] flex-col items-center justify-center px-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-full border border-[#4d9fff]/35 bg-[#1c2029]"
      >
        <svg viewBox="0 0 24 24" className="size-6 text-[#d8ccff]">
          <path
            fill="currentColor"
            d="M12 3C6.75 3 2.5 6.36 2.5 10.5c0 2.32 1.35 4.42 3.45 5.8l-.88 3.35a.75.75 0 0 0 1.09.84l3.84-2.2c.65.14 1.32.21 2 .21 5.25 0 9.5-3.36 9.5-7.5S17.25 3 12 3Z"
          />
        </svg>
      </div>
      <h2 className="mb-0 mt-5 text-lg font-bold text-[#f2f3f5]">커뮤니티를 준비하고 있어요</h2>
      <p className="mb-0 mt-2 text-sm text-[#9aa3b2]">종목에 대한 다양한 의견을 나눌 수 있는 공간이 곧 열립니다.</p>
    </section>
  );
}

interface CommunityFeedProps {
  posts?: CommunityPost[];
  onOpenPost?: (id: string) => void;
}

export function CommunityFeed({ posts = COMMUNITY_POSTS, onOpenPost }: CommunityFeedProps) {
  if (posts.length === 0) {
    return <CommunityEmptyState />;
  }

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <button
          key={post.id}
          type="button"
          onClick={() => onOpenPost?.(post.id)}
          className="flex flex-col items-start rounded-xl border border-white/10 bg-[#1c2029] p-4 text-left transition-colors hover:border-white/20"
        >
          <div className="mb-2.5 flex items-center gap-2">
            <StanceBadge stance={post.stance} />
            <span className="text-[11px] text-[#9aa3b2]">판가름 {post.resultDateShort}</span>
          </div>
          <p className="mb-2.5 text-sm font-semibold leading-snug text-[#f2f3f5]">{post.title}</p>
          <p className="mb-1.5 text-xs font-medium text-[#4d9fff]">목표가 {post.targetPrice}</p>
          <p className="mb-3 text-[11px] text-[#9aa3b2]">
            참여 {post.participants}/{post.maxParticipants}명 · 판돈 {post.pot.toLocaleString()}P
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${post.stance === "간다" ? "bg-[#5fd489]" : "bg-[#f2a35b]"}`}
              style={{ width: `${post.fillPercent}%` }}
            />
          </div>
        </button>
      ))}
    </section>
  );
}