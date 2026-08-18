import { useState } from "react";

export type SourceTab =
  | "youtube"
  | "disclosure"
  | "regulation"
  | "bok"
  | "fed"
  | "saved"
  | "community";

type ContentSourceTab = Exclude<SourceTab, "saved" | "community">;

type SourceNavProps = {
  market: string;
  tabs?: string[];
  disabled: boolean;
  activeTab?: SourceTab;
  onSelectTab?: (tab: SourceTab) => void;
};

const fallbackTabs: Record<string, ContentSourceTab[]> = {
  domestic: ["youtube", "disclosure", "regulation", "bok", "fed"],
  overseas: ["youtube", "disclosure", "regulation", "fed"],
};

const sourceTabIds = new Set<ContentSourceTab>([
  "youtube",
  "disclosure",
  "regulation",
  "bok",
  "fed",
]);

function isSourceTab(value: string): value is ContentSourceTab {
  return sourceTabIds.has(value as ContentSourceTab);
}

function sourceLabel(tab: ContentSourceTab, market: string) {
  if (tab === "youtube") return "유튜브";
  if (tab === "disclosure") return market === "overseas" ? "공시(SEC)" : "공시(DART)";
  if (tab === "regulation") return "규제동향";
  if (tab === "bok") return "한국은행";
  return "미국 Fed";
}

export function SourceNav({
  market,
  tabs,
  disabled,
  activeTab: controlledActiveTab,
  onSelectTab,
}: SourceNavProps) {
  const [internalActiveTab, setInternalActiveTab] =
    useState<SourceTab>("youtube");
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const sourceTabs = (tabs ?? fallbackTabs[market] ?? fallbackTabs.domestic).filter(isSourceTab);

  const selectTab = (tab: SourceTab) => {
    if (onSelectTab) onSelectTab(tab);
    else setInternalActiveTab(tab);
  };

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
          onClick={() => selectTab(source)}
        >
          {sourceLabel(source, market)}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        aria-pressed={activeTab === "saved"}
        className={`${tabClass(activeTab === "saved")} inline-flex items-center gap-[5px]`}
        onClick={() => selectTab("saved")}
      >
        <span aria-hidden="true" className="text-base leading-none">☆</span>
        즐겨찾기
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={activeTab === "community"}
        className={`${tabClass(activeTab === "community")} inline-flex items-center gap-[7px]`}
        onClick={() => selectTab("community")}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-4 shrink-0 text-[#d8ccff]"
        >
          <path
            fill="currentColor"
            d="M10 2.5c-4.14 0-7.5 2.67-7.5 5.96 0 1.86 1.08 3.52 2.76 4.61l-.7 2.66a.65.65 0 0 0 .94.73l3.05-1.75c.47.08.96.12 1.45.12 4.14 0 7.5-2.67 7.5-5.96S14.14 2.5 10 2.5Z"
          />
        </svg>
        커뮤니티
      </button>
    </nav>
  );
}
