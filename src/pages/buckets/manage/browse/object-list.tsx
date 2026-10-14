import { dayjs, readableBytes } from "@/lib/utils";
import { Folder } from "lucide-react";
import { ErrorState, SkeletonRows } from "@/components/ui/states";
import ObjectActions from "./object-actions";
import ObjectThumb from "./object-thumb";
import type { Object as S3Object } from "./types";

export type FolderEntry = { prefix: string; name: string };

export type ListProps = {
  folders: FolderEntry[];
  objects: S3Object[];
  prefix: string;
  isLoading?: boolean;
  error?: unknown;
  onOpenFolder: (prefix: string) => void;
  onInspect: (object: S3Object) => void;
};

const ObjectList = ({
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

  return (
    <div className="overflow-x-auto">
      <table className="table table-row-hover min-w-[40rem]">
        <thead>
          <tr>
            <th>Name</th>
            <th className="w-28">Type</th>
            <th className="w-28 text-right">Size</th>
            <th className="w-40">Modified</th>
            <th className="w-0" />
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <SkeletonRows rows={8} cols={5} />
          ) : (
            <>
              {folders.map((folder) => (
                <tr key={folder.prefix} className="group">
                  <td>
                    <button
                      type="button"
                      onClick={() => onOpenFolder(folder.prefix)}
                      className="flex flex-row items-center gap-2.5 min-w-0 text-left w-full"
                    >
                      <Folder
                        size={17}
                        aria-hidden
                        className="shrink-0 text-primary fill-primary/15"
                      />
                      <span className="font-medium truncate group-hover:text-primary transition-colors">
                        {folder.name}
                      </span>
                    </button>
                  </td>
                  <td className="muted text-xs">Folder</td>
                  <td />
                  <td />
                  <ObjectActions
                    prefix={prefix}
                    object={{ objectKey: folder.prefix, url: "" }}
                  />
                </tr>
              ))}

              {objects.map((object, idx) => (
                <tr key={object.objectKey} className="group">
                  <td>
                    <button
                      type="button"
                      onClick={() => onInspect(object)}
                      title={object.objectKey}
                      className="flex flex-row items-center gap-2.5 min-w-0 text-left w-full"
                    >
                      <ObjectThumb object={object} size={20} />
                      <span className="truncate group-hover:text-primary transition-colors">
                        {object.objectKey}
                      </span>
                    </button>
                  </td>
                  <td className="muted text-xs uppercase tracking-wide">
                    {object.objectKey.split(".").pop()?.slice(0, 8) || "—"}
                  </td>
                  <td className="text-right tnum whitespace-nowrap">
                    {readableBytes(object.size)}
                  </td>
                  <td
                    className="muted text-xs whitespace-nowrap"
                    title={dayjs(object.lastModified).format(
                      "YYYY-MM-DD HH:mm:ss"
                    )}
                  >
                    {dayjs(object.lastModified).fromNow()}
                  </td>
                  <ObjectActions
                    prefix={prefix}
                    object={object}
                    onInspect={() => onInspect(object)}
                    end={idx >= objects.length - 2 && objects.length > 5}
                  />
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ObjectList;
