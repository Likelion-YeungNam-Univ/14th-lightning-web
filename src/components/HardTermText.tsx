type HardTermTextProps = {
  text: string;
  terms: string[] | null | undefined;
  onTermClick: (term: string, target: HTMLElement) => void;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HardTermText({ text, terms, onTermClick }: HardTermTextProps) {
  const normalizedTerms = Array.from(
    new Set((terms ?? []).map((term) => term.trim()).filter(Boolean)),
  ).sort((left, right) => right.length - left.length);

  if (normalizedTerms.length === 0) return text;

  const termPattern = new RegExp(
    `(${normalizedTerms.map(escapeRegExp).join("|")})`,
    "gi",
  );
  const termLookup = new Map(
    normalizedTerms.map((term) => [term.toLocaleLowerCase(), term]),
  );

  return text.split(termPattern).map((part, index) => {
    const matchedTerm = termLookup.get(part.toLocaleLowerCase());
    if (!matchedTerm) return <span key={`${index}-${part}`}>{part}</span>;

    return (
      <button
        key={`${index}-${part}`}
        type="button"
        onClick={(event) => onTermClick(matchedTerm, event.currentTarget)}
        className="inline cursor-help border-0 border-b border-dashed border-[#79a8ff] bg-[#34476f]/45 p-0 font-inherit text-inherit decoration-clone transition hover:bg-[#40598a]/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79a8ff]"
      >
        {part}
      </button>
    );
  });
}
