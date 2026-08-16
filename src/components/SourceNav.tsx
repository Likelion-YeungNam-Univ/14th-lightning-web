import { useState } from "react";

type SourceTab =
  | "youtube"
  | "disclosure"
  | "regulation"
  | "bok"
  | "fed"
  | "saved";

type SourceNavProps = {
  market: string;
  tabs?: string[];
  disabled: boolean;
};

const fallbackTabs: Record<string, Exclude<SourceTab, "saved">[]> = {
  domestic: ["youtube", "disclosure", "regulation", "bok", "fed"],
  overseas: ["youtube", "disclosure", "regulation", "fed"],
};

const sourceTabIds = new Set<Exclude<SourceTab, "saved">>([
  "youtube",
  "disclosure",
  "regulation",
  "bok",
  "fed",
]);

function isSourceTab(value: string): value is Exclude<SourceTab, "saved"> {
  return sourceTabIds.has(value as Exclude<SourceTab, "saved">);
}

function sourceLabel(tab: Exclude<SourceTab, "saved">, market: string) {
  if (tab === "youtube") return "유튜브";
  if (tab === "disclosure") return market === "overseas" ? "공시(SEC)" : "공시(DART)";
  if (tab === "regulation") return "규제동향";
  if (tab === "bok") return "한국은행";
  return "미국 Fed";
}

export function SourceNav({ market, tabs, disabled }: SourceNavProps) {
  const [activeTab, setActiveTab] = useState<SourceTab>("youtube");
  const sourceTabs = (tabs ?? fallbackTabs[market] ?? fallbackTabs.domestic).filter(isSourceTab);

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
          key={source}
          type="button"
          disabled={disabled}
          aria-pressed={activeTab === source}
          className={tabClass(activeTab === source)}
          onClick={() => setActiveTab(source)}
        >
          {sourceLabel(source, market)}
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
