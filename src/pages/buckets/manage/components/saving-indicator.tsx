import { Spinner } from "@/components/ui/states";
import { Check, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  mutation: {
    isPending: boolean;
    isError: boolean;
    isSuccess: boolean;
  };
};

/**
 * Autosaved sections have no Save button, so they need to say what happened.
 * Shows "Saving…" while in flight, then a brief confirmation.
 */
const SavingIndicator = ({ mutation }: Props) => {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!mutation.isSuccess) return;
    setShowSaved(true);
    const t = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(t);
  }, [mutation.isSuccess, mutation.isPending]);

  if (mutation.isError) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-error shrink-0">
        <TriangleAlert size={13} aria-hidden /> Not saved
      </span>
    );
  }

  if (mutation.isPending) {
    return (
      <span
        role="status"
        className="flex items-center gap-1.5 text-xs muted shrink-0"
      >
        <Spinner size={13} /> Saving…
      </span>
    );
  }

  if (showSaved) {
    return (
      <span
        role="status"
        className="flex items-center gap-1.5 text-xs text-success shrink-0 animate-fade-in"
      >
        <Check size={13} aria-hidden /> Saved
      </span>
    );
  }

  return null;
};

export default SavingIndicator;
