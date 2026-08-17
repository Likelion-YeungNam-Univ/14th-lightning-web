import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ApiError, deleteApi, getApi, postApi } from "../api/client";
import type {
  MyStockItem,
  PopularStockItem,
  StockAddResponse,
  StockChanges,
  StockSearchItem,
  StockSearchResponse,
} from "../types/stock";

const MAX_STOCKS = 10;

const toSearchItem = (stock: MyStockItem): StockSearchItem => ({
  stock_code: stock.stock_code,
  name: stock.name,
  market: stock.market,
  already_added: true,
});

/** 추가·삭제 변경사항을 관심 종목 API에 나누어 전달한다. */
async function applyStockChanges(changes: StockChanges) {
  let addResponse: StockAddResponse | null = null;
  if (changes.add.length > 0) {
    addResponse = await postApi<StockAddResponse>("/me/stocks", {
      stock_codes: changes.add,
    });
  }
  await Promise.all(
    changes.remove.map((code) =>
      deleteApi<{ remaining: number }>(
        `/me/stocks/${encodeURIComponent(code)}`,
      ),
    ),
  );
  return addResponse;
}

type UseAddStockModalParams = {
  market: string;
  currentStocks: MyStockItem[];
  onUpdated: (response: StockAddResponse | null) => void;
  onAuthRequired: (changes: StockChanges) => void;
};

/** 현재 시장의 종목 검색, 선택, 최대 10개 제한과 변경사항 저장을 관리한다. */
export function useAddStockModal({
  market,
  currentStocks,
  onUpdated,
  onAuthRequired,
}: UseAddStockModalParams) {
  const [query, setQuery] = useState("");
  const [popular, setPopular] = useState<PopularStockItem[]>([]);
  const [results, setResults] = useState<StockSearchItem[]>([]);
  const [selected, setSelected] = useState<StockSearchItem[]>(() =>
    currentStocks.map(toSearchItem),
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [error, setError] = useState("");

  const originalCodes = useMemo(
    () => new Set(currentStocks.map((stock) => stock.stock_code)),
    [currentStocks],
  );
  const selectedCodes = useMemo(
    () => new Set(selected.map((stock) => stock.stock_code)),
    [selected],
  );
  const changes = useMemo<StockChanges>(
    () => ({
      add: selected
        .filter((stock) => !originalCodes.has(stock.stock_code))
        .map((stock) => stock.stock_code),
      remove: currentStocks
        .filter((stock) => !selectedCodes.has(stock.stock_code))
        .map((stock) => stock.stock_code),
    }),
    [currentStocks, originalCodes, selected, selectedCodes],
  );
  const changed = changes.add.length > 0 || changes.remove.length > 0;

  // 모달이 열리거나 시장이 바뀌면 해당 시장의 인기 종목을 조회한다.
  useEffect(() => {
    let cancelled = false;
    void getApi<PopularStockItem[]>(
      `/stocks/popular?market=${encodeURIComponent(market)}`,
    )
      .then((items) => {
        if (!cancelled) setPopular(items);
      })
      .catch((requestError) => {
        if (!cancelled)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "인기 종목을 불러오지 못했습니다.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [market]);

  // 입력이 멈춘 뒤 검색해 매 키 입력마다 API가 호출되는 것을 방지한다.
  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getApi<StockSearchResponse>(
          `/stocks/search?q=${encodeURIComponent(normalized)}&market=${encodeURIComponent(market)}`,
        );
        if (!cancelled) {
          setResults(response.items);
          setReason(response.reason ?? null);
        }
      } catch (requestError) {
        if (!cancelled)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "종목을 검색하지 못했습니다.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [market, query]);

  // 검색어를 지우면 이전 검색 결과와 사유도 함께 지운다.
  const updateQuery = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setReason(null);
    }
  };

  const addStock = (stock: StockSearchItem | PopularStockItem) => {
    if (selectedCodes.has(stock.stock_code) || selected.length >= MAX_STOCKS)
      return;
    setSelected((current) => [...current, { ...stock, already_added: false }]);
  };

  const removeStock = (stockCode: string) => {
    setSelected((current) =>
      current.filter((item) => item.stock_code !== stockCode),
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!changed) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await applyStockChanges(changes);
      onUpdated(response);
    } catch (requestError) {
      // 인증이 필요하면 변경 목록을 부모에 전달해 로그인 후 재시도할 수 있게 한다.
      if (requestError instanceof ApiError && requestError.status === 401) {
        onAuthRequired(changes);
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "변경사항을 저장하지 못했습니다.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const candidates = query.trim() ? results : popular;

  return {
    query,
    updateQuery,
    selected,
    selectedCodes,
    candidates,
    loading,
    submitting,
    reason,
    error,
    changed,
    maxStocks: MAX_STOCKS,
    addStock,
    removeStock,
    submit,
  };
}
