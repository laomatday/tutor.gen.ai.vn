import { useEffect, useRef, useState, type RefObject } from "react";
import { Button, Icon, Input } from "../../components/ui";
import { PWAInstallButton } from "../../components/pwa/PWAInstallButton";
import { BrandLogo } from "../../components/BrandLogo";
import { roles, roleHome, type UserRole } from "../../config/routes";
import { studentProfile } from "../../features/learning/data/student";
import { StudentAvatar } from "../../components/student/StudentAvatar";

interface Props {
  role: UserRole;
  label: string;
  menuOpen: boolean;
  menuRef: RefObject<HTMLButtonElement | null>;
  onMenu: () => void;
  onNavigate: (path: string) => void;
  onOpenProfile?: () => void;
}

export function AppHeader({ role, label, menuOpen, menuRef, onMenu, onNavigate, onOpenProfile }: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (role !== "Học sinh") return;
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMobileSearchOpen(true);
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [role]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    if (!query) { searchRef.current?.focus(); return; }
    setMobileSearchOpen(false);
    onNavigate(`/hoc-bai?q=${encodeURIComponent(query)}`);
  };

  if (role === "Học sinh") {
    return (
      <header className="app-header app-header--student">
        <div className="app-header__start">
          <Button
            ref={menuRef}
            variant="ghost"
            size="icon"
            onClick={onMenu}
            aria-label={menuOpen ? "Đóng menu học tập" : "Mở menu học tập"}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            className="app-header__menu lg:hidden"
          >
            <Icon name="menu" />
          </Button>
          <nav className="app-header__breadcrumb" aria-label="Đường dẫn">
            <span className="app-header__breadcrumb-parent">Không gian học tập</span>
            <Icon name="chevron_right" className="app-header__breadcrumb-chevron" />
            <strong aria-current="page">{label}</strong>
          </nav>
        </div>

        <form
          className={`app-header__search ${mobileSearchOpen ? "is-open" : ""}`}
          role="search"
          onSubmit={submitSearch}
        >
          <Icon name="search" className="app-header__search-icon" />
          <Input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Tìm bài học theo tên, chủ đề hoặc từ khóa"
            placeholder="Tìm bài học, chủ đề…"
            className="app-header__search-input"
          />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            aria-label="Tìm kiếm bài học"
            className="app-header__search-submit"
          >
            <Icon name="arrow_forward" />
          </Button>
        </form>
        <div className="app-header__end">
          <Button
            variant="ghost"
            size="icon"
            className="app-header__mobile-search"
            aria-label={mobileSearchOpen ? "Đóng tìm kiếm" : "Mở tìm kiếm"}
            aria-expanded={mobileSearchOpen}
            onClick={() => {
              setMobileSearchOpen((value) => !value);
              if (!mobileSearchOpen) requestAnimationFrame(() => searchRef.current?.focus());
            }}
          >
            <Icon name={mobileSearchOpen ? "close" : "search"} />
          </Button>
          <Button
            variant="ghost"
            onClick={onOpenProfile}
            className="app-header__profile"
            aria-label="Mở hồ sơ học tập"
          >
            <StudentAvatar name={studentProfile.name} src={studentProfile.avatarUrl} className="h-9 w-9 rounded-full" />
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="app-header">
      <div className="flex min-w-0 items-center gap-2">
        <Button ref={menuRef} variant="ghost" size="icon" onClick={onMenu}
          aria-label="Mở menu" aria-expanded={menuOpen} aria-controls="main-navigation" className="lg:hidden">
          <Icon name="menu" />
        </Button>
        <BrandLogo compact showProduct={false} className="hidden sm:inline-flex md:hidden" />
        <nav aria-label="Trang hiện tại" className="hidden min-w-0 items-center gap-2 text-sm text-on-surface-variant md:flex">
          <span>Quản lý</span><Icon name="chevron_right" /><span className="truncate font-semibold text-primary">{label}</span>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <PWAInstallButton variant="surface" size="sm" className="hidden sm:inline-flex" />
        {import.meta.env.DEV && (
          <div className="ui-segmented" role="group" aria-label="Chọn không gian thử nghiệm">
            {roles.map((item) => <Button key={item} variant="ghost" size="sm" aria-pressed={role === item}
              onClick={() => role !== item && onNavigate(roleHome[item])} className="ui-segment">{item}</Button>)}
          </div>
        )}
        <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-primary text-white sm:flex">
          <Icon name={role === "Giáo viên" ? "school" : "shield_person"} />
        </span>
      </div>
    </header>
  );
}
