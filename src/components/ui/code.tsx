import { cn } from "@/lib/utils";
import React from "react";
import CopyButton from "./copy-button";

type Props = Omit<React.ComponentPropsWithoutRef<"code">, "children"> & {
  children?: string;
  /** Hide the copy affordance (for inline, non-copyable snippets). */
  noCopy?: boolean;
};

const Code = ({ className, children, noCopy, ...props }: Props) => {
  return (
    <div className="relative group">
      <code
        className={cn(
          "block bg-base-200 border border-base-300 rounded-btn",
          "px-3 py-2.5 pr-10 font-mono text-xs leading-relaxed",
          "overflow-x-auto whitespace-pre text-base-content/85",
          className
        )}
        {...props}
      >
        {children}
      </code>
      {!noCopy ? (
        <CopyButton
          value={children || ""}
          label="Copy command"
          className="absolute right-1.5 top-1.5 bg-base-200/80"
        />
      ) : null}
    </div>
  );
};

export default Code;
