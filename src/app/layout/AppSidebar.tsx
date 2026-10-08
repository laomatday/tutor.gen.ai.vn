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
  expanded?: boolean;
  onToggleExpanded?: () => void;
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
  expanded = false,
  onToggleExpanded,
}: Props) {
  if (role === "Học sinh") {
    const core = studentRoutes.filter((item) => item.group === "Core");
    const secondary = studentRoutes.filter((item) => item.group !== "Core");
    return (
      <aside
        ref={sidebarRef}
        id="main-navigation"
        aria-label="Learning OS"
        className={`app-sidebar app-sidebar--student ${open ? "is-open" : ""} ${expanded ? "is-expanded" : ""}`}
      >
        <div className="student-rail-brand">
          <Button
            variant="surface"
            aria-label="genAi Tutor — Mission"
            onClick={() => onNavigate(roleHome[role])}
            className="student-brand-button"
          >
            <img
              src={appConfig.brand.logoUrl}
              alt=""
              className="h-10 w-10 shrink-0 object-contain"
            />
            <span className="student-rail-label font-bold text-brand">
              gen<span className="text-accent">Ai</span> Tutor
            </span>
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
          <Button
            variant="ghost"
            size="icon"
            aria-label={expanded ? "Thu gọn thanh điều hướng" : "Mở rộng thanh điều hướng"}
            aria-expanded={expanded}
            onClick={onToggleExpanded}
            className="student-rail-toggle hidden lg:inline-flex"
            title={expanded ? "Thu gọn" : "Mở rộng"}
          >
            <Icon name={expanded ? "chevron_left" : "chevron_right"} />
          </Button>
        </div>

        <div className="student-rail-mission">
          <Button
            onClick={() => onNavigate(nextLessonPath)}
            className="student-mission-launch"
            title="Tiếp tục nhiệm vụ"
          >
            <Icon name="play_arrow" className="text-xl" />
            <span className="student-rail-label">Tiếp tục mission</span>
          </Button>
        </div>

        <nav aria-label="Không gian học tập cốt lõi" className="student-rail-nav">
          {core.map((item) => (
            <Button
              key={item.id}
              variant="surface"
              onClick={() => onNavigate(item.path)}
              aria-current={section === item.id ? "page" : undefined}
              className="student-rail-item"
              title={item.label}
            >
              <Icon name={item.icon} className="text-xl" />
              <span className="student-rail-label">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </Button>
          ))}
        </nav>

        <div className="student-rail-divider" />

        <nav
          aria-label="Công cụ bổ sung"
          className="student-rail-nav student-rail-nav--secondary"
        >
          {secondary.map((item) => (
            <Button
              key={item.id}
              variant="surface"
              onClick={() => onNavigate(item.path)}
              aria-current={section === item.id ? "page" : undefined}
              className="student-rail-item"
              title={item.label}
            >
              <Icon name={item.icon} className="text-lg" />
              <span className="student-rail-label">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </Button>
          ))}
        </nav>

        <div className="mt-auto space-y-2 p-2">
          <div
            className="student-progress-orb"
            title={`Mastery ${progress}%`}
            style={{
              background: `conic-gradient(var(--color-accent) ${progress}%, var(--color-ink-100) 0)`,
            }}
          >
            <span>{progress}</span>
          </div>
          <Button
            variant="surface"
            onClick={onOpenProfile}
            aria-label="Mở hồ sơ học tập"
            className="student-profile-orb"
          >
            <img
              src={studentProfile.avatarUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="student-rail-label min-w-0">
              <strong className="truncate">{studentProfile.name}</strong>
              <small>{balance} GP · {studentProfile.levelLabel}</small>
            </span>
          </Button>
          <PWAInstallButton
            variant="surface"
            size="sm"
            className="student-rail-label w-full justify-center"
          />
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
