import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import PointChargeModal from "./PointChargeModal";
import GiftRedeemModal from "./GiftRedeemModal";
import PointHistoryModal from "./PointHistoryModal";
import type { PointBalanceResponse, PointHistoryEntry } from "../types/points";
import type { GifticonExchangeResponse, PointChargeResponse } from "../types/points";
import type { AccountResponse } from "../types/session";
import { ProfileModal } from "./ProfileModal";

// 실제 내역 API 연결 전까지 쓰는 임시 목업
const MOCK_HISTORY_ENTRIES: PointHistoryEntry[] = [
  { id: "1", label: "삼성전자 · 참여 정산 획득", amount: 1000, date_label: "08.10" },
  { id: "2", label: "삼성전자 · 간다 참여", amount: -500, date_label: "08.05" },
  { id: "3", label: "피자 기프티콘 교환", amount: -18000, date_label: "지난달" },
];

const GIFT_RESULT_STORAGE_PREFIX = "assit:gift-result:";

function isGifticonExchangeResponse(value: unknown): value is GifticonExchangeResponse {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return (
    typeof result.order_id === "number" &&
    typeof result.points_used === "number" &&
    typeof result.issued_code === "string" &&
    typeof result.balance === "number"
  );
}

type HeaderProps = {
  authenticated: boolean;
  sessionLoading: boolean;
  points: PointBalanceResponse | null;
  account: AccountResponse | null;
  onLoginClick: () => void;
  onLogoutClick: () => void; // 추가
  onNicknameChange: (nickname: string) => void;
  onChargePoints: (amount: number) => Promise<PointChargeResponse>;
  onRedeemGifticon: () => Promise<GifticonExchangeResponse>;
};

export function Header({
  authenticated,
  sessionLoading,
  points,
  account,
  onLoginClick,
  onLogoutClick, // 추가
  onNicknameChange,
  onChargePoints,
  onRedeemGifticon,
}: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isChargeOpen, setIsChargeOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pointActionLoading, setPointActionLoading] = useState(false);
  const [pointActionError, setPointActionError] = useState("");
  const [giftResult, setGiftResult] = useState<GifticonExchangeResponse | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const balance = points?.balance ?? 0;
  const held = points?.pizza_progress.held ?? balance;
  const target = 23_000;
  const percent = Math.min(100, Math.max(0, Math.round((held / target) * 100)));
  const numberFormatter = new Intl.NumberFormat("ko-KR");
  const giftResultStorageKey = account?.login_id
    ? `${GIFT_RESULT_STORAGE_PREFIX}${account.login_id}`
    : null;

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      if (!authenticated || !giftResultStorageKey) {
        setGiftResult(null);
        return;
      }
      try {
        const storedResult = window.localStorage.getItem(giftResultStorageKey);
        if (!storedResult) {
          setGiftResult(null);
          return;
        }
        const parsedResult: unknown = JSON.parse(storedResult);
        if (isGifticonExchangeResponse(parsedResult)) {
          setGiftResult(parsedResult);
        } else {
          window.localStorage.removeItem(giftResultStorageKey);
          setGiftResult(null);
        }
      } catch {
        window.localStorage.removeItem(giftResultStorageKey);
        setGiftResult(null);
      }
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [authenticated, giftResultStorageKey]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [userMenuOpen]);

  // 메뉴 항목 클릭 시 동작 분기
  function handleMenuItemClick(item: string) {
    setUserMenuOpen(false);
    if (item === "내 프로필") {
      setIsProfileOpen(true);
    }
    if (item === "포인트 충전") {
      setPointActionError("");
      setIsChargeOpen(true);
    }
    if (item === "기프티콘 교환") {
      setPointActionError("");
      setIsRedeemOpen(true);
    }
    if (item === "내 참여 내역") {
      setIsHistoryOpen(true);
    }
    if (item === "로그아웃") {
      setGiftResult(null);
      if (giftResultStorageKey) {
        window.localStorage.removeItem(giftResultStorageKey);
      }
      onLogoutClick(); // 추가
    }
  }

  async function handleChargeConfirm(amount: number) {
    setPointActionLoading(true);
    setPointActionError("");
    try {
      await onChargePoints(amount);
      setIsChargeOpen(false);
    } catch (error) {
      setPointActionError(error instanceof Error ? error.message : "포인트 충전에 실패했습니다.");
    } finally {
      setPointActionLoading(false);
    }
  }

  async function handleRedeemConfirm() {
    setPointActionLoading(true);
    setPointActionError("");
    setGiftResult(null);
    if (giftResultStorageKey) {
      window.localStorage.removeItem(giftResultStorageKey);
    }
    try {
      const response = await onRedeemGifticon();
      setGiftResult(response);
      if (giftResultStorageKey) {
        window.localStorage.setItem(
          giftResultStorageKey,
          JSON.stringify(response),
        );
      }
    } catch (error) {
      setPointActionError(error instanceof Error ? error.message : "기프티콘 교환에 실패했습니다.");
    } finally {
      setPointActionLoading(false);
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-[#12151b] px-6 shadow-[0_1px_0_#20242c]">
      <Logo />
      {authenticated ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="피자 기프티콘 교환 진행률 보기"
            onClick={() => {
              setPointActionError("");
              setIsRedeemOpen(true);
            }}
            className="relative h-[48px] w-[370px] rounded-full border-0 bg-[#1b2231] px-5 py-2 text-left transition hover:bg-[#222a3b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6f9fff] max-[860px]:hidden"
          >
            <div className="-translate-y-0.5 flex items-center justify-between gap-6 text-[14px] font-bold">
              <span className="text-[#6fa8ff]">🍕 피자까지</span>
              <strong className="text-[#f2f3f5]">
                {numberFormatter.format(held)} / {numberFormatter.format(target)}P
              </strong>
            </div>
            <div className="absolute bottom-[5px] left-6 right-6 h-[5px] overflow-hidden rounded-full bg-[#2b3039]">
              <span
                className="block h-full rounded-full bg-[#6f9fff] transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </button>

          <button
            type="button"
            aria-label="포인트 충전 열기"
            onClick={() => {
              setPointActionError("");
              setIsChargeOpen(true);
            }}
            className="grid h-[48px] min-w-[116px] place-items-center rounded-full border-0 bg-[#1b2231] px-5 text-[17px] font-bold text-[#6fa8ff] transition hover:bg-[#222a3b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6f9fff] max-[560px]:min-w-0 max-[560px]:px-4 max-[560px]:text-sm"
          >
            {numberFormatter.format(balance)}P
          </button>

          <div ref={userMenuRef} className="relative max-[560px]:hidden">
            <button
              type="button"
              aria-label="사용자 메뉴 열기"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              onClick={() => setUserMenuOpen((open) => !open)}
              className="flex h-[48px] items-center gap-3 rounded-lg border-0 bg-transparent px-2 text-[16px] font-medium text-[#f2f3f5] transition hover:bg-[#1b2231]"
            >
              {account?.nickname ?? "사용자"}
              <span
                aria-hidden="true"
                className={`grid size-5 shrink-0 place-items-center text-[#a4adbb] transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="size-4"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="m5 7.5 5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {userMenuOpen && (
              <div
                role="menu"
                aria-label="사용자 메뉴"
                className="absolute right-0 top-[54px] w-[176px] overflow-hidden rounded-[12px] border border-[#343b49] bg-[#20232c] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,.45)]"
              >
                {["내 프로필", "포인트 충전", "기프티콘 교환", "내 참여 내역", "로그아웃"].map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      role="menuitem"
                      onClick={() => handleMenuItemClick(item)}
                      className="flex h-[44px] w-full items-center rounded-[8px] border-0 bg-transparent px-3 text-left text-sm font-medium text-[#c5cad3] transition hover:bg-[#2a2f3a] hover:text-white focus-visible:bg-[#2a2f3a] focus-visible:text-white"
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          disabled={sessionLoading}
          onClick={onLoginClick}
          className="min-h-10 rounded-lg bg-[#4d9fff] px-6 text-sm font-bold text-[#0f1115] transition hover:bg-[#71b0ff] disabled:cursor-wait disabled:opacity-60"
        >
          {sessionLoading ? "연결 중" : "로그인"}
        </button>
      )}

      {/* 포인트 충전 모달 */}
      {isProfileOpen && (
        <ProfileModal
          account={account}
          onClose={() => setIsProfileOpen(false)}
          onNicknameChange={onNicknameChange}
        />
      )}

      {isChargeOpen && (
        <PointChargeModal
          pointBalance={balance}
          onClose={() => setIsChargeOpen(false)}
          onConfirm={handleChargeConfirm}
          loading={pointActionLoading}
          error={pointActionError}
        />
      )}

      {/* 기프티콘 교환 모달 */}
      {isRedeemOpen && (
        <GiftRedeemModal
          pointBalance={held}
          pizzaCost={target}
          onClose={() => setIsRedeemOpen(false)}
          onConfirm={handleRedeemConfirm}
          loading={pointActionLoading}
          error={pointActionError}
          exchangeResult={giftResult}
        />
      )}

      {/* 내 참여 내역 모달 */}
      {isHistoryOpen && (
        <PointHistoryModal
          entries={MOCK_HISTORY_ENTRIES}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}
    </header>
  );
}
