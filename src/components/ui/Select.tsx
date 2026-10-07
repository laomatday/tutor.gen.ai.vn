import {
  Children,
  Fragment,
  forwardRef,
  isValidElement,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { cn } from "./utils";

interface Option {
  value: string;
  label: string;
  disabled: boolean;
  group?: string;
}
interface OptionProps {
  value?: string | number;
  children?: ReactNode;
  disabled?: boolean;
  label?: string;
}
export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "multiple" | "size"
> {
  size?: "sm" | "md";
  variant?: "field" | "pill";
}

function plainText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      isValidElement(child)
        ? plainText((child.props as OptionProps).children)
        : String(child),
    )
    .join("");
}

function readOptions(
  children: ReactNode,
  group?: string,
  groupDisabled = false,
): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const element = child as ReactElement<OptionProps>;
    if (element.type === Fragment)
      return readOptions(element.props.children, group, groupDisabled);
    if (element.type === "optgroup")
      return readOptions(
        element.props.children,
        element.props.label,
        !!element.props.disabled,
      );
    if (element.type !== "option") return [];
    const label = element.props.label ?? plainText(element.props.children);
    return [
      {
        value: String(element.props.value ?? label),
        label,
        disabled: groupDisabled || !!element.props.disabled,
        group,
      },
    ];
  });
}

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLocaleLowerCase("vi");

/** Single-value combobox with the native option/change contract. The hidden
 * select preserves native form values, reset, validation and caller refs. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      children,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      onInvalid,
      className,
      size = "md",
      variant = "field",
      id,
      disabled,
      required,
      name,
      title,
      tabIndex,
      style,
      "aria-label": ariaLabel,
      "aria-labelledby": labelledBy,
      "aria-describedby": describedBy,
      "aria-invalid": invalid,
      ...nativeProps
    },
    forwardedRef,
  ) {
    const options = useMemo(() => readOptions(children), [children]);
    const autoId = useId();
    const triggerId = id || `${autoId}-trigger`;
    const listId = `${autoId}-list`;
    const nativeRef = useRef<HTMLSelectElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const typeahead = useRef({ text: "", at: 0 });
    const [uncontrolled, setUncontrolled] = useState(
      String(
        defaultValue ?? options.find((option) => !option.disabled)?.value ?? "",
      ),
    );
    const selectedValue = value === undefined ? uncontrolled : String(value);
    const selectedIndex = options.findIndex(
      (option) => option.value === selectedValue,
    );
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [position, setPosition] = useState<CSSProperties>({
      position: "fixed",
      visibility: "hidden",
    });
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
    useImperativeHandle(forwardedRef, () => nativeRef.current!, []);

    const enabledIndex = (start: number, direction: 1 | -1) => {
      for (let i = start; i >= 0 && i < options.length; i += direction)
        if (!options[i].disabled) return i;
      return -1;
    };
    const openList = (fromEnd = false) => {
      if (disabled || !options.some((option) => !option.disabled)) return;
      setPortalTarget(triggerRef.current?.closest("dialog") || document.body);
      setActiveIndex(
        selectedIndex >= 0 && !options[selectedIndex].disabled
          ? selectedIndex
          : enabledIndex(fromEnd ? options.length - 1 : 0, fromEnd ? -1 : 1),
      );
      setOpen(true);
    };
    const choose = (index: number) => {
      const option = options[index];
      const native = nativeRef.current;
      if (!option || option.disabled || !native) return;
      if (option.value !== selectedValue) {
        native.value = option.value;
        // React receives a real select change event, including target/currentTarget.
        native.dispatchEvent(new Event("change", { bubbles: true }));
      }
      setOpen(false);
      triggerRef.current?.focus();
    };

    useLayoutEffect(() => {
      if (!open) return;
      const reposition = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const styles = getComputedStyle(document.documentElement);
        const metric = (name: string) =>
          Number.parseFloat(styles.getPropertyValue(name));
        const gap = metric("--popover-gap");
        const inset = metric("--popover-inset");
        const preferredHeight = metric("--popover-max-height");
        const itemHeight = metric("--menu-item-height");
        const menuPadding = metric("--menu-padding");
        const below = window.innerHeight - rect.bottom - gap - inset;
        const above = rect.top - gap - inset;
        const flip =
          below <
            Math.min(
              preferredHeight,
              options.length * itemHeight + menuPadding * 2,
            ) && above > below;
        const maxHeight = Math.max(
          itemHeight,
          Math.min(preferredHeight, flip ? above : below),
        );
        const width = Math.min(
          Math.max(rect.width, metric("--popover-min-width")),
          window.innerWidth - inset * 2,
        );
        setPosition({
          position: "fixed",
          left: Math.max(
            inset,
            Math.min(rect.left, window.innerWidth - width - inset),
          ),
          width,
          maxHeight,
          ...(flip
            ? { bottom: window.innerHeight - rect.top + gap }
            : { top: rect.bottom + gap }),
        });
      };
      reposition();
      window.addEventListener("resize", reposition);
      window.addEventListener("scroll", reposition, true);
      return () => {
        window.removeEventListener("resize", reposition);
        window.removeEventListener("scroll", reposition, true);
      };
    }, [open, options.length]);

    useEffect(() => {
      if (!open) return;
      const outside = (event: PointerEvent) => {
        if (
          !triggerRef.current?.contains(event.target as Node) &&
          !listRef.current?.contains(event.target as Node)
        )
          setOpen(false);
      };
      document.addEventListener("pointerdown", outside);
      return () => document.removeEventListener("pointerdown", outside);
    }, [open]);
    useEffect(() => {
      if (disabled) setOpen(false);
    }, [disabled]);
    useEffect(() => {
      if (!open || activeIndex < 0) return;
      const list = listRef.current;
      const option = list?.querySelector<HTMLElement>(
        `[data-index="${activeIndex}"]`,
      );
      if (!list || !option) return;
      // Scroll only the list. scrollIntoView can also move the document before a
      // new portal's measured position is committed, leaving its trigger offscreen.
      const top = option.offsetTop;
      const bottom = top + option.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = top;
      else if (bottom > list.scrollTop + list.clientHeight)
        list.scrollTop = bottom - list.clientHeight;
    }, [open, activeIndex]);
    useEffect(() => {
      const form = nativeRef.current?.form;
      if (!form || value !== undefined) return;
      const reset = () => {
        setUncontrolled(
          String(
            defaultValue ??
              options.find((option) => !option.disabled)?.value ??
              "",
          ),
        );
        setOpen(false);
      };
      form.addEventListener("reset", reset);
      return () => form.removeEventListener("reset", reset);
    }, [value, defaultValue, options]);

    const jump = (key: string) => {
      const now = Date.now();
      let text =
        (now - typeahead.current.at < 700 ? typeahead.current.text : "") +
        normalize(key);
      if ([...text].every((character) => character === text[0])) text = text[0];
      typeahead.current = { text, at: now };
      const start = open ? activeIndex : selectedIndex;
      for (let offset = 1; offset <= options.length; offset++) {
        const index = (Math.max(start, -1) + offset) % options.length;
        if (
          !options[index].disabled &&
          normalize(options[index].label).startsWith(text)
        ) {
          if (open) setActiveIndex(index);
          else choose(index);
          break;
        }
      }
    };
    const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event as unknown as KeyboardEvent<HTMLSelectElement>);
      if (event.defaultPrevented) return;
      if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList(event.key === "ArrowUp");
        return;
      }
      if (open) {
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          const direction =
            event.key === "ArrowUp" || event.key === "End" ? -1 : 1;
          const start =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? options.length - 1
                : activeIndex + direction;
          const index = enabledIndex(start, direction);
          if (index >= 0) setActiveIndex(index);
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          choose(activeIndex);
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          return;
        }
        if (event.key === "Tab") {
          setOpen(false);
          return;
        }
      }
      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        jump(event.key);
      }
    };

    return (
      <div className={cn("ui-select", className)} style={style}>
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          role="combobox"
          className={cn(
            variant === "pill" ? "ui-search" : "ui-field",
            "ui-select-trigger",
            size === "sm" && "ui-field-sm",
          )}
          title={title}
          tabIndex={tabIndex}
          disabled={disabled}
          aria-required={required}
          aria-invalid={invalid}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          aria-activedescendant={
            open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={keyDown}
          onFocus={(event) =>
            onFocus?.(event as unknown as React.FocusEvent<HTMLSelectElement>)
          }
          onBlur={(event) => {
            setOpen(false);
            onBlur?.(event as unknown as React.FocusEvent<HTMLSelectElement>);
          }}
        >
          <span className="ui-select-value">
            {options[selectedIndex]?.label || "Chọn một mục"}
          </span>
          <Icon name="expand_more" className="ui-select-chevron" />
        </button>
        <select
          {...nativeProps}
          ref={nativeRef}
          name={name}
          value={selectedValue}
          disabled={disabled}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
          className="ui-select-native"
          onFocus={() => triggerRef.current?.focus()}
          onInvalid={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
            onInvalid?.(event);
          }}
          onChange={(event) => {
            setUncontrolled(event.target.value);
            onChange?.(event);
          }}
        >
          {children}
        </select>
        {open &&
          portalTarget &&
          createPortal(
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabel || "Các lựa chọn"}
              aria-labelledby={labelledBy}
              className="ui-popover ui-select-menu"
              style={position}
            >
              {options.map((option, index) => (
                <Fragment key={`${option.value}-${index}`}>
                  {option.group &&
                    option.group !== options[index - 1]?.group && (
                      <div className="ui-menu-heading">{option.group}</div>
                    )}
                  <div
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={option.value === selectedValue}
                    aria-disabled={option.disabled || undefined}
                    data-index={index}
                    data-selected={option.value === selectedValue}
                    data-active={index === activeIndex}
                    className="ui-menu-item"
                    onPointerDown={(event) => event.preventDefault()}
                    onMouseEnter={() =>
                      !option.disabled && setActiveIndex(index)
                    }
                    onClick={() => choose(index)}
                  >
                    <span className="ui-select-option-label">
                      {option.label}
                    </span>
                    {option.value === selectedValue && <Icon name="check" />}
                  </div>
                </Fragment>
              ))}
            </div>,
            portalTarget,
          )}
      </div>
    );
  },
);
