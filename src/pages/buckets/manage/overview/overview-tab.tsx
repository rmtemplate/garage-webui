import { Database, FileBox, KeySquare, Layers } from "lucide-react";
import { readableBytes } from "@/lib/utils";
import WebsiteAccessSection from "./overview-website-access";
import AliasesSection from "./overview-aliases";
import QuotaSection from "./overview-quota";
import { useBucketContext } from "../context";
import Card from "@/components/ui/card";
import CopyButton from "@/components/ui/copy-button";
import CapacityBar from "@/pages/home/components/capacity-bar";
import type { LucideIcon } from "lucide-react";

const OverviewTab = () => {
  const { bucket } = useBucketContext();

  const activeKeys =
    bucket.keys?.filter(
      (k) => k.permissions.read || k.permissions.write || k.permissions.owner
    ).length || 0;

  const maxSize = bucket.quotas?.maxSize;
  const maxObjects = bucket.quotas?.maxObjects;

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {/* -- Usage ------------------------------------------------------ */}
      <section
        aria-label="Bucket usage"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
      >
        <Metric
          icon={Database}
          label="Stored"
          value={readableBytes(bucket.bytes, 1000)}
        />
        <Metric
          icon={FileBox}
          label="Objects"
          value={bucket.objects.toLocaleString()}
        />
        <Metric
          icon={KeySquare}
          label="Allowed keys"
          value={String(activeKeys)}
        />
        <Metric
          icon={Layers}
          label="Unfinished uploads"
          value={String(bucket.unfinishedUploads ?? 0)}
        />
      </section>

      {maxSize || maxObjects ? (
        <Card title="Quota usage">
          <div className="flex flex-col gap-5">
            {maxSize ? (
              <CapacityBar
                label="Storage quota"
                used={bucket.bytes}
                total={maxSize}
              />
            ) : null}
            {maxObjects ? (
              <div>
                <div className="flex flex-row items-baseline justify-between gap-3 mb-2">
                  <p className="text-[0.8125rem] font-medium">Object quota</p>
                  <p className="text-xs muted tnum">
                    <span className="font-medium text-base-content/80">
                      {bucket.objects.toLocaleString()}
                    </span>{" "}
                    / {maxObjects.toLocaleString()}
                  </p>
                </div>
                <div className="h-1.5 w-full rounded-full bg-base-content/[0.08] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{
                      width: `${Math.min(100, (bucket.objects / maxObjects) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-start">
        <div className="flex flex-col gap-4 md:gap-5">
          <Card title="Aliases" description="Names this bucket answers to">
            <AliasesSection />
          </Card>

          <Card
            title="Identity"
            description="Immutable identifiers for this bucket"
          >
            <dl className="flex flex-col gap-3.5">
              <div>
                <dt className="eyebrow">Bucket ID</dt>
                <dd className="flex flex-row items-center gap-1 mt-1">
                  <code className="font-mono text-xs truncate text-base-content/80">
                    {bucket.id}
                  </code>
                  <CopyButton
                    value={bucket.id}
                    size="xs"
                    label="Copy bucket ID"
                  />
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Local aliases</dt>
                <dd className="text-[0.8125rem] mt-1">
                  {bucket.localAliases?.length
                    ? bucket.localAliases.map((a) => a.alias).join(", ")
                    : "None"}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="flex flex-col gap-4 md:gap-5">
          <Card
            title="Website access"
            description="Serve this bucket's objects over plain HTTP"
          >
            <WebsiteAccessSection />
          </Card>

          <Card title="Quotas" description="Hard limits enforced by Garage">
            <QuotaSection />
          </Card>
        </div>
      </div>
    </div>
  );
};

const Metric = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) => (
  <div className="surface p-4 md:p-[1.125rem]">
    <div className="flex flex-row items-start gap-3">
      <p className="eyebrow flex-1 truncate">{label}</p>
      <Icon size={16} aria-hidden className="shrink-0 text-base-content/35" />
    </div>
    <p className="metric mt-2.5 truncate">{value}</p>
  </div>
);

export default OverviewTab;
