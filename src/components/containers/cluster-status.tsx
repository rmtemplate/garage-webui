import { StatusDot, type Tone } from "@/components/ui/badge";
import { IS_DEMO } from "@/lib/consts";
import { cn } from "@/lib/utils";
import { useNodesHealth } from "@/pages/home/hooks";

const TONES: Record<string, Tone> = {
  healthy: "success",
  degraded: "warning",
  unavailable: "error",
};

const LABELS: Record<string, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  unavailable: "Unavailable",
};

/**
 * Live cluster pill for the sidebar.
 *
 * In Demo Mode it says so in as many words — the numbers are sample data, and
 * must never be mistaken for the state of a real Garage deployment.
 */
const ClusterStatus = ({ className }: { className?: string }) => {
  const { data, isLoading, isError } = useNodesHealth();

  const tone: Tone = isLoading
    ? "neutral"
    : isError
      ? "error"
      : TONES[data?.status || ""] || "neutral";

  const label = isLoading
    ? "Checking…"
    : isError
      ? "Unreachable"
      : LABELS[data?.status || ""] || "Unknown";

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-2.5 px-3 py-2 rounded-btn",
        "bg-base-200 border border-base-300",
        className
      )}
    >
      <StatusDot tone={tone} pulse={tone === "success"} />
      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] font-medium leading-tight truncate">
          {label}
        </p>
        <p className="text-[0.6875rem] muted leading-tight mt-0.5 truncate">
          {IS_DEMO ? (
            "Sample data — not a live cluster"
          ) : data ? (
            <>
              {data.connectedNodes}/{data.knownNodes} nodes connected
            </>
          ) : (
            "Cluster health"
          )}
        </p>
      </div>
    </div>
  );
};

export default ClusterStatus;
