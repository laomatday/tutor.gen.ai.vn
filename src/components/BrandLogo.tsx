import { appConfig } from "../config/app";
import { cn } from "./ui";

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
  showProduct?: boolean;
}

/** Shared tutor lockup: official genAi mark + gen/Ai wordmark treatment. */
export function BrandLogo({
  className,
  compact = false,
  showProduct = true,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <img
        src={appConfig.brand.logoUrl}
        alt=""
        width={44}
        height={44}
        className={cn("shrink-0 object-contain", compact ? "h-7 w-7" : "h-10 w-10")}
        referrerPolicy="no-referrer"
      />
      <span className="flex min-w-0 flex-col justify-center">
        <span className={cn("font-bold leading-none tracking-tight text-primary", compact ? "text-xl" : "text-2xl")}>
          gen<span className="text-accent">Ai</span>
        </span>
        {showProduct && (
          <span className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-primary/80">
            Tutor
          </span>
        )}
      </span>
    </span>
  );
}
