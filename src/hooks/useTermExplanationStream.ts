import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "../api/client";
import type { TermExplainResponse, TermSource } from "../types/card";

type ExplainTermInput = {
  term: string;
  tab: string;
  context?: string | null;
};

type MetaEvent = {
  term: string;
  tab: string;
  cached: boolean;
  sources: TermSource[];
};

type DeltaEvent = { text: string };
type CompleteEvent = { explanation: string | null };
type StreamErrorEvent = { code?: string; message?: string };

function parseEvent<T>(event: Event): T | null {
  if (!(event instanceof MessageEvent) || typeof event.data !== "string") {
    return null;
  }
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
}

/** 용어 풀이 SSE 연결과 종료 이벤트 처리를 한곳에서 관리한다. */
export function useTermExplanationStream() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [termLoading, setTermLoading] = useState(false);
  const [termError, setTermError] = useState("");
  const [termResponse, setTermResponse] = useState<TermExplainResponse | null>(
    null,
  );

  const closeStream = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  const resetTermExplanation = useCallback((message = "") => {
    closeStream();
    setTermLoading(false);
    setTermError(message);
    setTermResponse(null);
  }, [closeStream]);

  const explainTerm = useCallback(
    ({ term, tab, context }: ExplainTermInput) => {
      closeStream();
      setTermLoading(true);
      setTermError("");
      setTermResponse({
        term,
        tab,
        explanation: "",
        sources: [],
        cached: false,
      });

      const params = new URLSearchParams({ term, tab, context: context ?? "" });
      const eventSource = new EventSource(
        apiUrl(`/terms/explain/stream?${params.toString()}`),
        { withCredentials: true },
      );
      eventSourceRef.current = eventSource;

      eventSource.addEventListener("meta", (event) => {
        const data = parseEvent<MetaEvent>(event);
        if (!data || eventSourceRef.current !== eventSource) return;
        setTermResponse((previous) => ({
          term: data.term,
          tab: data.tab,
          explanation: previous?.explanation ?? "",
          sources: data.sources,
          cached: data.cached,
        }));
      });

      eventSource.addEventListener("delta", (event) => {
        const data = parseEvent<DeltaEvent>(event);
        if (!data || eventSourceRef.current !== eventSource) return;
        setTermLoading(false);
        setTermResponse((previous) => ({
          term: previous?.term ?? term,
          tab: previous?.tab ?? tab,
          explanation: `${previous?.explanation ?? ""}${data.text}`,
          sources: previous?.sources ?? [],
          cached: previous?.cached ?? false,
        }));
      });

      const finish = (event: Event, replace: boolean) => {
        const data = parseEvent<CompleteEvent>(event);
        if (!data || eventSourceRef.current !== eventSource) {
          eventSource.close();
          return;
        }
        setTermLoading(false);
        setTermResponse((previous) => ({
          term: previous?.term ?? term,
          tab: previous?.tab ?? tab,
          explanation:
            data.explanation ??
            (replace ? "설명을 제공할 수 없어요." : previous?.explanation ?? ""),
          sources: previous?.sources ?? [],
          cached: previous?.cached ?? false,
        }));
        eventSource.close();
        if (eventSourceRef.current === eventSource) eventSourceRef.current = null;
      };

      eventSource.addEventListener("done", (event) => finish(event, false));
      eventSource.addEventListener("replace", (event) => finish(event, true));
      eventSource.addEventListener("error", (event) => {
        if (eventSourceRef.current !== eventSource) return;
        const data = parseEvent<StreamErrorEvent>(event);
        setTermLoading(false);
        setTermError(
          data?.code === "rate_limited"
            ? "요청이 많아요. 잠시 후 다시 선택해주세요."
            : data?.message ?? "잠시 후 다시 시도해주세요.",
        );
        eventSource.close();
        eventSourceRef.current = null;
      });
    },
    [closeStream],
  );

  useEffect(() => closeStream, [closeStream]);

  return {
    termLoading,
    termError,
    termResponse,
    explainTerm,
    resetTermExplanation,
  };
}
