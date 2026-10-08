import { Button, Icon } from "../ui";
import { studentRoutes } from "../../config/routes";

export function StudentBottomNav({
  section,
  onNavigate,
}: {
  section: string;
  onNavigate: (path: string) => void;
}) {
  const core = studentRoutes.filter((item) => item.group === "Core");
  return (
    <nav className="student-bottom-nav lg:hidden" aria-label="Điều hướng học tập chính">
      {core.map((item) => (
        <Button
          key={item.id}
          variant="surface"
          onClick={() => onNavigate(item.path)}
          aria-current={section === item.id ? "page" : undefined}
          className="student-bottom-nav__item"
        >
          <Icon name={item.icon} className="text-xl" />
          <span>{item.label}</span>
        </Button>
      ))}
    </nav>
  );
}
