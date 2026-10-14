import { Dropdown } from "react-daisyui";
import { Node } from "../types";
import { cn, handleError, readableBytes } from "@/lib/utils";
import {
  Check,
  CheckCircle2,
  EllipsisVertical,
  Info,
  Network,
  RotateCcw,
  RouteIcon,
  SearchX,
  Server,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import AssignNodeDialog from "./assign-node-dialog";
import { assignNodeDialog } from "../stores";
import {
  useApplyChanges,
  useClusterLayout,
  useRevertChanges,
  useUnassignNode,
} from "../hooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import confirm from "@/components/ui/confirm";
import { EmptyState, SkeletonRows } from "@/components/ui/states";
import {
  FilterSelect,
  SearchInput,
  Toolbar,
  ToolbarSpacer,
} from "@/components/ui/toolbar";

type NodeListProps = {
  nodes: Node[];
  isLoading?: boolean;
};

type StatusFilter = "all" | "up" | "down" | "unassigned";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All nodes" },
  { value: "up", label: "Connected" },
  { value: "down", label: "Unreachable" },
  { value: "unassigned", label: "No role" },
];

const NodesList = ({ nodes, isLoading }: NodeListProps) => {
  const { data, refetch } = useClusterLayout();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const queryClient = useQueryClient();

  const refresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["status"] });
    queryClient.invalidateQueries({ queryKey: ["health"] });
  };

  const unassignNode = useUnassignNode({
    onSuccess: () => {
      toast.success("Node staged for removal", {
        description: "Apply the layout to make the change take effect.",
      });
      refetch();
    },
    onError: handleError,
  });

  const revertChanges = useRevertChanges({
    onSuccess: () => {
      toast.success("Staged changes discarded");
      refetch();
    },
    onError: handleError,
  });

  const applyChanges = useApplyChanges({
    onSuccess: () => {
      toast.success("Layout applied");
      setTimeout(refresh, 100);
    },
    onError: handleError,
  });

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();

    return nodes
      .map((item) => {
        const role = data?.roles?.find((r) => r.id === item.id);
        const stagedChanges = data?.stagedRoleChanges?.find(
          (i) => i.id === item.id
        );
        return {
          ...item,
          role: stagedChanges || role || item.role,
          isStaged: !!stagedChanges,
          isRemoving: !!stagedChanges && "remove" in stagedChanges && stagedChanges.remove,
        };
      })
      .filter((item) => {
        if (status === "up" && !item.isUp) return false;
        if (status === "down" && item.isUp) return false;
        if (status === "unassigned" && item.role) return false;

        if (!q) return true;
        return (
          item.hostname.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.addr.toLowerCase().includes(q) ||
          item.role?.zone?.toLowerCase().includes(q) ||
          item.role?.tags?.some((tag) => tag.toLowerCase().includes(q))
        );
      });
  }, [nodes, data, search, status]);

  const onAssign = (node: Node) => {
    assignNodeDialog.open({
      nodeId: node.id,
      zone: node.role?.zone,
      capacity: node.role?.capacity,
      tags: node.role?.tags,
    });
  };

  const onUnassign = async (node: Node) => {
    const ok = await confirm({
      title: "Remove node from layout?",
      danger: true,
      confirmText: "Stage removal",
      description: (
        <>
          <strong className="font-medium text-base-content">
            {node.hostname}
          </strong>{" "}
          will be staged for removal. Its data is rebalanced onto the remaining
          nodes once you apply the layout.
        </>
      ),
    });
    if (ok) unassignNode.mutate(node.id);
  };

  const onRevert = async () => {
    if (data?.version == null) return;
    const ok = await confirm({
      title: "Discard staged changes?",
      confirmText: "Discard",
      description:
        "All staged role changes are dropped and the layout returns to the version currently in effect.",
    });
    if (ok) revertChanges.mutate(data.version + 1);
  };

  const onApply = async () => {
    if (data?.version == null) return;
    const ok = await confirm({
      title: "Apply layout changes?",
      confirmText: "Apply layout",
      description:
        "Garage recomputes the partition assignment and begins moving data between nodes. This can take a while on a large cluster.",
    });
    if (ok) applyChanges.mutate(data.version + 1);
  };

  const staged = data?.stagedRoleChanges || [];
  const hasStagedChanges = staged.length > 0;
  const busy = revertChanges.isPending || applyChanges.isPending;

  return (
    <Card
      title="Nodes"
      description={`${nodes.length} known · ${nodes.filter((n) => n.isUp).length} connected`}
      padded={false}
    >
      {/* -- Staged layout changes ------------------------------------- */}
      {hasStagedChanges ? (
        <div
          role="status"
          className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 md:px-5 py-3.5
                     border-b border-warning/25 bg-warning/[0.07]"
        >
          <Info size={16} className="text-warning shrink-0" aria-hidden />
          <p className="flex-1 text-[0.8125rem] leading-snug">
            <span className="font-medium">
              {staged.length} staged layout change
              {staged.length === 1 ? "" : "s"}
            </span>{" "}
            <span className="muted">
              — nothing moves until you apply them.
            </span>
          </p>
          <div className="flex flex-row items-center gap-2 shrink-0">
            <Button size="sm" icon={RotateCcw} onClick={onRevert} disabled={busy}>
              Discard
            </Button>
            <Button
              size="sm"
              color="primary"
              icon={Check}
              onClick={onApply}
              loading={applyChanges.isPending}
              disabled={busy}
            >
              Apply layout
            </Button>
          </div>
        </div>
      ) : null}

      {applyChanges.data?.message ? (
        <div className="relative px-4 md:px-5 py-3.5 border-b border-success/25 bg-success/[0.06]">
          <div className="flex flex-row items-start gap-3 pr-8">
            <CheckCircle2
              size={16}
              className="text-success shrink-0 mt-0.5"
              aria-hidden
            />
            <pre className="flex-1 min-w-0 overflow-x-auto text-xs font-mono leading-relaxed text-base-content/80">
              {applyChanges.data.message.join("\n")}
            </pre>
          </div>
          <Button
            icon={X}
            size="sm"
            color="ghost"
            title="Dismiss"
            className="absolute right-2 top-2.5"
            onClick={applyChanges.reset}
          />
        </div>
      ) : null}

      {/* -- Filters ---------------------------------------------------- */}
      <Toolbar className="px-4 md:px-5 py-3 border-b border-base-300">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by host, ID, zone or tag…"
          aria-label="Search nodes"
        />
        <FilterSelect
          label="Filter nodes"
          value={status}
          onChange={setStatus}
          options={STATUS_FILTERS}
        />
        <ToolbarSpacer />
        <p className="text-xs muted tnum hidden sm:block">
          {items.length} shown
        </p>
      </Toolbar>

      {/* -- Table ------------------------------------------------------ */}
      <div className="overflow-x-auto">
        <table className="table table-row-hover min-w-[56rem]">
          <thead>
            <tr>
              <th>Node</th>
              <th>Zone &amp; tags</th>
              <th className="text-right">Capacity</th>
              <th>Disk</th>
              <th>Status</th>
              <th className="w-0" />
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <SkeletonRows rows={5} cols={6} />
            ) : (
              items.map((item, idx) => {
                const isGateway = item.role?.capacity === null;
                const disk = item.dataPartition;
                const usedPct = disk
                  ? ((disk.total - disk.available) / disk.total) * 100
                  : null;

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      item.isRemoving
                        ? "bg-error/[0.06]"
                        : item.isStaged
                          ? "bg-warning/[0.06]"
                          : null
                    )}
                  >
                    <td>
                      <div className="flex flex-row items-center gap-3">
                        <span
                          aria-hidden
                          className="grid place-items-center size-8 shrink-0 rounded-btn bg-base-200 border border-base-300"
                        >
                          <Server size={14} className="text-base-content/50" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {item.hostname}
                          </p>
                          <p className="text-xs muted font-mono truncate max-w-[16rem]">
                            {item.addr} · {item.id.slice(0, 12)}…
                          </p>
                        </div>
                      </div>
                    </td>

                    <td>
                      {item.role?.zone ? (
                        <div className="flex flex-row flex-wrap items-center gap-1.5">
                          <Badge tone="primary">{item.role.zone}</Badge>
                          {item.role?.tags?.map((tag: string) => (
                            <Badge key={tag} tone="neutral">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs muted">No role assigned</span>
                      )}
                    </td>

                    <td className="text-right whitespace-nowrap tnum">
                      {!item.role ? (
                        <span className="muted">—</span>
                      ) : isGateway ? (
                        <span className="inline-flex items-center gap-1.5 muted">
                          <Network size={13} aria-hidden />
                          Gateway
                        </span>
                      ) : (
                        <span className="font-medium">
                          {readableBytes(item.role?.capacity, 1000)}
                        </span>
                      )}
                    </td>

                    <td className="min-w-[8rem]">
                      {disk && !isGateway ? (
                        <div>
                          <div className="h-1 w-full max-w-[7rem] rounded-full bg-base-content/[0.08] overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                (usedPct || 0) >= 90
                                  ? "bg-error"
                                  : (usedPct || 0) >= 75
                                    ? "bg-warning"
                                    : "bg-primary/70"
                              )}
                              style={{ width: `${Math.max(usedPct || 0, 2)}%` }}
                            />
                          </div>
                          <p className="text-xs muted tnum mt-1 whitespace-nowrap">
                            {readableBytes(disk.available)} free
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs muted">—</span>
                      )}
                    </td>

                    <td>
                      <div className="flex flex-col items-start gap-1">
                        <Badge
                          dot
                          tone={
                            item.draining
                              ? "warning"
                              : item.isUp
                                ? "success"
                                : "error"
                          }
                        >
                          {item.draining
                            ? "Draining"
                            : item.isUp
                              ? "Connected"
                              : "Unreachable"}
                        </Badge>
                        {item.isRemoving ? (
                          <Badge tone="error">Staged removal</Badge>
                        ) : item.isStaged ? (
                          <Badge tone="warning">Staged change</Badge>
                        ) : null}
                      </div>
                    </td>

                    <td className="pr-4 md:pr-5 text-right">
                      <Dropdown
                        end
                        vertical={
                          idx > 2 && idx >= items.length - 2 ? "top" : "bottom"
                        }
                      >
                        <Dropdown.Toggle button={false}>
                          <Button
                            icon={EllipsisVertical}
                            size="sm"
                            color="ghost"
                            title={`Actions for ${item.hostname}`}
                          />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="panel min-w-44">
                          <Dropdown.Item onClick={() => onAssign(item)}>
                            <RouteIcon size={15} />
                            {item.role ? "Edit role" : "Assign role"}
                          </Dropdown.Item>
                          {item.role != null && (
                            <Dropdown.Item
                              className="text-error hover:bg-error/10"
                              onClick={() => onUnassign(item)}
                            >
                              <Trash2 size={15} /> Remove from layout
                            </Dropdown.Item>
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && items.length === 0 ? (
        nodes.length === 0 ? (
          <EmptyState
            icon={Server}
            title="No nodes connected"
            description="Connect your first Garage node to start building a cluster layout."
          />
        ) : (
          <EmptyState
            icon={SearchX}
            title="No nodes match your filters"
            action={
              <Button
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatus("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        )
      ) : null}

      <AssignNodeDialog />
    </Card>
  );
};

export default NodesList;
