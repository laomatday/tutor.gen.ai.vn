import { useEffect, useRef, type RefObject } from "react";
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
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (role !== "Học sinh") return;
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [role]);

  if (role === "Học sinh") {
    return (
      <header className="app-header app-header--student gemini-header">
        <div className="gemini-header__left">
          <Button
            ref={menuRef}
            variant="ghost"
            size="icon"
            onClick={onMenu}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            className="gemini-mobile-menu lg:hidden"
          >
            <Icon name="menu" />
          </Button>

          <Button
            variant="ghost"
            onClick={onMenu}
            aria-label="Mở điều hướng học tập"
            aria-expanded={menuOpen}
            className="gemini-context-pill"
          >
            <span className="gemini-context-pill__icon">
              <Icon name="auto_awesome" />
            </span>
            <span className="min-w-0">
              <strong>AI Pulse</strong>
              <small>{label}</small>
            </span>
            <Icon name="expand_more" className="gemini-context-pill__chevron" />
          </Button>

          <div className="gemini-header__tools hidden lg:flex" aria-label="Công cụ nhanh">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Tìm kiếm"
              onClick={() => searchRef.current?.focus()}
              title="Tìm kiếm"
            >
              <Icon name="search" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Mở Knowledge Map"
              onClick={() => onNavigate(routePath("hoc-bai"))}
              title="Knowledge Map"
            >
              <Icon name="hub" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Bắt đầu Focus Studio"
              onClick={() => onNavigate(routePath("tu-giai"))}
              title="Focus Studio"
            >
              <Icon name="edit_square" />
            </Button>
          </div>
        </div>

        <form
          className="gemini-command-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            onNavigate(routePath("hoc-bai"));
          }}
        >
          <Icon name="search" className="gemini-command-search__icon" />
          <Input
            ref={searchRef}
            type="search"
            aria-label="Tìm bài học, chủ đề hoặc câu hỏi"
            placeholder="Tìm bài học, chủ đề hoặc hỏi Tutor..."
            className="gemini-command-search__input"
          />
          <kbd className="gemini-command-search__kbd">⌘K</kbd>
        </form>

        <div className="gemini-header__right">
          <div className="gemini-status-pill hidden xl:flex" title="Chuỗi học tập">
            <span className="text-base">🔥</span>
            <span>
              <strong>14 ngày</strong>
              <small>Streak</small>
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate(routePath("replay"))}
            aria-label="Mở Thinking Replay"
            className="gemini-header-icon"
            title="Replay Mode"
          >
            <Icon name="history" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Thông báo"
            className="gemini-header-icon relative"
          >
            <Icon name="notifications" />
            <span className="gemini-notification-dot" />
          </Button>

          <Button
            variant="ghost"
            onClick={onOpenProfile}
            aria-label="Mở hồ sơ học tập"
            className="gemini-profile-trigger"
          >
            <img
              alt={studentProfile.name}
              className="h-8 w-8 rounded-full object-cover"
              src={studentProfile.avatarUrl}
              referrerPolicy="no-referrer"
            />
            <span className="hidden min-w-0 text-left xl:block">
              <strong className="block truncate">{studentProfile.name}</strong>
              <small className="block truncate">
                Lớp {studentProfile.className} · {studentProfile.levelLabel}
              </small>
            </span>
            <Icon name="expand_more" className="hidden xl:block" />
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
        <BrandLogo
          compact
          showProduct={false}
          className="hidden sm:inline-flex md:hidden"
        />
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
        <PWAInstallButton
          variant="surface"
          size="sm"
          className="hidden sm:inline-flex"
        />
        {import.meta.env.DEV && (
          <div
            className="ui-segmented"
            role="group"
            aria-label="Chọn không gian thử nghiệm"
          >
            {roles.map((item) => (
              <Button
                key={item}
                variant="ghost"
                size="sm"
                aria-pressed={role === item}
                onClick={() =>
                  role !== item && onNavigate(roleHome[item])
                }
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
