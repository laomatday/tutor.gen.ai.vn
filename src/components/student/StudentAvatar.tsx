import { useState } from "react";
import { avatarInitials } from "./avatarInitials";

interface StudentAvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

/** Self-contained avatar with a text fallback (including failed image URLs). */
export function StudentAvatar({
  name,
  src,
  className = "",
}: StudentAvatarProps) {
  const [broken, setBroken] = useState(false);
  const initials = avatarInitials(name);
  if (!src || broken) {
    return (
      <span
        role="img"
        aria-label={name}
        className={`student-avatar-fallback ${className}`}
      >
        {initials}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setBroken(true)}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
}
