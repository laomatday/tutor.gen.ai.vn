import { Icon } from "../ui";
import { useOnlineStatus } from "../../lib/useOnlineStatus";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-lg border border-outline-variant bg-surface-container-highest px-3.5 py-2 text-xs font-medium text-on-surface shadow-lg backdrop-blur-md"
    >
      <span className="flex h-2.5 w-2.5 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
      </span>
      <Icon name="wifi_off" className="text-base text-secondary" />
      <span>Chế độ ngoại tuyến — Dữ liệu đã lưu vẫn sẵn sàng</span>
    </div>
  );
}
