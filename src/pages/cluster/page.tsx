import Page from "@/context/page-context";
import { useClusterLayout, useClusterStatus, useNodeInfo } from "./hooks";
import NodesList from "./components/nodes-list";
import ConnectNodeDialog from "./components/connect-node-dialog";
import { useMemo } from "react";
import Card from "@/components/ui/card";
import CopyButton from "@/components/ui/copy-button";
import { readableBytes } from "@/lib/utils";
import { useConfig } from "@/hooks/useConfig";
import type { Node } from "./types";

const ClusterPage = () => {
  const { data, isLoading } = useClusterStatus();
  const { data: node } = useNodeInfo();
  const { data: layout } = useClusterLayout();
  const { data: config } = useConfig();

  const nodes: Node[] = useMemo(() => {
    if (!data) return [];

    if (Array.isArray(data.knownNodes)) {
      return data.knownNodes.map((node) => ({
        ...node,
        role: layout?.roles.find((role) => role.id === node.id),
      }));
    }

    return data.nodes || [];
  }, [data, layout]);

  const summary = useMemo(() => {
    const roles = layout?.roles || [];
    return {
      zones: [...new Set(roles.map((r) => r.zone))].filter(Boolean),
      capacity: roles.reduce((acc, r) => acc + (r.capacity || 0), 0),
      gateways: roles.filter((r) => r.capacity === null).length,
    };
  }, [layout]);

  return (
    <div className="page-container flex flex-col gap-4 md:gap-5">
      <Page
        title="Cluster"
        description="Nodes, zones and layout for this Garage deployment"
        actions={<ConnectNodeDialog />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 items-start">
        <Card title="Deployment" className="lg:col-span-2">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
            <Detail title="Garage version" value={node?.garageVersion} />
            <Detail title="Database engine" value={node?.dbEngine} />
            <Detail
              title="Layout version"
              value={layout?.version ?? data?.layoutVersion}
            />
            <Detail
              title="Replication factor"
              value={config?.replication_factor}
            />
            <Detail title="Rust version" value={node?.rustVersion} />
            <Detail
              title="S3 region"
              value={config?.s3_api?.s3_region}
            />
            <Detail
              title="This node"
              value={node?.nodeId}
              mono
              copy
              className="sm:col-span-2"
            />
          </dl>
        </Card>

        <Card title="Topology">
          <dl className="grid grid-cols-2 gap-4">
            <Stat label="Known nodes" value={nodes.length} />
            <Stat
              label="Connected"
              value={nodes.filter((n) => n.isUp).length}
            />
            <Stat label="Zones" value={summary.zones.length} />
            <Stat label="Gateways" value={summary.gateways} />
          </dl>

          <div className="mt-4 pt-4 border-t border-base-300">
            <p className="eyebrow">Raw capacity assigned</p>
            <p className="text-lg font-semibold tnum tracking-[-0.02em] mt-1">
              {summary.capacity > 0
                ? readableBytes(summary.capacity, 1000)
                : "—"}
            </p>

            {summary.zones.length ? (
              <div className="flex flex-row flex-wrap gap-1.5 mt-3.5">
                {summary.zones.map((zone) => (
                  <span
                    key={zone}
                    className="inline-flex items-center h-6 px-2 rounded-badge
                               bg-base-200 border border-base-300 text-xs font-medium"
                  >
                    {zone}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <NodesList nodes={nodes} isLoading={isLoading} />
    </div>
  );
};

type DetailProps = {
  title: string;
  value?: string | number | null;
  mono?: boolean;
  copy?: boolean;
  className?: string;
};

const Detail = ({ title, value, mono, copy, className }: DetailProps) => (
  <div className={className}>
    <dt className="eyebrow">{title}</dt>
    <dd className="flex flex-row items-center gap-1 mt-1 min-w-0">
      <span
        className={`text-[0.8125rem] truncate ${mono ? "font-mono text-xs" : ""}`}
        title={value != null ? String(value) : undefined}
      >
        {value ?? "—"}
      </span>
      {copy && value ? (
        <CopyButton value={String(value)} size="xs" label={`Copy ${title}`} />
      ) : null}
    </dd>
  </div>
);

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div>
    <dt className="eyebrow">{label}</dt>
    <dd className="text-lg font-semibold tnum tracking-[-0.02em] mt-1">
      {value}
    </dd>
  </div>
);

export default ClusterPage;
