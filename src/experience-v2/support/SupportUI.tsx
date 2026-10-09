import { Icon } from "../../components/ui";

interface SupportHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  children?: React.ReactNode;
}

export function SupportHeader({ eyebrow, title, description, icon, children }: SupportHeaderProps) {
  return (
    <header className="v2-support-hero">
      <div className="v2-support-hero-copy">
        <p className="v2-support-eyebrow"><Icon name={icon} /> {eyebrow}</p>
        <h1>{title}</h1>
        <p className="v2-support-summary">{description}</p>
      </div>
      {children && <div className="v2-support-hero-actions">{children}</div>}
    </header>
  );
}

export function SupportDisclosure({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="v2-support-disclosure">
      <summary>{title}<Icon name="expand_more" /></summary>
      <div>{children}</div>
    </details>
  );
}
