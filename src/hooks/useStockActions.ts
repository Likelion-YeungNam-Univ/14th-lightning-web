import { useEffect, useState } from "react";
import { deleteApi, postApi } from "../api/client";
import type { StockAddResponse, StockChanges } from "../types/stock";

type UseStockActionsParams = {
  authenticated: boolean;
  activeMarket: string;
  refreshMarkets: () => Promise<void>;
  refreshStocks: () => void;
  onRequireLogin: () => void;
};

/** 종목 추가 모달과 로그인 후 재시도할 종목 변경 요청을 관리한다. */
export function useStockActions({
  authenticated,
  activeMarket,
  refreshMarkets,
  refreshStocks,
  onRequireLogin,
}: UseStockActionsParams) {
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [pendingStockChanges, setPendingStockChanges] =
    useState<StockChanges | null>(null);
  const [stockActionError, setStockActionError] = useState("");
  const [stockActionNotice, setStockActionNotice] = useState("");

  useEffect(() => {
    if (authenticated) return;

    setStockModalOpen(false);
    setPendingStockChanges(null);
  }, [authenticated]);

  useEffect(() => {
    if (!stockActionNotice) return;

    const timer = window.setTimeout(() => {
      setStockActionNotice("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [stockActionNotice]);

  // 저장 결과를 안내하고 시장·종목 정보를 다시 조회한다.
  const completeStockAdd = (response: StockAddResponse | null = null) => {
    const otherMarketStocks =
      response?.added.filter((stock) => stock.market !== activeMarket) ?? [];
    if (otherMarketStocks.length > 0) {
      const grouped = otherMarketStocks.reduce<Record<string, string[]>>(
        (result, stock) => {
          (result[stock.market] ??= []).push(stock.name);
          return result;
        },
        {},
      );
      setStockActionNotice(
        Object.entries(grouped)
          .map(
            ([market, names]) =>
              `${names.join(", ")} 종목은 ${market === "overseas" ? "해외" : "국내"}에 추가됐어요.`,
          )
          .join(" "),
      );
    } else {
      setStockActionNotice("관심 종목 변경사항을 저장했어요.");
    }
    setStockModalOpen(false);
    setPendingStockChanges(null);
    setStockActionError("");
    refreshStocks();
    void refreshMarkets();
  };

  // 로그인 전에 보류한 종목 추가·삭제 요청을 인증 성공 후 다시 실행한다.
  const retryPendingStockAdd = async (changes: StockChanges) => {
    setStockActionError("");
    try {
      let response: StockAddResponse | null = null;
      if (changes.add.length > 0) {
        response = await postApi<StockAddResponse>("/me/stocks", {
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
      completeStockAdd(response);
    } catch (error) {
      setStockActionError(
        error instanceof Error ? error.message : "종목을 추가하지 못했습니다.",
      );
    }
  };

  // 인증이 필요한 변경사항을 보관하고 종목 모달 대신 로그인 모달을 요청한다.
  const requireLoginForStocks = (changes: StockChanges) => {
    setPendingStockChanges(changes);
    setStockModalOpen(false);
    onRequireLogin();
  };

  // 새 작업을 시작할 때 이전 오류와 안내를 지우고 종목 추가 모달을 연다.
  const openStockModal = () => {
    setStockActionError("");
    setStockActionNotice("");
    if (!authenticated) {
      onRequireLogin();
      return;
    }
    setStockModalOpen(true);
  };

  return {
    stockModalOpen,
    setStockModalOpen,
    pendingStockChanges,
    stockActionError,
    stockActionNotice,
    completeStockAdd,
    retryPendingStockAdd,
    requireLoginForStocks,
    openStockModal,
  };
}
