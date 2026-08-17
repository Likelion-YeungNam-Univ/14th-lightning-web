import { useState, type DragEvent, type KeyboardEvent } from "react";
import type { MyStockItem } from "../types/stock";

type UseStockReorderParams = {
  stocks: MyStockItem[];
  onReorderStocks?: (stockCodes: string[]) => void;
  reordering: boolean;
};

/** 드래그 또는 좌우 방향키로 종목 순서를 바꾸는 상호작용을 관리한다. */
export function useStockReorder({
  stocks,
  onReorderStocks,
  reordering,
}: UseStockReorderParams) {
  // 일반 선택 상태와 순서 변경 상태를 구분한다.
  const [reorderMode, setReorderMode] = useState(false);

  // 현재 이동 중인 종목과 드롭 대상 종목의 배열 위치를 저장한다.
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 드래그가 끝나거나 취소되면 위치 강조 상태를 초기화한다.
  const finishDrag = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 순서 변경 모드를 전환할 때 진행 중인 드래그 상태도 함께 초기화한다.
  const toggleReorderMode = () => {
    finishDrag();
    setReorderMode((current) => !current);
  };

  // 이동할 종목을 배열에서 꺼내 사용자가 지정한 위치에 삽입한다.
  const reorderStock = (fromIndex: number, toIndex: number) => {
    // 저장 중이거나 유효하지 않은 배열 위치인 경우 순서를 변경하지 않는다.
    if (
      !onReorderStocks ||
      reordering ||
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= stocks.length ||
      toIndex >= stocks.length
    ) {
      finishDrag();
      return;
    }

    const reordered = [...stocks];
    const [movedStock] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedStock);

    // 새 전체 종목 코드 순서를 부모에 전달해 화면 반영과 API 저장을 요청한다.
    onReorderStocks(reordered.map((stock) => stock.stock_code));
    finishDrag();
  };

  // 드래그 시작 시 브라우저에 이동 작업임을 알리고 시작 위치를 저장한다.
  const handleDragStart = (event: DragEvent<HTMLDivElement>, index: number) => {
    if (!reorderMode || reordering) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", stocks[index].stock_code);
    setDraggedIndex(index);
  };

  // 드래그 중 포인터가 올라간 종목을 드롭 대상으로 표시한다.
  const handleDragEnter = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  // 브라우저 기본 동작을 막아 해당 종목 위에 놓을 수 있도록 한다.
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (reorderMode) event.preventDefault();
  };

  // 드롭 위치로 종목을 이동하고 드래그 상태를 종료한다.
  const handleDrop = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    if (draggedIndex !== null) reorderStock(draggedIndex, index);
  };

  // 키보드 사용자는 좌우 방향키로 종목을 한 칸씩 이동한다.
  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    if (!reorderMode || reordering) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      reorderStock(index, index - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      reorderStock(index, index + 1);
    }
  };

  return {
    reorderMode,
    toggleReorderMode,
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDrop,
    handleDragEnd: finishDrag,
    handleKeyDown,
  };
}
