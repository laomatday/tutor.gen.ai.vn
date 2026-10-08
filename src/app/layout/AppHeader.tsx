import type { RefObject } from "react";
import { Button, Icon } from "../../components/ui";
import { PWAInstallButton } from "../../components/pwa/PWAInstallButton";
import { BrandLogo } from "../../components/BrandLogo";
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
  if (role === "Học sinh") {
    return (
      <header className="app-header app-header--student">
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
          <div className="hidden items-center gap-2 lg:flex">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-accent-strong">
              AI Learning OS
            </span>
          </div>
          <div className="min-w-0 lg:ml-5">
            <p className="truncate text-sm font-bold text-brand">{label}</p>
            <p className="hidden text-xs text-ink-500 sm:block">
              Quan sát · thích nghi · dẫn đường
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-2 text-xs font-semibold text-accent-strong md:inline-flex">
            <Icon name="auto_awesome" />
            AI Pulse đang theo dõi
          </span>
          <Button
            variant="surface"
            onClick={onOpenProfile}
            aria-label="Mở hồ sơ học tập"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-200 bg-white p-1 shadow-sm"
          >
            <img
              alt={studentProfile.name}
              className="h-8 w-8 rounded-full object-cover"
              src={studentProfile.avatarUrl}
              referrerPolicy="no-referrer"
            />
          </Button>
        </div>
      </header>
    );
  }

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
        <BrandLogo compact showProduct={false} className="hidden sm:inline-flex md:hidden" />
        <nav
          aria-label="Trang hiện tại"
          className="hidden min-w-0 items-center gap-2 text-sm text-on-surface-variant md:flex"
        >
          <span>Quản lý</span>
          <Icon name="chevron_right" />
          <span className="truncate font-semibold text-primary">{label}</span>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <PWAInstallButton variant="surface" size="sm" className="hidden sm:inline-flex" />
        {import.meta.env.DEV && (
          <div className="ui-segmented" role="group" aria-label="Chọn không gian thử nghiệm">
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
        )}
        <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-primary text-white sm:flex">
          <Icon name={role === "Giáo viên" ? "school" : "shield_person"} />
        </span>
      </div>
    </header>
  );
}
