import Page from "@/context/page-context";
import { useBuckets } from "./hooks";
import CreateBucketDialog from "./components/create-bucket-dialog";
import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  EmptyState,
  ErrorState,
  SkeletonRows,
} from "@/components/ui/states";
import {
  FilterSelect,
  SearchInput,
  Toolbar,
  ToolbarSpacer,
} from "@/components/ui/toolbar";
import SortHeader, { useSort } from "@/components/ui/sort-header";
import Pagination from "@/components/ui/pagination";
import Button from "@/components/ui/button";
import { readableBytes } from "@/lib/utils";
import { Archive, FolderSearch, Globe, SearchX, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";

type SortKey = "name" | "objects" | "bytes" | "keys";
type Filter = "all" | "website" | "quota" | "empty";

const PAGE_SIZE = 12;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All buckets" },
  { value: "website", label: "Website enabled" },
  { value: "quota", label: "With quotas" },
  { value: "empty", label: "Empty" },
];

const BucketsPage = () => {
  const { data, isLoading, error, refetch } = useBuckets();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const { sort, toggle, sortBy } = useSort<SortKey>({
    key: "name",
    dir: "asc",
  });

  const items = useMemo(() => {
    let buckets = (data || []).map((bucket) => ({
      ...bucket,
      aliases: [
        ...(bucket.globalAliases || []),
        ...(bucket.localAliases?.map((l) => l.alias) || []),
      ],
      activeKeys: bucket.keys?.filter(
        (k) => k.permissions.read || k.permissions.write || k.permissions.owner
      ).length,
      hasQuota:
        bucket.quotas?.maxSize != null || bucket.quotas?.maxObjects != null,
    }));

    if (filter === "website") buckets = buckets.filter((b) => b.websiteAccess);
    if (filter === "quota") buckets = buckets.filter((b) => b.hasQuota);
    if (filter === "empty") buckets = buckets.filter((b) => b.objects === 0);

    const q = search.trim().toLowerCase();
    if (q) {
      buckets = buckets.filter(
        (bucket) =>
          bucket.id.toLowerCase().includes(q) ||
          bucket.aliases.some((alias) => alias.toLowerCase().includes(q))
      );
    }

    return sortBy(buckets, {
      name: (b) => b.aliases[0] || b.id,
      objects: (b) => b.objects,
      bytes: (b) => b.bytes,
      keys: (b) => b.activeKeys || 0,
    });
  }, [data, search, filter, sortBy]);

  // A narrowed result set can leave the current page out of range.
  useEffect(() => setPage(1), [search, filter]);

  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isFiltered = search.trim().length > 0 || filter !== "all";

  return (
    <div className="page-container flex flex-col gap-4 md:gap-5">
      <Page
        title="Buckets"
        description="S3 buckets stored on this cluster"
        actions={<CreateBucketDialog />}
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search buckets…"
          aria-label="Search buckets"
        />
        <FilterSelect
          label="Filter buckets"
          value={filter}
          onChange={setFilter}
          options={FILTERS}
        />
        <ToolbarSpacer />
        {!isLoading && !error ? (
          <p className="text-xs muted tnum hidden sm:block">
            {items.length} of {data?.length ?? 0} buckets
          </p>
        ) : null}
      </Toolbar>

      <Card padded={false}>
        {error ? (
          <ErrorState
            title="Could not load buckets"
            error={error}
            onRetry={() => refetch()}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-row-hover min-w-[48rem]">
                <thead>
                  <tr>
                    <SortHeader
                      label="Bucket"
                      sortKey="name"
                      sort={sort}
                      onSort={toggle}
                    />
                    <th>Status</th>
                    <SortHeader
                      label="Objects"
                      sortKey="objects"
                      sort={sort}
                      onSort={toggle}
                      align="right"
                      className="text-right"
                    />
                    <SortHeader
                      label="Size"
                      sortKey="bytes"
                      sort={sort}
                      onSort={toggle}
                      align="right"
                      className="text-right"
                    />
                    <SortHeader
                      label="Keys"
                      sortKey="keys"
                      sort={sort}
                      onSort={toggle}
                      align="right"
                      className="text-right"
                    />
                    <th className="w-0" />
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <SkeletonRows rows={6} cols={6} />
                  ) : (
                    pageItems.map((bucket) => (
                      <tr key={bucket.id}>
                        <td>
                          <Link
                            to={`/buckets/${bucket.id}`}
                            className="flex flex-row items-center gap-3 group min-w-0"
                          >
                            <span
                              aria-hidden
                              className="grid place-items-center size-8 shrink-0 rounded-btn
                                         bg-base-200 border border-base-300
                                         group-hover:border-primary/30 group-hover:bg-primary/[0.07]
                                         transition-colors"
                            >
                              <Archive
                                size={15}
                                className="text-base-content/50 group-hover:text-primary transition-colors"
                              />
                            </span>
                            <span className="min-w-0">
                              <span className="block font-medium truncate group-hover:text-primary transition-colors">
                                {bucket.aliases[0] || bucket.id}
                              </span>
                              <span className="block text-xs muted font-mono truncate max-w-[18rem]">
                                {bucket.aliases.length > 1
                                  ? `+${bucket.aliases.length - 1} more alias${
                                      bucket.aliases.length > 2 ? "es" : ""
                                    } · `
                                  : null}
                                {bucket.id}
                              </span>
                            </span>
                          </Link>
                        </td>

                        <td>
                          <div className="flex flex-row flex-wrap items-center gap-1.5">
                            {bucket.websiteAccess ? (
                              <Badge tone="info">
                                <Globe size={10} aria-hidden />
                                Website
                              </Badge>
                            ) : null}
                            {bucket.hasQuota ? (
                              <Badge tone="warning">Quota</Badge>
                            ) : null}
                            {!bucket.activeKeys ? (
                              <Badge tone="neutral">No keys</Badge>
                            ) : null}
                            {!bucket.websiteAccess &&
                            !bucket.hasQuota &&
                            bucket.activeKeys ? (
                              <span className="text-xs muted">—</span>
                            ) : null}
                          </div>
                        </td>

                        <td className="text-right tnum whitespace-nowrap">
                          {bucket.objects.toLocaleString()}
                        </td>
                        <td className="text-right tnum whitespace-nowrap font-medium">
                          {readableBytes(bucket.bytes, 1000)}
                        </td>
                        <td className="text-right tnum whitespace-nowrap">
                          {bucket.activeKeys || 0}
                        </td>

                        <td className="pr-4 md:pr-5">
                          <div className="flex flex-row items-center justify-end gap-1">
                            <Button
                              size="sm"
                              color="ghost"
                              icon={Settings2}
                              title={`Manage ${bucket.aliases[0]}`}
                              href={`/buckets/${bucket.id}`}
                            />
                            <Button
                              size="sm"
                              color="ghost"
                              icon={FolderSearch}
                              title={`Browse ${bucket.aliases[0]}`}
                              href={`/buckets/${bucket.id}?tab=browse`}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isLoading && items.length === 0 ? (
              isFiltered ? (
                <EmptyState
                  icon={SearchX}
                  title="No buckets match your filters"
                  description="Try a different search term, or clear the filter to see every bucket."
                  action={
                    <Button
                      size="sm"
                      onClick={() => {
                        setSearch("");
                        setFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={Archive}
                  title="No buckets yet"
                  description="Buckets hold your objects. Create one to start uploading."
                  action={<CreateBucketDialog />}
                />
              )
            ) : null}

            {items.length > 0 ? (
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={items.length}
                onPageChange={setPage}
                unit="bucket"
              />
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
};

export default BucketsPage;
