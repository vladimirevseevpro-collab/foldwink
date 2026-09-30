import { useEffect, useRef, type MouseEvent, type ReactNode, type RefObject } from "react";

interface DialogShellProps {
  children: ReactNode;
  onClose: () => void;
  titleId: string;
  descriptionId?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  panelClassName?: string;
  testId?: string;
  closeOnBackdrop?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared accessible modal boundary. Content owns its visual treatment while
 * this shell owns focus containment, Escape, backdrop semantics and scroll lock.
 */
export function DialogShell({
  children,
  onClose,
  titleId,
  descriptionId,
  initialFocusRef,
  className = "",
  panelClassName = "",
  testId,
  closeOnBackdrop = true,
}: DialogShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const preferred = initialFocusRef?.current;
    const fallback = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (preferred ?? fallback ?? panelRef.current)?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const controls = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!controls?.length) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [initialFocusRef]);

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>): void => {
    if (closeOnBackdrop && event.target === event.currentTarget) closeRef.current();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-4 ${className}`}
      onMouseDown={handleBackdropMouseDown}
      data-testid={testId}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={`w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain rounded-xl border border-line bg-surface shadow-2xl ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
