import type { RefObject } from "react";
import { Button, Icon } from "../../components/ui";
import { PWAInstallButton } from "../../components/pwa/PWAInstallButton";
import { appConfig } from "../../config/app";
import { roles, roleHome, type UserRole } from "../../config/routes";
import { studentProfile } from "../../features/learning/data/student";

interface Props {
  role: UserRole;
  label: string;
  menuOpen: boolean;
  menuRef: RefObject<HTMLButtonElement | null>;
  onMenu: () => void;
  onNavigate: (path: string) => void;
  onOpenProfile?: () => void;
}
export function AppHeader({
  role,
  label,
  menuOpen,
  menuRef,
  onMenu,
  onNavigate,
  onOpenProfile,
}: Props) {
  return (
    <header className="app-header">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          ref={menuRef}
          variant="ghost"
          size="icon"
          onClick={onMenu}
          aria-label="Mở menu"
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          className="lg:hidden"
        >
          <Icon name="menu" />
        </Button>
        <img
          src={appConfig.brand.logoUrl}
          alt={appConfig.brand.wordmark}
          className="hidden h-7 w-7 object-contain sm:block md:hidden"
        />
        <nav
          aria-label="Trang hiện tại"
          className="hidden min-w-0 items-center gap-2 text-sm text-on-surface-variant md:flex"
        >
          <span>{role === "Học sinh" ? "Không gian học tập" : "Quản lý"}</span>
          <Icon name="chevron_right" className="text-base" />
          <span className="truncate font-semibold text-primary">{label}</span>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <PWAInstallButton
          variant="surface"
          size="sm"
          className="hidden sm:inline-flex"
        />
        <div className="ui-segmented" role="group" aria-label="Chọn không gian">
          {roles.map((item) => (
            <Button
              key={item}
              variant="ghost"
              size="sm"
              aria-pressed={role === item}
              onClick={() => role !== item && onNavigate(roleHome[item])}
              className="ui-segment"
            >
              {item}
            </Button>
          ))}
        </div>
        {role === "Học sinh" ? (
          <Button
            variant="surface"
            type="button"
            onClick={onOpenProfile}
            title={`${studentProfile.name} — Xem hồ sơ & huy hiệu`}
            className="hidden sm:inline-flex items-center rounded-full p-0.5 ring-1 ring-outline-variant hover:ring-secondary transition-all hover:scale-105 active:scale-95 h-auto min-h-0 min-w-0"
          >
            <img
              alt={studentProfile.name}
              className="h-8 w-8 rounded-full object-cover"
              src={studentProfile.avatarUrl}
              referrerPolicy="no-referrer"
            />
          </Button>
        ) : (
          <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-primary text-white sm:flex">
            <Icon
              name={role === "Giáo viên" ? "school" : "shield_person"}
              className="text-lg"
            />
          </span>
        )}
      </div>
    </header>
  );
}
