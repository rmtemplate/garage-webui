import { useMemo, useState } from "react";
import { useStore } from "zustand";
import {
  FolderPlus,
  Grid2x2,
  LayoutList,
  LockKeyhole,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import {
  FilterSelect,
  SearchInput,
  Segmented,
  Toolbar,
  ToolbarSpacer,
} from "@/components/ui/toolbar";
import appStore from "@/stores/app-store";
import { EmptyState } from "@/components/ui/states";
import { useBucketContext } from "../context";

import { useBrowseNavigation, useBrowseObjects } from "./hooks";
import ObjectBreadcrumb from "./object-breadcrumb";
import ObjectList from "./object-list";
import ObjectGrid from "./object-grid";
import ObjectDetails, { objectDetails } from "./object-details";
import ShareDialog from "./share-dialog";
import UploadDialog, { uploadDialog } from "./upload-dialog";
import CreateFolderDialog, { createFolderDialog } from "./create-folder-dialog";
import {
  FILE_KIND_LABELS,
  FILE_KINDS,
  getFileKind,
  type FileKind,
} from "./file-types";
import type { Object as S3Object } from "./types";

type SortKey = "name" | "size" | "modified";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Sort: name" },
  { value: "size", label: "Sort: largest" },
  { value: "modified", label: "Sort: newest" },
];

const BrowseTab = () => {
  const { bucket, bucketName } = useBucketContext();
  const nav = useBrowseNavigation();
  const queryClient = useQueryClient();
  const view = useStore(appStore, (s) => s.browseView);

  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<FileKind | "all">("all");
  const [sort, setSort] = useState<SortKey>("name");

  const { data, error, isLoading, isFetching } = useBrowseObjects(bucketName, {
    prefix: nav.prefix,
    limit: 1000,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["browse", bucketName] });

  const { folders, objects, isFiltered } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const nameOf = (p: string) =>
      p.substring(0, p.lastIndexOf("/")).split("/").pop() || p;

    let folders = (data?.prefixes || []).map((p) => ({
      prefix: p,
      name: nameOf(p),
    }));
    let objects = [...(data?.objects || [])];

    if (q) {
      folders = folders.filter((f) => f.name.toLowerCase().includes(q));
      objects = objects.filter((o) => o.objectKey.toLowerCase().includes(q));
    }

    // A type filter is about files; folders have no type, so hide them.
    if (kind !== "all") {
      folders = [];
      objects = objects.filter((o) => getFileKind(o.objectKey) === kind);
    }

    folders.sort((a, b) => a.name.localeCompare(b.name));
    objects.sort((a, b) => {
      if (sort === "size") return b.size - a.size;
      if (sort === "modified")
        return +new Date(b.lastModified) - +new Date(a.lastModified);
      return a.objectKey.localeCompare(b.objectKey, undefined, {
        numeric: true,
      });
    });

    return { folders, objects, isFiltered: !!q || kind !== "all" };
  }, [data, search, kind, sort]);

  const canWrite = bucket.keys.some(
    (k) => k.permissions.read && k.permissions.write
  );

  if (!canWrite) {
    return (
      <Card padded={false}>
        <EmptyState
          icon={LockKeyhole}
          title="No key can browse this bucket"
          description="The object browser signs its requests with one of the bucket's access keys. Allow a key with both read and write permission to use it."
          action={
            <Button
              size="sm"
              color="primary"
              href={`/buckets/${bucket.id}?tab=permissions`}
            >
              Manage permissions
            </Button>
          }
        />
      </Card>
    );
  }

  const isEmpty = folders.length === 0 && objects.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <Card padded={false}>
        {/* -- Path bar ------------------------------------------------- */}
        <ObjectBreadcrumb nav={nav} bucketName={bucketName} />

        {/* -- Filters & actions ---------------------------------------- */}
        <Toolbar className="px-3 md:px-4 py-2.5 border-b border-base-300">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Filter this folder…"
            aria-label="Filter objects in this folder"
            containerClassName="sm:w-64"
          />

          <FilterSelect
            label="Filter by file type"
            value={kind}
            onChange={setKind}
            options={[
              { value: "all" as const, label: "All types" },
              ...FILE_KINDS.map((k) => ({
                value: k,
                label: FILE_KIND_LABELS[k],
              })),
            ]}
          />

          <FilterSelect
            label="Sort objects"
            value={sort}
            onChange={setSort}
            options={SORTS}
          />

          <ToolbarSpacer />

          <div className="flex flex-row items-center gap-2">
            <Segmented
              ariaLabel="Object view"
              value={view}
              onChange={appStore.setBrowseView}
              options={[
                { value: "list", icon: LayoutList, title: "List view" },
                { value: "grid", icon: Grid2x2, title: "Grid view" },
              ]}
            />

            <Button
              icon={RefreshCw}
              size="sm"
              color="ghost"
              title="Refresh"
              loading={isFetching && !isLoading}
              onClick={refresh}
            />
            <Button
              icon={FolderPlus}
              size="sm"
              title="New folder"
              onClick={() => createFolderDialog.open({ prefix: nav.prefix })}
            />
            <Button
              icon={Upload}
              size="sm"
              color="primary"
              onClick={() => uploadDialog.open({ prefix: nav.prefix })}
            >
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </div>
        </Toolbar>

        {/* -- Listing --------------------------------------------------- */}
        {view === "list" ? (
          <ObjectList
            folders={folders}
            objects={objects}
            prefix={nav.prefix}
            isLoading={isLoading}
            error={error}
            onOpenFolder={nav.goTo}
            onInspect={(object: S3Object) =>
              objectDetails.open({ object, prefix: nav.prefix })
            }
          />
        ) : (
          <ObjectGrid
            folders={folders}
            objects={objects}
            prefix={nav.prefix}
            isLoading={isLoading}
            error={error}
            onOpenFolder={nav.goTo}
            onInspect={(object: S3Object) =>
              objectDetails.open({ object, prefix: nav.prefix })
            }
          />
        )}

        {!isLoading && !error && isEmpty ? (
          isFiltered ? (
            <EmptyState
              title="Nothing matches your filters"
              description="Only objects in this folder are filtered — try moving up a level or clearing the filters."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setKind("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Upload}
              title={nav.prefix ? "This folder is empty" : "This bucket is empty"}
              description="Drop files here or use the upload button to add your first object."
              action={
                <Button
                  size="sm"
                  color="primary"
                  icon={Upload}
                  onClick={() => uploadDialog.open({ prefix: nav.prefix })}
                >
                  Upload files
                </Button>
              }
            />
          )
        ) : null}

        {!isLoading && !isEmpty ? (
          <div className="px-4 md:px-5 py-2.5 border-t border-base-300 flex flex-row items-center justify-between gap-3">
            <p className="text-xs muted tnum">
              {folders.length > 0
                ? `${folders.length} folder${folders.length === 1 ? "" : "s"} · `
                : null}
              {objects.length} object{objects.length === 1 ? "" : "s"}
            </p>
            {data?.nextToken ? (
              <p className="text-xs muted">
                Showing the first 1,000 entries in this folder.
              </p>
            ) : null}
          </div>
        ) : null}
      </Card>

      <UploadDialog />
      <CreateFolderDialog />
      <ObjectDetails />
      <ShareDialog />
    </div>
  );
};

export default BrowseTab;
