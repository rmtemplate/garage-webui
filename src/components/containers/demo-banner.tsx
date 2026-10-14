import Button from "@/components/ui/button";
import { IS_DEMO } from "@/lib/consts";
import { FlaskConical, X } from "lucide-react";
import { useState } from "react";

/**
 * Dashboard notice for Local Demo Mode.
 *
 * Demo Mode is already obvious in the sidebar; this spells out exactly what
 * the numbers on the page are, because a dashboard full of plausible figures
 * is the one place sample data could be mistaken for production.
 */
const DemoBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (!IS_DEMO || dismissed) return null;

  return (
    <aside
      className="relative flex flex-row items-start gap-3 p-4 pr-11 rounded-box
                 border border-warning/30 bg-warning/[0.07] animate-fade-in"
    >
      <span
        aria-hidden
        className="grid place-items-center size-8 shrink-0 rounded-full bg-warning/15 text-warning"
      >
        <FlaskConical size={16} />
      </span>

      <div className="min-w-0">
        <p className="text-[0.8125rem] font-semibold">
          Local Demo Mode — everything on this page is sample data
        </p>
        <p className="text-[0.8125rem] muted mt-1 leading-relaxed">
          No Garage cluster, S3 API, or Go backend is connected. Buckets,
          objects, keys and nodes are served from an in-memory mock, and your
          changes persist only until you reload. Nothing here reflects a real
          deployment.
        </p>
      </div>

      <Button
        icon={X}
        size="sm"
        color="ghost"
        title="Dismiss"
        className="absolute right-2 top-2.5"
        onClick={() => setDismissed(true)}
      />
    </aside>
  );
};

export default DemoBanner;
