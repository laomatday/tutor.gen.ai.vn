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
  ownedPublishedLessons,
  primaryEnrollment,
  summarizeProgress,
} from "../features/curriculum";
import { StudentProfileModal } from "../features/gamification/StudentProfileModal";
import type { TeacherSection } from "../features/teacher/TeacherView";
import type { AdminSection } from "../features/admin/AdminView";
import { AppHeader } from "./layout/AppHeader";
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

export default function App() {
  const location = useAppLocation();
  const { role, section, label } = readRoute(location.pathname);
  const { lessons, topics, completedLessonIds } = useCurriculum();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const progress = summarizeProgress(
    ownedPublishedLessons(lessons, topics),
    completedLessonIds,
  );
  const notice = useNotice();
  const wallet = useRewardWallet(notice.show);
  const menu = useMobileNavigation();
  const isStudent = role === "Học sinh";
  const [studentSidebarPinned, setStudentSidebarPinned] = useLocalStorage<boolean>(
    storageKeys.studentSidebarPinned,
    false,
    (value): value is boolean => typeof value === "boolean",
  );
  const nextLessonPath = progress.nextLesson
    ? lessonHref(progress.nextLesson)
    : courseHref(primaryEnrollment.gradeId, primaryEnrollment.subjectId);
  const studentSidebarVisible = isStudent && (studentSidebarPinned || menu.open);

  const toggleStudentSidebar = () => {
    if (studentSidebarPinned) {
      setStudentSidebarPinned(false);
      menu.setOpen(false);
      return;
    }
    menu.setOpen((value) => !value);
  };

  const toggleStudentSidebarPinned = () => {
    setStudentSidebarPinned((value) => {
      const next = !value;
      menu.setOpen(!next);
      return next;
    });
  };

  useEffect(() => {
    document.title = `${label} | ${appConfig.brand.name}`;
  }, [label]);

  useEffect(() => {
    menu.setOpen(false);
  }, [location.pathname, location.search]);

  const navigate = (path: string) => {
    if (navigateTo(path)) {
      notice.clear();
      menu.setOpen(false);
    }
  };

  const navigateStudent = (tab: string) =>
    navigate(tab.startsWith("/") ? tab : routePath(tab as NavTab));

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-70 rounded-xl bg-white p-3 text-primary focus:not-sr-only"
      >
        Đi đến nội dung
      </a>

      {menu.open && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-inverse-surface/40 lg:hidden"
          onClick={() => menu.setOpen(false)}
        />
      )}

      <AppSidebar
        role={role}
        section={section}
        open={menu.open}
        sidebarRef={menu.sidebar}
        closeRef={menu.closeButton}
        onClose={() => menu.setOpen(false)}
        onNavigate={navigate}
        onOpenProfile={() => setIsProfileOpen(true)}
        nextLessonPath={nextLessonPath}
        progress={progress.percent}
        balance={wallet.balance}
        pinned={studentSidebarPinned}
        onToggleSidebar={toggleStudentSidebar}
        onTogglePinned={toggleStudentSidebarPinned}
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
          label={label}
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
              {role === "Học sinh" && (
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
              )}

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
