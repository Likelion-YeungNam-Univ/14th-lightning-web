type StatusBannerProps = {
  tone: "error" | "info";
  message: string;
};

const toneClass: Record<StatusBannerProps["tone"], string> = {
  error: "border-[#634b2f] bg-[#2a2119] text-[#f0a868]",
  info: "border-[#315b84] bg-[#17283a] text-[#9ec9fb]",
};

export function StatusBanner({ tone, message }: StatusBannerProps) {
  return (
    <p
      role="status"
      className={`mt-4 rounded-lg border px-4 py-3 text-sm ${toneClass[tone]}`}
    >
      {message}
    </p>
  );
}
