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
import { SidebarToggle } from "./SidebarToggle";

interface Props {
  role: UserRole;
  section: string;
  open: boolean;
  sidebarRef: RefObject<HTMLElement | null>;
  closeRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onNavigate: (path: string) => void;
  nextLessonPath: string;
  isDesktop: boolean;
  pinned?: boolean;
  onToggleSidebar?: () => void;
}

export function AppSidebar({
  role,
  section,
  open,
  sidebarRef,
  closeRef,
  onClose,
  onNavigate,
  nextLessonPath,
  isDesktop,
  pinned = true,
  onToggleSidebar,
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
          <Button
            ref={closeRef}
            variant="ghost"
            className="student-sidebar-brand"
            onClick={onToggleSidebar}
            aria-label={
              isDesktop
                ? pinned
                  ? "Thu gọn menu"
                  : "Mở rộng menu"
                : "Đóng menu"
            }
            aria-expanded={isDesktop ? pinned : open}
            aria-controls="main-navigation"
            title={
              isDesktop
                ? pinned
                  ? "Thu gọn menu"
                  : "Mở rộng menu"
                : "Đóng menu"
            }
          >
            <img
              src={appConfig.brand.logoUrl}
              alt=""
              width={42}
              height={42}
              className="student-sidebar-brand__logo"
            />
            <span className="student-sidebar-brand__copy" aria-hidden="true">
              <span className="student-sidebar-brand__name">
                {appConfig.brand.wordmark}{" "}
                <small>{appConfig.brand.product}</small>
              </span>
              <span className="student-sidebar-brand__tagline">
                {appConfig.brand.tagline}
              </span>
            </span>
          </Button>
        </div>

        <div className="student-sidebar-scroll">
          <Button
            onClick={() => onNavigate(nextLessonPath)}
            className="student-sidebar-next"
            title="Tiếp tục học"
            aria-label="Tiếp tục học bài tiếp theo"
          >
            <Icon name="play_arrow" className="student-sidebar-next__play" />
            <span className="student-sidebar-next__label">Tiếp tục học</span>
            <Icon
              name="arrow_forward"
              className="student-sidebar-next__arrow"
            />
          </Button>

          <nav
            className="student-sidebar-navigation"
            aria-label="Các trang học tập"
          >
            <p className="student-sidebar-section__label" id="student-nav-core">
              HỌC TẬP
            </p>
            <div role="group" aria-labelledby="student-nav-core">
              {core.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => onNavigate(item.path)}
                  aria-current={section === item.id ? "page" : undefined}
                  className="student-sidebar-row"
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon
                    name={item.icon}
                    className="student-sidebar-row__icon"
                  />
                  <span className="student-sidebar-row__text">
                    <strong>{item.label}</strong>
                    {item.id === "hoc-bai" && <small>Lớp · Môn · Chủ đề</small>}
                  </span>
                </Button>
              ))}
            </div>
            <p
              className="student-sidebar-section__label"
              id="student-nav-other"
            >
              CÁ NHÂN
            </p>
            <div role="group" aria-labelledby="student-nav-other">
              {other.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => onNavigate(item.path)}
                  aria-current={section === item.id ? "page" : undefined}
                  className="student-sidebar-row"
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon
                    name={item.icon}
                    className="student-sidebar-row__icon"
                  />
                  <span className="student-sidebar-row__text">
                    <strong>{item.label}</strong>
                  </span>
                </Button>
              ))}
            </div>
          </nav>
        </div>

        <div className="student-sidebar-panel__footer">
          <PWAInstallButton
            variant="ghost"
            size="sm"
            className="student-sidebar-install w-full justify-center"
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
          onClick={() => onNavigate(roleHome[role])}
          className="flex items-center gap-3 text-left"
        >
          <BrandLogo />
          <span className="sr-only"> — Trang chủ</span>
        </Button>
        <SidebarToggle
          ref={closeRef}
          expanded={open}
          label="Đóng menu"
          onClick={onClose}
          className="lg:hidden"
        />
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
                <span className="block text-sm font-semibold">
                  {item.label}
                </span>
                <span
                  className={`mt-0.5 block text-xs ${section === item.id ? "text-white" : "text-outline"}`}
                >
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
