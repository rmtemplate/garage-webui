import Page from "@/context/page-context";
import { useNodesHealth } from "./hooks";
import StatsCard from "./components/stats-card";
import CapacityBar from "./components/capacity-bar";
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  Database,
  FileBox,
  KeySquare,
  Plug,
  ShieldAlert,
  TriangleAlert,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { cn, readableBytes, ucfirst } from "@/lib/utils";
import { useBuckets } from "../buckets/hooks";
import { useKeys } from "../keys/hooks";
import { useClusterLayout, useClusterStatus, useNodeInfo } from "../cluster/hooks";
import { useConfig } from "@/hooks/useConfig";
import { useMemo } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Badge, StatusDot, type Tone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import DemoBanner from "@/components/containers/demo-banner";
import { Link } from "react-router-dom";

const STATUS_TONE: Record<string, Tone> = {
  healthy: "success",
  degraded: "warning",
  unavailable: "error",
};

const HomePage = () => {
  const { data: health, isLoading: healthLoading } = useNodesHealth();
  const { data: buckets, isLoading: bucketsLoading } = useBuckets();
  const { data: keys } = useKeys();
  const { data: cluster } = useClusterStatus();
  const { data: layout } = useClusterLayout();
  const { data: nodeInfo } = useNodeInfo();
  const { data: config } = useConfig();

  const usage = useMemo(() => {
    const used = buckets?.reduce((acc, b) => acc + b.bytes, 0) || 0;
    const objects = buckets?.reduce((acc, b) => acc + b.objects, 0) || 0;
    // Raw capacity assigned in the layout; gateways (null capacity) hold none.
    const raw =
      layout?.roles.reduce((acc, r) => acc + (r.capacity || 0), 0) || 0;
    const replication = config?.replication_factor || 1;

    return {
      used,
      objects,
      raw,
      // What the cluster can actually store once each object is replicated.
      effective: raw / replication,
      replication,
    };
  }, [buckets, layout, config]);

  const nodes = useMemo(() => {
    const list = cluster?.nodes || cluster?.knownNodes || [];
    return {
      total: list.length,
      down: list.filter((n) => !n.isUp),
      unassigned: list.filter(
        (n) => !layout?.roles.some((r) => r.id === n.id)
      ),
    };
  }, [cluster, layout]);

  const status = health?.status;
  const tone = STATUS_TONE[status || ""] || "neutral";
  const staged = layout?.stagedRoleChanges?.length || 0;

  const topBuckets = useMemo(
    () => [...(buckets || [])].sort((a, b) => b.bytes - a.bytes).slice(0, 5),
    [buckets]
  );

  return (
    <div className="page-container flex flex-col gap-[var(--section-gap)]">
      <Page
        title="Dashboard"
        description="Cluster health and storage at a glance"
      />

      <DemoBanner />

      {/* -- Headline metrics ------------------------------------------- */}
      <section
        aria-label="Key metrics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
      >
        <StatsCard
          title="Cluster status"
          icon={status === "healthy" ? CheckCircle2 : TriangleAlert}
          loading={healthLoading}
          iconClassName={cn(
            status === "healthy" && "text-success",
            status === "degraded" && "text-warning",
            status && status !== "healthy" && status !== "degraded" && "text-error"
          )}
          hint={
            health
              ? `${health.connectedNodes} of ${health.knownNodes} nodes connected`
              : undefined
          }
        >
          <p className="flex items-center gap-2">
            <StatusDot tone={tone} pulse={tone === "success"} />
            <span className="text-xl font-semibold tracking-[-0.02em]">
              {ucfirst(status) || "Unknown"}
            </span>
          </p>
        </StatsCard>

        <StatsCard
          title="Buckets"
          icon={Archive}
          loading={bucketsLoading}
          value={buckets?.length}
          hint={`${keys?.length ?? 0} access key${keys?.length === 1 ? "" : "s"}`}
        />

        <StatsCard
          title="Objects"
          icon={FileBox}
          loading={bucketsLoading}
          value={usage.objects.toLocaleString()}
          hint="Across all buckets"
        />

        <StatsCard
          title="Stored"
          icon={Database}
          loading={bucketsLoading}
          value={readableBytes(usage.used, 1000)}
          hint={
            usage.effective > 0
              ? `${((usage.used / usage.effective) * 100).toFixed(1)}% of usable capacity`
              : "No capacity assigned"
          }
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 items-start">
        {/* -- Capacity ------------------------------------------------- */}
        <Card
          title="Storage capacity"
          description={`Replication factor ${usage.replication}`}
          className="lg:col-span-2"
        >
          <CapacityBar
            label="Usable capacity"
            used={usage.used}
            total={usage.effective}
            hint={
              usage.raw > 0
                ? `${readableBytes(usage.raw, 1000)} raw across ${
                    layout?.roles.filter((r) => r.capacity).length || 0
                  } storage nodes, divided by a replication factor of ${usage.replication}.`
                : "No storage nodes have capacity assigned in the current layout."
            }
          />

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4 mt-6 pt-5 border-t border-base-300">
            <Metric label="Partitions" value={health?.partitions} />
            <Metric label="With quorum" value={health?.partitionsQuorum} />
            <Metric label="Fully replicated" value={health?.partitionsAllOk} />
            <Metric label="Layout version" value={layout?.version} />
          </dl>
        </Card>

        {/* -- Attention ------------------------------------------------ */}
        <Card title="System condition">
          <ul className="flex flex-col gap-3">
            <Condition
              ok={status === "healthy"}
              okText="All storage nodes are up"
              warnText={`${
                (health?.storageNodes ?? 0) - (health?.storageNodesUp ?? 0)
              } storage node(s) are down`}
            />
            <Condition
              ok={nodes.down.length === 0}
              okText="Every known node is reachable"
              warnText={`${nodes.down.length} node(s) unreachable: ${nodes.down
                .map((n) => n.hostname)
                .join(", ")}`}
            />
            <Condition
              ok={staged === 0}
              okText="No pending layout changes"
              warnText={`${staged} staged layout change(s) waiting to be applied`}
              action={
                staged > 0 ? (
                  <Link
                    to="/cluster"
                    className="text-primary hover:underline font-medium"
                  >
                    Review
                  </Link>
                ) : null
              }
            />
            <Condition
              ok={nodes.unassigned.length === 0}
              okText="All nodes have a role"
              warnText={`${nodes.unassigned.length} connected node(s) have no role assigned`}
              action={
                nodes.unassigned.length > 0 ? (
                  <Link
                    to="/cluster"
                    className="text-primary hover:underline font-medium"
                  >
                    Assign
                  </Link>
                ) : null
              }
            />
          </ul>

          <div className="mt-5 pt-4 border-t border-base-300 flex flex-wrap gap-x-4 gap-y-1.5 text-xs muted">
            <span>Garage {nodeInfo?.garageVersion || "—"}</span>
            <span>·</span>
            <span>{nodeInfo?.dbEngine || "—"}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 items-start">
        {/* -- Largest buckets ------------------------------------------ */}
        <Card
          title="Largest buckets"
          className="lg:col-span-2"
          padded={false}
          actions={
            <Button size="sm" href="/buckets" iconRight={ArrowRight}>
              All buckets
            </Button>
          }
        >
          {topBuckets.length === 0 ? (
            <EmptyState
              compact
              icon={Archive}
              title="No buckets yet"
              description="Create a bucket to start storing objects."
            />
          ) : (
            <ul className="divide-y divide-base-300">
              {topBuckets.map((bucket) => {
                const name = bucket.globalAliases[0] || bucket.id;
                const share =
                  usage.used > 0 ? (bucket.bytes / usage.used) * 100 : 0;

                return (
                  <li key={bucket.id}>
                    <Link
                      to={`/buckets/${bucket.id}`}
                      className="flex flex-row items-center gap-3 px-4 md:px-5 py-3
                                 hover:bg-base-content/[0.03] transition-colors"
                    >
                      <span
                        aria-hidden
                        className="grid place-items-center size-8 shrink-0 rounded-btn bg-base-200 border border-base-300"
                      >
                        <Archive size={15} className="text-base-content/50" />
                      </span>

                      <span className="flex-1 min-w-0">
                        <span className="block text-[0.8125rem] font-medium truncate">
                          {name}
                        </span>
                        <span className="block text-xs muted tnum">
                          {bucket.objects.toLocaleString()} objects
                        </span>
                      </span>

                      <span className="hidden sm:block w-24 shrink-0">
                        <span className="block h-1 rounded-full bg-base-content/[0.08] overflow-hidden">
                          <span
                            className="block h-full rounded-full bg-primary/70"
                            style={{ width: `${Math.max(share, 2)}%` }}
                          />
                        </span>
                      </span>

                      <span className="text-[0.8125rem] font-medium tnum shrink-0 w-20 text-right">
                        {readableBytes(bucket.bytes, 1000)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* -- Quick actions -------------------------------------------- */}
        <Card title="Quick actions" padded={false}>
          <ul className="divide-y divide-base-300">
            <QuickAction
              to="/buckets"
              icon={Archive}
              title="Manage buckets"
              description="Create, inspect and configure buckets"
            />
            <QuickAction
              to="/buckets"
              icon={Upload}
              title="Browse objects"
              description="Upload, preview and share files"
            />
            <QuickAction
              to="/keys"
              icon={KeySquare}
              title="Access keys"
              description="Issue and revoke S3 credentials"
            />
            <QuickAction
              to="/cluster"
              icon={Plug}
              title="Cluster layout"
              description="Connect nodes and assign roles"
              badge={staged > 0 ? `${staged} staged` : undefined}
            />
          </ul>
        </Card>
      </div>
    </div>
  );
};

const Metric = ({
  label,
  value,
}: {
  label: string;
  value?: number | null;
}) => (
  <div>
    <dt className="eyebrow">{label}</dt>
    <dd className="text-lg font-semibold tnum tracking-[-0.02em] mt-1">
      {value ?? "—"}
    </dd>
  </div>
);

const Condition = ({
  ok,
  okText,
  warnText,
  action,
}: {
  ok: boolean;
  okText: string;
  warnText: string;
  action?: React.ReactNode;
}) => (
  <li className="flex flex-row items-start gap-2.5 text-[0.8125rem]">
    {ok ? (
      <CheckCircle2
        size={15}
        className="text-success shrink-0 mt-0.5"
        aria-hidden
      />
    ) : (
      <ShieldAlert
        size={15}
        className="text-warning shrink-0 mt-0.5"
        aria-hidden
      />
    )}
    <span className={cn("flex-1 leading-snug", ok ? "muted" : "text-base-content")}>
      {ok ? okText : warnText}
    </span>
    {action ? <span className="shrink-0 text-xs">{action}</span> : null}
  </li>
);

const QuickAction = ({
  to,
  icon: Icon,
  title,
  description,
  badge,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}) => (
  <li>
    <Link
      to={to}
      className="group flex flex-row items-center gap-3 px-4 md:px-5 py-3
                 hover:bg-base-content/[0.03] transition-colors"
    >
      <span
        aria-hidden
        className="grid place-items-center size-8 shrink-0 rounded-btn
                   bg-primary/[0.08] text-primary"
      >
        <Icon size={15} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-[0.8125rem] font-medium truncate">{title}</span>
          {badge ? (
            <Badge tone="warning" className="shrink-0">
              {badge}
            </Badge>
          ) : null}
        </span>
        <span className="block text-xs muted truncate">{description}</span>
      </span>
      <ArrowRight
        size={14}
        aria-hidden
        className="shrink-0 text-base-content/25 group-hover:text-base-content/60
                   group-hover:translate-x-0.5 transition-all duration-150"
      />
    </Link>
  </li>
);

export default HomePage;
