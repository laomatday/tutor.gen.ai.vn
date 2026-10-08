import type { MouseEvent } from "react";
import { Icon } from "../../components/ui";
import { courseHref } from "../../features/curriculum/links";
import { ordinaryLinkClick } from "../navigation";
import { roleHome, type UserRole } from "../../config/routes";
import type { Subject } from "../../types/content";

type Crumb = { text: string; path?: string };

/** Teacher and admin breadcrumb trail, rendered inside <main>. */
export function PageBreadcrumbs({
  role,
  section,
  label,
  search,
  subjects,
  onNavigate,
}: {
  role: UserRole;
  section: string;
  label: string;
  search: string;
  subjects: Subject[];
  onNavigate: (path: string) => void;
}) {
  const rootLabel =
    role === "Học sinh"
      ? "Không gian học tập"
      : role === "Giáo viên"
        ? "Không gian giáo viên"
        : "Không gian quản trị";
  const crumbs: Crumb[] = [
    { text: rootLabel, path: roleHome[role] },
    { text: label },
  ];
  if (role === "Học sinh" && section === "hoc-bai") {
    const params = new URLSearchParams(search);
    const subjectId = params.get("subject");
    const gradeId = params.get("grade");
    const subject = subjects.find((item) => item.id === subjectId);
    if (subject && gradeId) {
      crumbs[1] = { text: label, path: "/hoc-bai" };
      crumbs.push({
        text: `${subject.name} · Lớp ${gradeId}`,
        path:
          params.has("topic") || params.has("lesson")
            ? courseHref(gradeId, subject.id)
            : undefined,
      });
    }
  }

  const navigate = (event: MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!ordinaryLinkClick(event)) return;
    event.preventDefault();
    onNavigate(path);
  };
  return (
    <nav className="app-breadcrumbs" aria-label="Đường dẫn">
      <ol className="app-breadcrumbs__list">
        {crumbs.map((crumb, index) => (
          <li key={`${crumb.text}-${index}`} className="app-breadcrumbs__item">
            {index > 0 && (
              <Icon name="chevron_right" className="app-breadcrumbs__divider" />
            )}
            {crumb.path ? (
              <a
                href={crumb.path}
                onClick={(event) => navigate(event, crumb.path!)}
                className="app-breadcrumbs__link"
              >
                {crumb.text}
              </a>
            ) : (
              <span aria-current="page" className="app-breadcrumbs__current">
                {crumb.text}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
