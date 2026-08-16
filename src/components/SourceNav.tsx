import { useState } from "react";

type SourceTab = "youtube" | "dart" | "policy" | "bok" | "fed" | "saved";

type SourceNavProps = {
  market: string;
  disabled: boolean;
};

const tabsByMarket: Record<string, { id: Exclude<SourceTab, "saved">; label: string }[]> = {
  domestic: [
    { id: "youtube", label: "유튜브" },
    { id: "dart", label: "공시(DART)" },
    { id: "policy", label: "규제동향" },
    { id: "bok", label: "한국은행" },
    { id: "fed", label: "미국 Fed" },
  ],
  overseas: [
    { id: "youtube", label: "유튜브" },
    { id: "dart", label: "공시(SEC)" },
    { id: "policy", label: "규제동향" },
    { id: "fed", label: "미국 Fed" },
  ],
};

export function SourceNav({ market, disabled }: SourceNavProps) {
  const [activeTab, setActiveTab] = useState<SourceTab>("youtube");
  const sourceTabs = tabsByMarket[market] ?? tabsByMarket.domestic;

  const tabClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors duration-[180ms] ease-[cubic-bezier(.23,1,.32,1)] max-[760px]:px-[11px] max-[760px]:py-[7px] ${
      active
        ? "border-[#4d9fff]/60 bg-[#1c2029] text-[#f2f3f5]"
        : "border-transparent bg-[#1c2029] text-[#9aa3b2] hover:bg-[#262b35] hover:text-[#f2f3f5]"
    } disabled:cursor-not-allowed disabled:opacity-55`;

  return (
    <nav
      aria-label="출처 탭"
      className="-mx-6 flex min-h-[50px] items-center gap-2 overflow-x-auto bg-[#0f1115] px-6 py-2 [scrollbar-width:none] max-[760px]:min-h-[58px] max-[760px]:px-[18px] [&::-webkit-scrollbar]:hidden"
    >
      {sourceTabs.map((source) => (
        <button
          key={source.id}
          type="button"
          disabled={disabled}
          aria-pressed={activeTab === source.id}
          className={tabClass(activeTab === source.id)}
          onClick={() => setActiveTab(source.id)}
        >
          {source.label}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        aria-pressed={activeTab === "saved"}
        className={`${tabClass(activeTab === "saved")} inline-flex items-center gap-[5px]`}
        onClick={() => setActiveTab("saved")}
      >
        <span aria-hidden="true" className="text-base leading-none">☆</span>
        즐겨찾기
      </button>
    </nav>
  );
}
