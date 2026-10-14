import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned action row pinned to the bottom. */
  footer?: ReactNode;
  size?: keyof typeof SIZES;
  children?: ReactNode;
  /** Wraps the body + footer in a <form>, so Enter submits. */
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
};

/**
 * The single modal primitive.
 *
 * Built on native <dialog>.showModal(), which gives the focus trap, Escape to
 * dismiss, inert background and backdrop for free.
 *
 * Nothing is rendered while closed. daisyUI's `.modal` keeps a closed dialog
 * at `display: grid` and merely hides it with opacity, which leaves its
 * contents in the accessibility tree and in the document's text — so a screen
 * reader would read out every closed dialog on the page.
 */
const Dialog = ({
  open,
  onClose,
  title,
  description,
  footer,
  size = "md",
  children,
  onSubmit,
  className,
}: DialogProps) => {
  const ref = useRef<HTMLDialogElement | null>(null);

  // Promote to the top layer as soon as the element exists.
  const mount = useCallback((node: HTMLDialogElement | null) => {
    ref.current = node;
    if (node && !node.open) node.showModal();
  }, []);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;

    // Fires for Escape and for the backdrop form alike — keep React in sync.
    const onDialogClose = () => onClose();
    dlg.addEventListener("close", onDialogClose);
    return () => dlg.removeEventListener("close", onDialogClose);
  }, [onClose, open]);

  if (!open) return null;

  const Body = onSubmit ? "form" : "div";

  return (
    <dialog
      ref={mount}
      className="modal items-start sm:items-center"
      aria-labelledby="dialog-title"
    >
      <div
        className={cn(
          "modal-box w-[calc(100vw-2rem)] my-6 flex flex-col animate-fade-in-up",
          SIZES[size],
          className
        )}
      >
        <header className="flex flex-row items-start gap-3 px-5 pt-4 pb-3 border-b border-base-300 shrink-0">
          <div className="flex-1 min-w-0">
            <h2
              id="dialog-title"
              className="text-[0.9375rem] font-semibold tracking-[-0.006em] truncate"
            >
              {title}
            </h2>
            {description ? (
              <p className="text-[0.8125rem] muted mt-1 leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            aria-label="Close dialog"
            className="btn btn-ghost btn-sm btn-circle -mr-1.5 -mt-0.5 shrink-0"
          >
            <X size={16} />
          </button>
        </header>

        <Body
          {...(onSubmit
            ? {
                onSubmit: (e: React.FormEvent) => {
                  e.preventDefault();
                  onSubmit(e);
                },
              }
            : {})}
          className="flex flex-col min-h-0 flex-1"
        >
          <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0">
            {children}
          </div>

          {footer ? (
            <footer className="flex flex-row items-center justify-end gap-2 px-5 py-3.5 border-t border-base-300 bg-base-200/40 shrink-0">
              {footer}
            </footer>
          ) : null}
        </Body>
      </div>

      {/* Click-outside to dismiss. Keyboard users get Escape instead. */}
      <form method="dialog" className="modal-backdrop">
        <button type="submit" tabIndex={-1} aria-hidden>
          close
        </button>
      </form>
    </dialog>
  );
};

export default Dialog;
