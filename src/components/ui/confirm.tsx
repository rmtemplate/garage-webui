import { AlertTriangle, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { createStore, useStore } from "zustand";
import Button from "./button";
import Dialog from "./dialog";
import { cn } from "@/lib/utils";

type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** Red confirm button + warning icon. */
  danger?: boolean;
  /** Require typing this exact string before confirming. */
  confirmWord?: string;
};

type State = ConfirmOptions & {
  open: boolean;
  resolve?: (ok: boolean) => void;
};

const store = createStore<State>(() => ({ open: false, title: "" }));

/**
 * Promise-based replacement for `window.confirm`, so destructive actions get a
 * designed dialog without every call site growing modal state:
 *
 *   if (!(await confirm({ title: "Delete bucket?", danger: true }))) return;
 */
export const confirm = (options: ConfirmOptions) =>
  new Promise<boolean>((resolve) => {
    store.setState({ ...options, open: true, resolve });
  });

const settle = (ok: boolean) => {
  const { resolve } = store.getState();
  store.setState({ open: false, resolve: undefined });
  resolve?.(ok);
};

/** Mounted once, at the app root. */
export const ConfirmDialogHost = () => {
  const state = useStore(store);
  const [typed, setTyped] = useState("");

  const {
    open,
    title,
    description,
    confirmText,
    cancelText,
    danger,
    confirmWord,
  } = state;

  const locked = !!confirmWord && typed !== confirmWord;

  const close = (ok: boolean) => {
    setTyped("");
    settle(ok);
  };

  return (
    <Dialog
      open={open}
      onClose={() => close(false)}
      size="sm"
      title={
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden
            className={cn(
              "grid place-items-center size-7 rounded-full shrink-0",
              danger ? "bg-error/10 text-error" : "bg-warning/10 text-warning"
            )}
          >
            {danger ? <Trash2 size={15} /> : <AlertTriangle size={15} />}
          </span>
          {title}
        </span>
      }
      onSubmit={() => !locked && close(true)}
      footer={
        <>
          <Button type="button" size="sm" onClick={() => close(false)}>
            {cancelText || "Cancel"}
          </Button>
          <Button
            type="submit"
            size="sm"
            color={danger ? "error" : "primary"}
            disabled={locked}
          >
            {confirmText || "Confirm"}
          </Button>
        </>
      }
    >
      {description ? (
        <div className="text-[0.8125rem] leading-relaxed text-base-content/75">
          {description}
        </div>
      ) : null}

      {confirmWord ? (
        <label className="form-control mt-4">
          <span className="label label-text">
            Type <code className="font-mono font-semibold">{confirmWord}</code>{" "}
            to confirm
          </span>
          <input
            className="input input-bordered w-full"
            value={typed}
            autoFocus
            autoComplete="off"
            onChange={(e) => setTyped(e.target.value)}
          />
        </label>
      ) : null}
    </Dialog>
  );
};

export default confirm;
