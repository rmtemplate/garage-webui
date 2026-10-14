import { dayjs, readableBytes } from "@/lib/utils";
import { Folder } from "lucide-react";
import { ErrorState, Skeleton } from "@/components/ui/states";
import ObjectActions from "./object-actions";
import { getFileExt, getFileIcon, isImageExt } from "./file-types";
import { objectUrl } from "./object-url";
import { useState } from "react";
import type { ListProps } from "./object-list";
import type { Object as S3Object } from "./types";

const ObjectGrid = ({
  folders,
  objects,
  prefix,
  isLoading,
  error,
  onOpenFolder,
  onInspect,
}: ListProps) => {
  if (error) {
    return <ErrorState title="Could not list this folder" error={error} />;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 p-4 md:p-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="surface p-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-3 w-3/4 mt-2.5" />
            <Skeleton className="h-2.5 w-1/2 mt-1.5" />
          </div>
        ))}
      </div>
    );
  }

  if (folders.length === 0 && objects.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 p-4 md:p-5">
      {folders.map((folder) => (
        <article
          key={folder.prefix}
          className="group relative surface surface-hover p-2 flex flex-col"
        >
          <button
            type="button"
            onClick={() => onOpenFolder(folder.prefix)}
            className="flex flex-col text-left"
          >
            <span className="grid place-items-center aspect-square w-full rounded-btn bg-base-200">
              <Folder
                size={34}
                aria-hidden
                className="text-primary fill-primary/15"
              />
            </span>
            <span
              className="block text-[0.8125rem] font-medium truncate mt-2.5 px-0.5
                         group-hover:text-primary transition-colors"
              title={folder.name}
            >
              {folder.name}
            </span>
            <span className="block text-xs muted px-0.5">Folder</span>
          </button>

          <GridActions>
            <ObjectActions
              prefix={prefix}
              object={{ objectKey: folder.prefix, url: "" }}
              bare
            />
          </GridActions>
        </article>
      ))}

      {objects.map((object) => (
        <article
          key={object.objectKey}
          className="group relative surface surface-hover p-2 flex flex-col"
        >
          <button
            type="button"
            onClick={() => onInspect(object)}
            className="flex flex-col text-left min-w-0"
          >
            <Preview object={object} />
            <span
              className="block text-[0.8125rem] truncate mt-2.5 px-0.5
                         group-hover:text-primary transition-colors"
              title={object.objectKey}
            >
              {object.objectKey}
            </span>
            <span className="block text-xs muted px-0.5 tnum">
              {readableBytes(object.size)} ·{" "}
              {dayjs(object.lastModified).fromNow()}
            </span>
          </button>

          <GridActions>
            <ObjectActions
              prefix={prefix}
              object={object}
              onInspect={() => onInspect(object)}
              bare
            />
          </GridActions>
        </article>
      ))}
    </div>
  );
};

/** Hover-revealed, but always reachable by keyboard. */
const GridActions = ({ children }: { children: React.ReactNode }) => (
  <div
    className="absolute right-1 top-1 opacity-0 group-hover:opacity-100
               focus-within:opacity-100 transition-opacity duration-150"
  >
    {children}
  </div>
);

const Preview = ({ object }: { object: S3Object }) => {
  const [failed, setFailed] = useState(false);
  const ext = getFileExt(object.objectKey);
  const { Icon, color } = getFileIcon(object.objectKey);

  if (isImageExt(ext) && !failed) {
    return (
      <span className="block aspect-square w-full rounded-btn overflow-hidden bg-base-200">
        <img
          src={objectUrl(object, "thumb")}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      </span>
    );
  }

  return (
    <span className="grid place-items-center aspect-square w-full rounded-btn bg-base-200">
      <Icon size={32} aria-hidden className={color} />
    </span>
  );
};

export default ObjectGrid;
