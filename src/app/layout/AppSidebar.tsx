import type { RefObject } from "react";
import { Button, Icon } from "../../components/ui";
import { PWAInstallButton } from "../../components/pwa/PWAInstallButton";
import { appConfig } from "../../config/app";
import {
  roleHome,
  rolePresentation,
  studentRoutes,
  workspaceRoutes,
  workspacePath,
  type UserRole,
} from "../../config/routes";
import {
  courseHref,
  courseLabel,
  primaryEnrollment,
  studentProfile,
  subjectFor,
} from "../../features/curriculum";

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
}: Props) {
  const presentation = rolePresentation[role];
  const routes = role === "Học sinh" ? studentRoutes : workspaceRoutes[role];
  const groups =
    role === "Học sinh"
      ? [...new Set(studentRoutes.map((item) => item.group))]
      : [presentation.group];
  const enrollment = primaryEnrollment;
  const ownedLabel = courseLabel(enrollment.gradeId, enrollment.subjectId);
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
          <img
            src={appConfig.brand.logoUrl}
            alt={appConfig.brand.name}
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 object-contain"
            referrerPolicy="no-referrer"
          />
          <span>
            <span className="block text-lg font-bold tracking-tight text-primary">
              {appConfig.brand.wordmark}
              <span className="ml-1 text-xs font-semibold uppercase">
                {appConfig.brand.product}
              </span>
            </span>
            <span className="block text-xs text-secondary">
              {role === "Học sinh"
                ? appConfig.brand.tagline
                : presentation.label}
            </span>
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
      </div>
      <div className="px-4 pb-4">
        <Button
          className="w-full justify-between"
          onClick={() =>
            onNavigate(
              role === "Học sinh"
                ? nextLessonPath
                : role === "Giáo viên"
                  ? workspacePath(role, "assignments")
                  : workspacePath(role, "content"),
            )
          }
        >
          <span className="inline-flex items-center gap-2">
            <Icon
              name={
                role === "Học sinh"
                  ? "play_arrow"
                  : role === "Giáo viên"
                    ? "assignment"
                    : "fact_check"
              }
              className="text-lg"
            />
            {role === "Học sinh"
              ? "Tiếp tục học"
              : role === "Giáo viên"
                ? "Giao bài tập"
                : "Quản lý học liệu"}
          </span>
          <Icon name="arrow_forward" className="text-lg" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-4">
        {groups.map((group) => (
          <div key={group}>
            <p className="mb-2 px-2 text-xs uppercase tracking-wider text-outline">
              {group}
            </p>
            <nav aria-label={group} className="space-y-1">
              {routes
                .filter((item) => !("group" in item) || item.group === group)
                .map((item) => (
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
                      {item.description && (
                        <span className="mt-0.5 block text-xs text-outline">
                          {item.description}
                        </span>
                      )}
                    </span>
                    {item.id === "tien-bo" && (
                      <span className="text-xs font-semibold text-secondary">
                        {progress}%
                      </span>
                    )}
                    {item.id === "doi-qua" && (
                      <span className="text-xs text-outline">{balance} GP</span>
                    )}
                  </Button>
                ))}
            </nav>
          </div>
        ))}
        {role === "Học sinh" ? (
          <section className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4 transition-colors hover:border-secondary/35">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary">
                <Icon name="verified" className="text-sm" />
                Môn đã đăng ký
              </span>
              <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-bold text-secondary">
                {progress}%
              </span>
            </div>
            <Button
              variant="surface"
              onClick={() =>
                onNavigate(courseHref(enrollment.gradeId, enrollment.subjectId))
              }
              className="mt-3 flex w-full items-center gap-3 rounded-xl border border-outline-variant/50 bg-white p-3 text-left font-semibold text-primary shadow-2xs transition-all hover:border-secondary/40 hover:shadow-xs active:scale-[0.99]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Icon
                  name={subjectFor(enrollment.subjectId)?.icon ?? "school"}
                  className="text-lg"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-primary">
                  {subjectFor(enrollment.subjectId)?.name} · Lớp{" "}
                  {enrollment.gradeId}
                </p>
                <p className="truncate text-xs font-normal text-on-surface-variant">
                  Chương trình trọng tâm
                </p>
              </div>
              <Icon
                name="chevron_right"
                className="shrink-0 text-base text-outline"
              />
            </Button>
            <div className="mt-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Hành trình học tập</span>
                <span className="font-semibold text-secondary">
                  {progress}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Tiến độ học tập môn đã đăng ký"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full bg-surface-container"
              >
                <div
                  className="h-full rounded-full bg-secondary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl bg-surface-container-low p-4">
            <Icon name={presentation.icon} className="text-secondary" />
            <p className="mt-2 text-sm font-semibold text-primary">
              {presentation.hintTitle}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
              {presentation.hintText}
            </p>
          </section>
        )}
      </div>
      <div className="px-3 pb-2 sm:hidden">
        <PWAInstallButton
          variant="surface"
          size="sm"
          className="w-full justify-center"
        />
      </div>
      <div className="m-2">
        {role === "Học sinh" ? (
          <Button
            variant="surface"
            type="button"
            onClick={onOpenProfile}
            title="Xem hồ sơ & bộ sưu tập huy hiệu"
            className="flex w-full items-center gap-3 rounded-xl bg-surface-container-low p-3 text-left transition-all hover:bg-secondary/10 hover:shadow-2xs active:scale-[0.99] border border-outline-variant/40 h-auto"
          >
            <div className="relative">
              <img
                src={studentProfile.avatarUrl}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-white text-[9px]">
                <Icon name="military_tech" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary">
                {studentProfile.name}
              </p>
              <p className="text-xs text-outline">
                Lớp {studentProfile.className} · {studentProfile.levelLabel}
              </p>
            </div>
            <span className="text-xs font-bold text-secondary">
              {balance}
              <span className="block font-normal text-outline">GP</span>
            </span>
          </Button>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
            <Icon name={presentation.icon} className="text-primary" />
            <div>
              <p className="text-sm font-semibold">
                {role} {appConfig.brand.wordmark}
              </p>
              <p className="text-xs text-outline">Không gian trải nghiệm</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
