import { useEffect, useRef, useState, type RefObject } from "react";
import { Button, Icon, Input, Modal, Select } from "../../components/ui";
import { PWAInstallButton } from "../../components/pwa/PWAInstallButton";
import { BrandLogo } from "../../components/BrandLogo";
import {
  roles,
  roleHome,
  routePath,
  studentRoutes,
  type UserRole,
} from "../../config/routes";
import { appConfig } from "../../config/app";
import { studentProfile } from "../../features/learning/data/student";
import { StudentAvatar } from "../../components/student/StudentAvatar";
import { avatarInitials } from "../../components/student/avatarInitials";
import { SidebarToggle } from "./SidebarToggle";
import { useCurriculum } from "../../context/CurriculumContext";
import { courseHref, ownedPublishedLessons } from "../../features/curriculum";
import { ordinaryLinkClick } from "../navigation";

interface PageContextProps {
  section: string;
  label: string;
  search: string;
  onNavigate: (path: string) => void;
}

function StudentPageContext({
  section,
  label,
  search,
  onNavigate,
}: PageContextProps) {
  const { subjects, lessons, topics } = useCurriculum();
  const params = new URLSearchParams(search);
  const availableLessons = ownedPublishedLessons(lessons, topics);
  const courses = studentProfile.enrollments.flatMap((enrollment) => {
    const subject = subjects.find((item) => item.id === enrollment.subjectId);
    if (
      !subject ||
      !availableLessons.some(
        (lesson) =>
          lesson.gradeId === enrollment.gradeId &&
          lesson.subjectId === enrollment.subjectId,
      )
    )
      return [];
    return [
      {
        ...enrollment,
        label: `${subject.name} ${enrollment.gradeId}`,
        href: courseHref(enrollment.gradeId, enrollment.subjectId),
      },
    ];
  });
  const selected =
    section === "hoc-bai"
      ? courses.find(
          (course) =>
            course.subjectId === params.get("subject") &&
            (!params.get("grade") || course.gradeId === params.get("grade")),
        )
      : undefined;
  const lesson = selected
    ? availableLessons.find(
        (item) =>
          item.id === params.get("lesson") &&
          item.subjectId === selected.subjectId &&
          item.gradeId === selected.gradeId,
      )
    : undefined;
  const route = studentRoutes.find((item) => item.id === section);

  if (!selected)
    return (
      <div className="student-header-context student-header-context--section">
        <Icon name={route?.icon ?? "menu_book"} />
        <span>{label}</span>
      </div>
    );

  const backPath = lesson ? selected.href : routePath("hoc-bai");
  const backLabel = lesson ? selected.label : "Môn học";
  return (
    <nav className="student-header-context" aria-label="Điều hướng môn học">
      <a
        href={backPath}
        className="student-header-context__back"
        aria-label={`Quay lại ${backLabel}`}
        title={`Quay lại ${backLabel}`}
        onClick={(event) => {
          if (!ordinaryLinkClick(event)) return;
          event.preventDefault();
          onNavigate(backPath);
        }}
      >
        <Icon name="arrow_back" />
        <span>{backLabel}</span>
      </a>
      <span className="student-header-context__divider" aria-hidden="true">
        /
      </span>
      {lesson ? (
        <span className="student-header-context__current" title={lesson.title}>
          {lesson.title}
        </span>
      ) : courses.length > 1 ? (
        <Select
          className="student-header-context__course"
          value={selected.href}
          onChange={(event) => onNavigate(event.target.value)}
          aria-label={`${selected.label} · Chuyển môn học`}
          title="Chuyển môn học"
        >
          {courses.map((course) => (
            <option key={course.href} value={course.href}>
              {course.label}
            </option>
          ))}
        </Select>
      ) : (
        <span className="student-header-context__current">
          {selected.label}
        </span>
      )}
    </nav>
  );
}

interface Props extends PageContextProps {
  role: UserRole;
  menuOpen: boolean;
  menuRef: RefObject<HTMLButtonElement | null>;
  onMenu: () => void;
  onNavigate: (path: string) => void;
  onOpenProfile?: () => void;
}

export function AppHeader({
  role,
  section,
  label,
  search: locationSearch,
  menuOpen,
  menuRef,
  onMenu,
  onNavigate,
  onOpenProfile,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!searchOpen) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [searchOpen]);

  useEffect(() => {
    if (role !== "Học sinh") return;
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [role]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    if (!query) {
      searchRef.current?.focus();
      return;
    }
    setSearchOpen(false);
    onNavigate(`${routePath("hoc-bai")}?q=${encodeURIComponent(query)}`);
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
            className="app-header__menu app-header__logo lg:hidden"
          >
            <img src={appConfig.brand.logoUrl} alt="" width={28} height={28} />
          </Button>
          <StudentPageContext
            section={section}
            label={label}
            search={locationSearch}
            onNavigate={onNavigate}
          />
        </div>
        <div className="app-header__end">
          <Button
            variant="ghost"
            size="icon"
            className="app-header__search-toggle"
            aria-label="Tìm bài học"
            aria-haspopup="dialog"
            title="Tìm bài học (Ctrl/⌘ K)"
            onClick={() => setSearchOpen(true)}
          >
            <Icon name="search" />
          </Button>
          <Button
            variant="ghost"
            onClick={onOpenProfile}
            className="app-header__profile"
            aria-label={`Mở hồ sơ học tập: ${avatarInitials(studentProfile.name)} · ${studentProfile.name}`}
          >
            <span aria-hidden="true">
              <StudentAvatar
                name={studentProfile.name}
                src={studentProfile.avatarUrl}
                className="h-9 w-9 rounded-full"
              />
            </span>
          </Button>
        </div>
        <Modal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          title="Tìm bài học"
          className="app-search-dialog"
        >
          <form
            role="search"
            onSubmit={submitSearch}
            className="app-search-form"
          >
            <Input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Tìm bài học theo tên, chủ đề hoặc từ khóa"
              placeholder="Tên bài học, chủ đề hoặc từ khóa…"
            />
            <Button type="submit">
              <Icon name="search" /> Tìm kiếm
            </Button>
          </form>
          <p className="ui-hint mt-3">
            Tìm trong các môn học đã đăng ký của em.
          </p>
        </Modal>
      </header>
    );
  }

  return (
    <header className="app-header">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarToggle
          ref={menuRef}
          onClick={onMenu}
          label={menuOpen ? "Đóng menu" : "Mở menu"}
          expanded={menuOpen}
          className="lg:hidden"
        />
        <BrandLogo
          compact
          showProduct={false}
          className="hidden sm:inline-flex md:hidden"
        />
        <span className="app-header__context hidden md:inline">
          {role === "Giáo viên"
            ? "Không gian giáo viên"
            : "Không gian quản trị"}
        </span>
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
                onClick={() => role !== item && onNavigate(roleHome[item])}
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
