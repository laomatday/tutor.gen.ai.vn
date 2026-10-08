import type { RefObject } from "react";
import { Button, Icon } from "../../components/ui";
import { PWAInstallButton } from "../../components/pwa/PWAInstallButton";
import { BrandLogo } from "../../components/BrandLogo";
import { appConfig } from "../../config/app";
import {
  roleHome,
  rolePresentation,
  studentRoutes,
  workspaceRoutes,
  workspacePath,
  type UserRole,
} from "../../config/routes";
import { studentProfile } from "../../features/curriculum";

interface Props {
  role: UserRole;
  section: string;
  open: boolean;
  sidebarRef: RefObject<HTMLElement | null>;
  closeRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onOpenProfile?: () => void;
  nextLessonPath: string;
  progress: number;
  balance: number;
  pinned?: boolean;
  onToggleSidebar?: () => void;
  onTogglePinned?: () => void;
}

export function AppSidebar({
  role,
  section,
  open,
  sidebarRef,
  closeRef,
  onClose,
  onNavigate,
  onOpenProfile,
  nextLessonPath,
  progress,
  balance,
  pinned = false,
  onToggleSidebar,
  onTogglePinned,
}: Props) {
  if (role === "Học sinh") {
    const core = studentRoutes.filter((item) => item.group === "Core");
    const secondary = studentRoutes.filter((item) => item.group !== "Core");
    const visible = open || pinned;

    return (
      <aside
        ref={sidebarRef}
        id="main-navigation"
        aria-label="Điều hướng học sinh"
        className={`app-sidebar app-sidebar--student ${open ? "is-open" : ""} ${pinned ? "is-pinned" : ""}`}
      >
        <div className="student-icon-rail" aria-label="Điều hướng nhanh">
          <Button
            variant="ghost"
            size="icon"
            aria-label={visible ? "Đóng sidebar" : "Mở sidebar"}
            aria-expanded={visible}
            aria-controls="student-sidebar-panel"
            onClick={onToggleSidebar}
            className="student-logo-trigger"
            title={visible ? "Đóng sidebar" : "Mở sidebar"}
          >
            <img
              src={appConfig.brand.logoUrl}
              alt=""
              className="h-8 w-8 object-contain"
            />
          </Button>

          <nav className="student-icon-rail__nav" aria-label="Điều hướng nhanh">
            {core.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="icon"
                onClick={() => onNavigate(item.path)}
                aria-current={section === item.id ? "page" : undefined}
                aria-label={item.label}
                className="student-icon-rail__item"
                title={item.label}
              >
                <Icon name={item.icon} />
              </Button>
            ))}
          </nav>

          <div className="student-icon-rail__footer">
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenProfile}
              aria-label="Mở hồ sơ học tập"
              className="student-icon-rail__avatar"
              title="Hồ sơ học tập"
            >
              <img
                src={studentProfile.avatarUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </Button>
          </div>
        </div>

        <div id="student-sidebar-panel" className="student-sidebar-panel">
          <div className="student-sidebar-panel__header">
            <Button
              variant="ghost"
              onClick={() => onNavigate(roleHome[role])}
              className="student-sidebar-brand"
              aria-label="Về trang chủ Tutor genAI"
            >
              <span className="student-sidebar-brand__mark">
                <Icon name="school" />
              </span>
              <span>
                <strong>Tutor genAI</strong>
                <small>AI Learning OS</small>
              </span>
            </Button>

            <div className="student-sidebar-panel__header-actions">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                aria-label="Thu sidebar"
                className="hidden lg:inline-flex"
                title="Thu sidebar"
              >
                <Icon name="chevron_left" />
              </Button>
              <Button
                ref={closeRef}
                variant="ghost"
                size="icon"
                aria-label="Đóng menu"
                onClick={onClose}
                className="lg:hidden"
              >
                <Icon name="close" />
              </Button>
            </div>
          </div>

          <div className="student-sidebar-panel__body">
            <Button
              onClick={() => onNavigate(nextLessonPath)}
              className="student-new-session"
            >
              <Icon name="edit_square" />
              <span>Bắt đầu phiên học mới</span>
              <Icon name="arrow_forward" />
            </Button>

            <div className="student-sidebar-pin-row">
              <div>
                <strong>Giữ sidebar mở</strong>
                <span>Không tự thu khi chuyển trang</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={pinned}
                aria-label={pinned ? "Bỏ ghim sidebar" : "Giữ sidebar mở"}
                onClick={onTogglePinned}
                className="student-sidebar-pin-toggle"
              >
                <span className="student-sidebar-pin-toggle__track">
                  <span className="student-sidebar-pin-toggle__thumb" />
                </span>
                <span>{pinned ? "Bật" : "Tắt"}</span>
              </Button>
            </div>

            <section className="student-sidebar-section" aria-labelledby="student-core-nav">
              <p id="student-core-nav" className="student-sidebar-section__label">
                Không gian học tập
              </p>
              <nav className="student-sidebar-list">
                {core.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => onNavigate(item.path)}
                    aria-current={section === item.id ? "page" : undefined}
                    className="student-sidebar-row"
                  >
                    <span className="student-sidebar-row__icon">
                      <Icon name={item.icon} />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                  </Button>
                ))}
              </nav>
            </section>

            <section className="student-sidebar-section" aria-labelledby="student-tools-nav">
              <p id="student-tools-nav" className="student-sidebar-section__label">
                Công cụ & tiến độ
              </p>
              <nav className="student-sidebar-list">
                {secondary.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => onNavigate(item.path)}
                    aria-current={section === item.id ? "page" : undefined}
                    className="student-sidebar-row"
                  >
                    <span className="student-sidebar-row__icon">
                      <Icon name={item.icon} />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                  </Button>
                ))}
              </nav>
            </section>
          </div>

          <div className="student-sidebar-panel__footer">
            <div className="student-sidebar-mastery">
              <div
                className="student-progress-orb"
                title={`Mastery ${progress}%`}
                style={{
                  background: `conic-gradient(var(--color-accent) ${progress}%, var(--color-ink-600) 0)`,
                }}
              >
                <span>{progress}</span>
              </div>
              <span className="min-w-0 flex-1">
                <strong>Mastery {progress}%</strong>
                <small>{balance} GP · {studentProfile.levelLabel}</small>
              </span>
            </div>

            <Button
              variant="ghost"
              onClick={onOpenProfile}
              className="student-sidebar-profile"
            >
              <img
                src={studentProfile.avatarUrl}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="min-w-0 flex-1 text-left">
                <strong className="truncate">{studentProfile.name}</strong>
                <small>Lớp {studentProfile.className}</small>
              </span>
              <Icon name="chevron_right" />
            </Button>

            <PWAInstallButton
              variant="ghost"
              size="sm"
              className="w-full justify-center text-white/70"
            />
          </div>
        </div>
      </aside>
    );
  }

  const presentation = rolePresentation[role];
  const routes = workspaceRoutes[role];

  return (
    <aside
      ref={sidebarRef}
      id="main-navigation"
      aria-label={`Điều hướng ${role.toLowerCase()}`}
      className={`app-sidebar ${open ? "is-open" : ""}`}
    >
      <div className="flex items-center justify-between gap-2 p-4">
        <Button
          variant="surface"
          aria-label={`${appConfig.brand.name} — Trang chủ`}
          onClick={() => onNavigate(roleHome[role])}
          className="flex items-center gap-3 text-left"
        >
          <BrandLogo />
        </Button>
        <Button
          ref={closeRef}
          variant="ghost"
          size="icon"
          aria-label="Đóng menu"
          onClick={onClose}
          className="lg:hidden"
        >
          <Icon name="close" />
        </Button>
      </div>

      <div className="px-4 pb-4">
        <Button
          className="w-full justify-between"
          onClick={() =>
            onNavigate(
              role === "Giáo viên"
                ? workspacePath(role, "assignments")
                : workspacePath(role, "content"),
            )
          }
        >
          <span className="inline-flex items-center gap-2">
            <Icon name={role === "Giáo viên" ? "assignment" : "fact_check"} />
            {role === "Giáo viên" ? "Giao bài tập" : "Quản lý học liệu"}
          </span>
          <Icon name="arrow_forward" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <nav className="space-y-1">
          {routes.map((item) => (
            <Button
              key={item.id}
              variant="surface"
              onClick={() => onNavigate(item.path)}
              aria-current={section === item.id ? "page" : undefined}
              className="ui-nav-item"
            >
              <Icon name={item.icon} className="shrink-0 text-xl" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-xs text-outline">
                  {item.description}
                </span>
              </span>
            </Button>
          ))}
        </nav>

        <section className="mt-6 rounded-2xl bg-surface-container-low p-4">
          <Icon name={presentation.icon} className="text-secondary" />
          <p className="mt-2 text-sm font-semibold text-primary">
            {presentation.hintTitle}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
            {presentation.hintText}
          </p>
        </section>
      </div>
    </aside>
  );
}
