import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Icon, Input, Modal } from "../../components/ui";
import { StudentAvatar } from "../../components/student/StudentAvatar";
import { appConfig } from "../../config/app";
import { studentProfile } from "../../features/curriculum";
import { ordinaryLinkClick } from "../../app/navigation";
import "../../experience-v2/theme.css";
import "../tempt-mapping.css";

const destinations = [
  { section: "hom-nay", path: "/", label: "Nhiệm vụ hôm nay", mobile: "Hôm nay", icon: "home" },
  { section: "hoc-bai", path: "/hoc-bai", label: "Knowledge Universe", mobile: "Tri thức", icon: "hub" },
  { section: "tu-giai", path: "/tu-giai", label: "Focus Studio", mobile: "Tự giải", icon: "track_changes" },
  { section: "replay", path: "/replay", label: "Thinking Replay", mobile: "Replay", icon: "history" },
] as const;

const secondary = [
  { section: "tien-bo", path: "/tien-bo", label: "Tiến bộ của em", icon: "bar_chart" },
  { section: "thoi-khoa-bieu", path: "/thoi-khoa-bieu", label: "Lịch học", icon: "calendar_today" },
  { section: "doi-qua", path: "/doi-qua", label: "Phần thưởng", icon: "workspace_premium" },
] as const;

interface Props {
  section: string;
  onNavigate: (path: string) => void;
  onOpenProfile: () => void;
  children: ReactNode;
}

export function LearningShell({
  section,
  onNavigate,
  onOpenProfile,
  children,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileMenuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [section]);

  useEffect(() => {
    if (!searchOpen) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [searchOpen]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        mobileMenuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [menuOpen]);

  const go = (path: string) => {
    setMenuOpen(false);
    onNavigate(path);
  };

  const navigationItem = (item: { section: string; path: string; label: string; icon: string }) => (
    <a
      href={item.path}
      key={item.path}
      className="v2-nav-link"
      aria-current={section === item.section ? "page" : undefined}
      onClick={(event) => {
        if (!ordinaryLinkClick(event)) return;
        event.preventDefault();
        go(item.path);
      }}
    >
      <span className="v2-nav-icon"><Icon name={item.icon} /></span>
      <span>{item.label}</span>
    </a>
  );

  return (
    <div className="learning-os-v2">
      <a className="v2-skip" href="#main-content">Đến nội dung học tập</a>
      {menuOpen && (
        <Button
          variant="ghost"
          className="v2-mobile-shade"
          onClick={() => {
            setMenuOpen(false);
            mobileMenuButton.current?.focus();
          }}
          aria-label="Đóng menu"
        />
      )}

      <aside id="v2-mobile-menu" className={`v2-sidebar${menuOpen ? " is-open" : ""}`} aria-label="Thanh điều hướng học tập">
        <div className="v2-brand">
          <img src={appConfig.brand.logoUrl} width={39} height={39} alt="" />
          <div className="v2-brand-copy">
            <strong>genAi <span>Tutor</span></strong>
            <small>Không gian học tập của em</small>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="v2-menu-close"
            onClick={() => {
              setMenuOpen(false);
              mobileMenuButton.current?.focus();
            }}
            aria-label="Đóng menu học tập"
          ><Icon name="close" /></Button>
        </div>
        <nav className="v2-nav-primary" aria-label="Điều hướng ở thanh bên">
          {destinations.map(navigationItem)}
        </nav>
        <nav className="v2-nav-secondary" aria-label="Các trang học tập khác">
          {secondary.map(navigationItem)}
        </nav>
        <div className="v2-sidebar-bottom">
          <span className="v2-planet-orbit" aria-hidden="true" />
          <p>Hôm nay hiểu thêm một điều. Ngày mai tiến xa hơn.</p>
          <small>Mỗi lần thử đều có giá trị.</small>
        </div>
      </aside>

      <div className="v2-frame">
        <header className="v2-topbar">
          <Button
            ref={mobileMenuButton}
            variant="ghost"
            size="icon"
            className="v2-menu-trigger"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="v2-mobile-menu"
            aria-label={menuOpen ? "Đóng menu học tập" : "Mở menu học tập"}
          >
            <Icon name="menu" />
          </Button>
          <Button variant="ghost" className="v2-search-trigger" onClick={() => setSearchOpen(true)}>
            <Icon name="search" />
            <span>Tìm môn học, chủ đề, bài học…</span>
            <kbd>Ctrl K</kbd>
          </Button>
          <div className="v2-topbar-end">
            <span className="v2-grade">Lớp {studentProfile.gradeId}</span>
            <Button
              variant="ghost"
              className="v2-profile"
              onClick={onOpenProfile}
              aria-label={`Mở hồ sơ: ${studentProfile.name}`}
            >
              <StudentAvatar
                name={studentProfile.name}
                src={studentProfile.avatarUrl}
                className="v2-avatar"
              />
              <span>{studentProfile.name}</span>
              <Icon name="expand_more" />
            </Button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="v2-main">{children}</main>
      </div>

      <nav className="v2-mobile-dock" aria-label="Điều hướng học tập chính">
        {destinations.map((item) => (
          <a
            key={item.path}
            href={item.path}
            aria-current={section === item.section ? "page" : undefined}
            onClick={(event) => {
              if (!ordinaryLinkClick(event)) return;
              event.preventDefault();
              go(item.path);
            }}
          >
            <Icon name={item.icon} /><span>{item.mobile}</span>
          </a>
        ))}
      </nav>

      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Tìm nội dung học tập"
        className="v2-search-dialog"
      >
        <form
          role="search"
          className="v2-search-form"
          onSubmit={(event) => {
            event.preventDefault();
            const term = query.trim();
            if (!term) return searchRef.current?.focus();
            setSearchOpen(false);
            go(`/hoc-bai?q=${encodeURIComponent(term)}`);
          }}
        >
          <Input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm môn, chủ đề hoặc bài đã xuất bản"
            aria-label="Từ khóa tìm kiếm học liệu"
          />
          <Button type="submit"><Icon name="search" /> Tìm</Button>
        </form>
        <p className="v2-search-help">Tìm trong nội dung học tập hiện có; chưa có trợ lý AI trực tiếp.</p>
      </Modal>
    </div>
  );
}
