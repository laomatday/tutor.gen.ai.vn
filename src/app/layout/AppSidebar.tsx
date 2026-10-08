import type { RefObject } from "react";
import { Button, Icon, Progress } from "../../components/ui";
import { PWAInstallButton } from "../../components/pwa/PWAInstallButton";
import { BrandLogo } from "../../components/BrandLogo";
import { appConfig } from "../../config/app";
import {
  roleHome, rolePresentation, studentRoutes, workspaceRoutes, workspacePath, type UserRole,
} from "../../config/routes";
import { studentProfile } from "../../features/curriculum";
import { StudentAvatar } from "../../components/student/StudentAvatar";

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
}

export function AppSidebar({
  role, section, open, sidebarRef, closeRef, onClose,
  onNavigate, onOpenProfile, nextLessonPath, progress, balance,
  pinned = true,
}: Props) {
  if (role === "Học sinh") {
    const core = studentRoutes.filter((item) => item.group === "Core");
    const other = studentRoutes.filter((item) => item.group !== "Core");
    return (
      <aside
        ref={sidebarRef}
        id="main-navigation"
        aria-label="Menu học tập"
        className={`app-sidebar app-sidebar--student ${open ? "is-open" : ""} ${pinned ? "is-pinned" : ""}`}
      >
        <div className="student-sidebar-panel__header">
          <Button variant="ghost" className="student-sidebar-brand" onClick={() => onNavigate(roleHome[role])} aria-label="genAi Tutor — Trang chủ">
            <BrandLogo compact />
          </Button>
          <Button ref={closeRef} variant="ghost" size="icon" aria-label="Đóng menu" onClick={onClose} className="student-sidebar-close lg:hidden">
            <Icon name="close" />
          </Button>
        </div>

        <div className="student-sidebar-scroll">
          <div className="student-sidebar-section__label">TIẾP TỤC</div>
          <Button onClick={() => onNavigate(nextLessonPath)} className="student-sidebar-next">
            <span className="student-sidebar-next__symbol"><Icon name="play_arrow" /></span>
            <span className="min-w-0 flex-1 text-left">
              <strong>Tiếp tục học</strong>
              <small>Mở bài học tiếp theo</small>
            </span>
            <Icon name="arrow_forward" />
          </Button>

          <nav className="student-sidebar-navigation" aria-label="Các trang học tập">
            <p className="student-sidebar-section__label" id="student-nav-core">HỌC TẬP</p>
            <div role="group" aria-labelledby="student-nav-core">
              {core.map((item) => (
                <Button key={item.id} variant="ghost" onClick={() => onNavigate(item.path)}
                  aria-current={section === item.id ? "page" : undefined}
                  className="student-sidebar-row">
                  <Icon name={item.icon} className="student-sidebar-row__icon" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>
            <p className="student-sidebar-section__label" id="student-nav-other">CÁ NHÂN</p>
            <div role="group" aria-labelledby="student-nav-other">
              {other.map((item) => (
                <Button key={item.id} variant="ghost" onClick={() => onNavigate(item.path)}
                  aria-current={section === item.id ? "page" : undefined}
                  className="student-sidebar-row">
                  <Icon name={item.icon} className="student-sidebar-row__icon" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>
          </nav>
        </div>

        <div className="student-sidebar-panel__footer">
          <div className="student-sidebar-progress">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold">Bài học đã hoàn thành</span>
              <strong className="text-sm">{progress}%</strong>
            </div>
            <Progress value={progress} label="Tiến độ hoàn thành" tone="accent" className="student-sidebar-progress__track" />
            <small>{balance} GP · Dữ liệu minh họa</small>
          </div>
          <Button variant="ghost" onClick={onOpenProfile} className="student-sidebar-profile">
            <StudentAvatar name={studentProfile.name} src={studentProfile.avatarUrl} className="h-10 w-10 shrink-0 rounded-full" />
            <span className="min-w-0 flex-1 text-left"><strong>{studentProfile.name}</strong><small>Lớp {studentProfile.className}</small></span>
            <Icon name="chevron_right" />
          </Button>
          <PWAInstallButton variant="ghost" size="sm" className="student-sidebar-install w-full justify-center" />
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
