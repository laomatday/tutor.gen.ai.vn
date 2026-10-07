import { useState } from "react";
import { Button, Icon, Modal } from "../ui";
import { usePWAInstall } from "../../lib/usePWAInstall";

interface PWAInstallButtonProps {
  variant?: "primary" | "secondary" | "surface" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  showIconOnly?: boolean;
}

export function PWAInstallButton({
  variant = "surface",
  size = "sm",
  className = "",
  showIconOnly = false,
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Suppress if already running in standalone PWA mode
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={install}
        className={className}
        aria-label="Cài đặt ứng dụng genAi Tutor"
        title="Cài đặt ứng dụng về máy"
      >
        <Icon name="download" />
        {!showIconOnly && <span>Cài đặt ứng dụng</span>}
      </Button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          onClick={() => setShowIOSGuide(true)}
          className={className}
          aria-label="Hướng dẫn cài đặt trên iOS"
          title="Cài đặt ứng dụng trên iPhone / iPad"
        >
          <Icon name="smartphone" />
          {!showIconOnly && <span>Cài đặt PWA</span>}
        </Button>

        <Modal
          open={showIOSGuide}
          onClose={() => setShowIOSGuide(false)}
          title="Cài đặt genAi Tutor trên iPhone / iPad"
          description="Trải nghiệm ứng dụng mượt mà và toàn màn hình không qua App Store"
          footer={
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowIOSGuide(false)}
              className="w-full"
            >
              Đã hiểu
            </Button>
          }
        >
          <div className="space-y-4 text-sm text-on-surface-variant">
            <div className="flex items-start gap-3 rounded-lg bg-surface-container p-3.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container font-semibold">
                1
              </div>
              <div>
                <p className="font-medium text-on-surface">Nhấn nút Chia sẻ</p>
                <p className="text-xs">
                  Trên thanh công cụ Safari (biểu tượng mũi tên hướng lên{" "}
                  <Icon name="share" className="inline-block h-3.5 w-3.5" /> ở
                  dưới cùng màn hình).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-surface-container p-3.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container font-semibold">
                2
              </div>
              <div>
                <p className="font-medium text-on-surface">
                  Chọn "Thêm vào Màn hình chính"
                </p>
                <p className="text-xs">
                  Cuộn xuống menu tác vụ và chọn{" "}
                  <strong>Add to Home Screen</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-surface-container p-3.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container font-semibold">
                3
              </div>
              <div>
                <p className="font-medium text-on-surface">Nhấn "Thêm"</p>
                <p className="text-xs">
                  Nhấn <strong>Thêm (Add)</strong> ở góc trên bên phải để hoàn
                  tất.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return null;
}
