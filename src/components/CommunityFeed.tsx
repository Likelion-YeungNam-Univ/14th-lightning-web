export function CommunityFeed() {
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
      <h2 className="mb-0 mt-5 text-lg font-bold text-[#f2f3f5]">
        커뮤니티를 준비하고 있어요
      </h2>
      <p className="mb-0 mt-2 text-sm text-[#9aa3b2]">
        종목에 대한 다양한 의견을 나눌 수 있는 공간이 곧 열립니다.
      </p>
    </section>
  );
}
