import { useState, type FormEvent, type RefObject } from "react";
import { Button, Icon, Input } from "../../components/ui";
import { PWAInstallButton } from "../../components/pwa/PWAInstallButton";
import { BrandLogo } from "../../components/BrandLogo";
import { roles, roleHome, routePath, type UserRole } from "../../config/routes";
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
  const [query, setQuery] = useState("");

  if (role === "Học sinh") {
    const firstName = studentProfile.name.split(" ").at(-1) ?? studentProfile.name;
    const submitSearch = (event: FormEvent) => {
      event.preventDefault();
      const trimmed = query.trim();
      onNavigate(
        trimmed
          ? `${routePath("hoc-bai")}?q=${encodeURIComponent(trimmed)}`
          : routePath("hoc-bai"),
      );
    };

    return (
      <header className="app-header app-header--student premium-command-bar">
        <div className="flex min-w-0 flex-1 items-center gap-3">
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

          <form
            className="premium-search hidden min-w-0 flex-1 md:flex"
            onSubmit={submitSearch}
            role="search"
          >
            <Icon name="search" className="premium-search__icon" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Tìm bài học, chủ đề hoặc câu hỏi"
              placeholder="Tìm bài học, chủ đề, hay nhập một câu hỏi..."
              className="premium-search__input"
            />
            <kbd className="premium-search__kbd">⌘ K</kbd>
          </form>

          <div className="min-w-0 md:hidden">
            <p className="truncate text-sm font-bold text-brand">{label}</p>
            <p className="truncate text-xs text-ink-500">AI Learning OS</p>
          </div>
        </div>

        <div className="premium-command-actions">
          <div className="premium-command-chip hidden lg:flex">
            <span className="premium-command-chip__icon text-danger-500">🔥</span>
            <span><strong>14 Ngày</strong><small>Chuỗi học tập</small></span>
          </div>
          <div className="premium-command-chip hidden xl:flex">
            <Icon name="graphic_eq" className="text-accent-strong" />
            <span><strong>Deep Focus</strong><small>Nhịp học hiện tại</small></span>
          </div>
          <Button
            variant="surface"
            className="premium-command-chip hidden xl:flex"
            onClick={() => onNavigate(routePath("replay"))}
          >
            <Icon name="history" className="text-brand" />
            <span><strong>Replay Mode</strong><small>Xem lại tư duy</small></span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Thông báo"
            className="relative hidden sm:inline-flex"
          >
            <Icon name="notifications" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white" />
          </Button>
          <Button
            variant="surface"
            onClick={onOpenProfile}
            aria-label="Mở hồ sơ học tập"
            className="premium-profile-trigger"
          >
            <img
              alt={studentProfile.name}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
              src={studentProfile.avatarUrl}
              referrerPolicy="no-referrer"
            />
            <span className="hidden min-w-0 text-left xl:block">
              <strong className="block truncate text-xs text-brand">
                {studentProfile.name}
              </strong>
              <small className="block truncate text-xs text-ink-500">
                Tuyển sinh 10 · {studentProfile.levelLabel}
              </small>
            </span>
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
