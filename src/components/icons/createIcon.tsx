import type React from 'react';

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref' | 'children' | 'fill'> {
  /** Width and height (px or any CSS length). Tailwind size classes such as `h-4 w-4` override it. */
  size?: number | string;
  /** Use the filled variant (FILL 1) for on/selected states, when the icon has one. */
  filled?: boolean;
}

export type IconComponent = React.FC<IconProps>;

/**
 * Material Symbols icon drawn as inline SVG: no icon font to download, works
 * offline, and colour follows `currentColor` like text. Decorative by default
 * (`aria-hidden`); pass `aria-label` for an icon that carries meaning on its own.
 */
export function createIcon(name: string, path: string, filledPath?: string): IconComponent {
  const Icon: IconComponent = ({ size = 24, filled = false, ...props }) => {
    const labelled = Boolean(props['aria-label'] || props['aria-labelledby']);
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 -960 960 960"
        width={size}
        height={size}
        fill="currentColor"
        focusable="false"
        aria-hidden={labelled ? undefined : true}
        role={labelled ? 'img' : undefined}
        data-icon={name}
        {...props}
      >
        <path d={filled && filledPath ? filledPath : path} />
      </svg>
    );
  };
  Icon.displayName = `Icon(${name})`;
  return Icon;
}
