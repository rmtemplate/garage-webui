import { cn, copyToClipboard } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  value: string;
  /** Appears in the tooltip and the accessible name. */
  label?: string;
  size?: "xs" | "sm";
  className?: string;
};

/**
 * Copy control with inline confirmation — the checkmark is the feedback the
 * eye catches; the toast from `copyToClipboard` covers the rest.
 */
const CopyButton = ({ value, label = "Copy", size = "sm", className }: Props) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const px = size === "xs" ? 12 : 14;

  return (
    <button
      type="button"
      title={copied ? "Copied" : label}
      aria-label={label}
      onClick={async () => {
        await copyToClipboard(value);
        setCopied(true);
      }}
      className={cn(
        "grid place-items-center shrink-0 rounded-md transition-colors duration-150",
        size === "xs" ? "size-6" : "size-7",
        copied
          ? "text-success"
          : "text-base-content/45 hover:text-base-content hover:bg-base-content/[0.07]",
        className
      )}
    >
      {copied ? <Check size={px} /> : <Copy size={px} />}
    </button>
  );
};

export default CopyButton;
