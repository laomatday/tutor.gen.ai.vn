import { lazy, Suspense, useEffect, useState } from "react";
import { Alert, Icon } from "../components/ui";
import { OfflineIndicator } from "../components/pwa/OfflineIndicator";
import { StudentBottomNav } from "../components/student/StudentBottomNav";
import { appConfig } from "../config/app";
import { routePath, workspacePath, type NavTab } from "../config/routes";
import { useCurriculum } from "../context/CurriculumContext";
import {
  courseHref,
  lessonHref,
  primaryEnrollment,
  studentProfile,
  getCourseProgress,
} from "../features/curriculum";
import { StudentProfileModal } from "../features/gamification/StudentProfileModal";
import type { TeacherSection } from "../features/teacher/TeacherView";
import type { AdminSection } from "../features/admin/AdminView";
import { AppHeader } from "./layout/AppHeader";
import { PageBreadcrumbs } from "./layout/PageBreadcrumbs";
import { AppSidebar } from "./layout/AppSidebar";
import { useMobileNavigation } from "./layout/useMobileNavigation";
import { navigateTo, readRoute } from "./navigation";
import { useAppLocation } from "./useAppLocation";
import { useNotice } from "./useNotice";
import { useRewardWallet } from "./useRewardWallet";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { storageKeys } from "../config/storage";
import { ScreenErrorBoundary } from "./ScreenErrorBoundary";
import "./layout/shell.css";

const TodayView = lazy(() =>
  import("../features/learning/TodayView").then((module) => ({
    default: module.TodayView,
  })),
);
const KnowledgeMapView = lazy(() =>
  import("../features/learning/KnowledgeMapView").then((module) => ({
    default: module.KnowledgeMapView,
  })),
);
const TimetableScheduleView = lazy(() =>
  import("../features/schedule/TimetableScheduleView").then((module) => ({
    default: module.TimetableScheduleView,
  })),
);
const SelfSolveView = lazy(() =>
  import("../features/practice/SelfSolveView").then((module) => ({
    default: module.SelfSolveView,
  })),
);
const ExamIntelligenceView = lazy(() =>
  import("../features/progress/ExamIntelligenceView").then((module) => ({
    default: module.ExamIntelligenceView,
  })),
);
const ThinkingReplayView = lazy(() =>
  import("../features/progress/ThinkingReplayView").then((module) => ({
    default: module.ThinkingReplayView,
  })),
);
const RewardsStoreView = lazy(() =>
  import("../features/rewards/RewardsStoreView").then((module) => ({
    default: module.RewardsStoreView,
  })),
);
const TeacherView = lazy(() =>
  import("../features/teacher/TeacherView").then((module) => ({
    default: module.TeacherView,
  })),
);
const AdminView = lazy(() =>
  import("../features/admin/AdminView").then((module) => ({
    default: module.AdminView,
  })),
);

const TutorPilotView = lazy(() =>
  import("../features/pilot/TutorPilotView").then(module => ({
    default: module.TutorPilotView,
  })),
);

export default function App() {
  const location = useAppLocation();
  const { role, section, label } = readRoute(location.pathname);
  const {
    subjects,
    lessons,
    topics,
    completedLessonIds,
    contentLoading,
    contentError,
  } = useCurriculum();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const selectedSubject = new URLSearchParams(location.search).get("subject");
  const activeEnrollment =
    studentProfile.enrollments.find(
      (course) => course.subjectId === selectedSubject,
    ) ?? primaryEnrollment;
  const progress = getCourseProgress(
    lessons,
    topics,
    completedLessonIds,
    activeEnrollment,
  );
  const notice = useNotice();
  const wallet = useRewardWallet(notice.show);
  const isStudent = role === "Học sinh";
  const [desktopSidebarVisible, setDesktopSidebarVisible] =
    useLocalStorage<boolean>(
      storageKeys.studentSidebarVisibleV2,
      false,
      (value): value is boolean => typeof value === "boolean",
    );
  const menu = useMobileNavigation(!isStudent || desktopSidebarVisible);
  const nextLessonPath = progress.nextLesson
    ? lessonHref(progress.nextLesson)
    : courseHref(primaryEnrollment.gradeId, primaryEnrollment.subjectId);
  const studentSidebarVisible = isStudent && desktopSidebarVisible;

  const toggleStudentSidebar = () => {
    if (menu.isDesktop) {
      setDesktopSidebarVisible((visible) => !visible);
      menu.setOpen(false);
    } else {
      menu.setOpen((visible) => !visible);
    }
  };

  useEffect(() => {
    document.title = `${label} | ${appConfig.brand.name}`;
  }, [label]);

  useEffect(() => {
    menu.setOpen(false);
  }, [location.pathname, location.search]);

  const navigate = (path: string) => {
    menu.setOpen(false);
    if (navigateTo(path)) {
      notice.clear();
    }
  };

  const navigateStudent = (tab: string) =>
    navigate(tab.startsWith("/") ? tab : routePath(tab as NavTab));

  // Pilot deployment requires explicit rollout approval. This public client
  // flag controls discoverability only; server-side Auth and RLS enforce access.
  if (location.pathname === "/pilot") {
    if (import.meta.env.VITE_TUTOR_PILOT_ENABLED !== "true") {
      return (
        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-6">
          <h1 className="text-2xl font-bold text-brand">Tutor Pilot chưa được mở</h1>
          <p className="text-ink-600">
            Không gian có tài khoản chỉ được bật sau khi kiểm chứng phân quyền,
            học liệu và quy trình tham gia. Bản trải nghiệm công khai vẫn hoạt động.
          </p>
          <a className="ui-btn ui-btn-secondary w-fit" href="/">Quay lại bản trải nghiệm</a>
        </main>
      );
    }
    return (
      <Suspense fallback={<div role="status" className="p-6">Đang mở không gian học có tài khoản…</div>}>
        <TutorPilotView />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-70 rounded-xl bg-white p-3 text-primary focus:not-sr-only"
      >
        Đi đến nội dung
      </a>

      <div
        aria-hidden="true"
        className={`app-navigation-backdrop lg:hidden ${menu.open ? "is-open" : ""}`}
        onClick={() => menu.setOpen(false)}
      />

      <AppSidebar
        role={role}
        section={section}
        open={menu.open}
        sidebarRef={menu.sidebar}
        closeRef={menu.closeButton}
        onClose={() => menu.setOpen(false)}
        onNavigate={navigate}
        nextLessonPath={nextLessonPath}
        isDesktop={menu.isDesktop}
        pinned={desktopSidebarVisible}
        onToggleSidebar={toggleStudentSidebar}
      />

      <div
        ref={menu.content}
        className={
          isStudent
            ? `app-frame app-frame--student ${studentSidebarVisible ? "app-frame--student-sidebar-open" : ""}`
            : "app-frame"
        }
      >
        <AppHeader
          role={role}
          section={section}
          label={label}
          search={location.search}
          menuOpen={menu.open}
          menuRef={menu.trigger}
          onMenu={toggleStudentSidebar}
          onNavigate={navigate}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        <div role="status" aria-live="polite" aria-atomic="true">
          {notice.notice && (
            <div className="app-toast flex items-start gap-2">
              <Icon name="verified" className="shrink-0 text-secondary-fixed" />
              <span>{notice.notice}</span>
            </div>
          )}
        </div>

        <main
          id="main-content"
          tabIndex={-1}
          className={isStudent ? "app-main app-main--student" : "app-main"}
        >
          {!isStudent && (
            <PageBreadcrumbs
              role={role}
              section={section}
              label={label}
              search={location.search}
              subjects={subjects}
              onNavigate={navigate}
            />
          )}
          {contentError && !contentLoading && isStudent && (
            <Alert tone="warning" className="mb-4">
              Chưa kết nối được học liệu trực tuyến. Nội dung đang hiển thị là
              dữ liệu minh họa; tiến độ được lưu trên trình duyệt này.
            </Alert>
          )}
          {wallet.error && (
            <Alert tone="warning" className="mb-4">
              {wallet.error}
            </Alert>
          )}

          <ScreenErrorBoundary key={role} resetKey={section}>
            <Suspense
              fallback={
                <div
                  role="status"
                  className="rounded-2xl border border-outline-variant bg-white p-8 text-sm text-on-surface-variant"
                >
                  Đang tải {label.toLocaleLowerCase(appConfig.locale)}…
                </div>
              }
            >
              {role === "Học sinh" &&
                (contentLoading ? (
                  <div
                    role="status"
                    aria-label="Đang tải học liệu"
                    className="learning-load-skeleton"
                  >
                    <div className="learning-load-skeleton__title" />
                    <div className="learning-load-skeleton__card" />
                    <div className="learning-load-skeleton__card" />
                  </div>
                ) : (
                  <>
                    {section === "hom-nay" && (
                      <TodayView
                        onNavigate={navigateStudent}
                        onOpenBadges={() => setIsProfileOpen(true)}
                        gpBalance={wallet.balance}
                        dailyGp={wallet.dailyGp}
                        onEarnGp={wallet.earn}
                      />
                    )}

                    {section === "hoc-bai" && (
                      <KnowledgeMapView
                        onNavigate={navigateStudent}
                        onEarnGp={wallet.earn}
                      />
                    )}

                    {section === "tu-giai" && (
                      <SelfSolveView
                        onEarnGp={wallet.earn}
                        onNavigate={navigateStudent}
                      />
                    )}

                    {section === "replay" && (
                      <ThinkingReplayView onNavigate={navigateStudent} />
                    )}

                    {section === "thoi-khoa-bieu" && (
                      <TimetableScheduleView onNavigate={navigateStudent} />
                    )}

                    {(section === "thi-thu" || section === "tien-bo") && (
                      <ExamIntelligenceView
                        onNavigate={navigateStudent}
                        onOpenBadges={() => setIsProfileOpen(true)}
                      />
                    )}

                    {section === "doi-qua" && (
                      <RewardsStoreView
                        gpBalance={wallet.balance}
                        dailyGp={wallet.dailyGp}
                        onNavigate={navigateStudent}
                        onSpendGp={wallet.spend}
                      />
                    )}
                  </>
                ))}

              {role === "Giáo viên" && (
                <TeacherView
                  section={section as TeacherSection}
                  onSectionChange={(next) =>
                    navigate(workspacePath(role, next))
                  }
                  onNotice={notice.show}
                />
              )}

              {role === "Quản trị" && (
                <AdminView
                  section={section as AdminSection}
                  onSectionChange={(next) =>
                    navigate(workspacePath(role, next))
                  }
                  onNotice={notice.show}
                />
              )}
            </Suspense>
          </ScreenErrorBoundary>
        </main>
      </div>

      {isStudent && (
        <StudentBottomNav section={section} onNavigate={navigate} />
      )}

      <StudentProfileModal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        gpBalance={wallet.balance}
        completedLessonsCount={completedLessonIds.length}
      />
      <OfflineIndicator />
    </div>
  );
}
