import { Dropdown } from "react-daisyui";
import { Object as S3Object } from "./types";
import Button from "@/components/ui/button";
import confirm from "@/components/ui/confirm";
import {
  DownloadIcon,
  EllipsisVertical,
  ExternalLink,
  Info,
  Share2,
  Trash2,
} from "lucide-react";
import { useDeleteObject } from "./hooks";
import { useBucketContext } from "../context";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleError } from "@/lib/utils";
import { shareDialog } from "./share-dialog";
import { objectUrl } from "./object-url";

type Props = {
  prefix?: string;
  object: Pick<S3Object, "objectKey" | "url">;
  /** Opens the details panel; omitted for folders. */
  onInspect?: () => void;
  /** Drop the <td> wrapper — used by the grid view. */
  bare?: boolean;
  end?: boolean;
};

const ObjectActions = ({
  prefix = "",
  object,
  onInspect,
  bare,
  end,
}: Props) => {
  const { bucketName } = useBucketContext();
  const queryClient = useQueryClient();
  const isDirectory = object.objectKey.endsWith("/");
  const name = isDirectory
    ? object.objectKey.replace(/\/$/, "").split("/").pop()
    : object.objectKey;

  const deleteObject = useDeleteObject(bucketName, {
    onSuccess: () => {
      toast.success(isDirectory ? "Folder deleted" : "Object deleted", {
        description: name,
      });
      queryClient.invalidateQueries({ queryKey: ["browse", bucketName] });
      queryClient.invalidateQueries({ queryKey: ["bucket"] });
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
    },
    onError: handleError,
  });

  const onDelete = async () => {
    const ok = await confirm({
      title: isDirectory ? "Delete folder?" : "Delete object?",
      danger: true,
      confirmText: "Delete",
      description: isDirectory ? (
        <>
          <strong className="font-medium text-base-content">{name}</strong> and
          everything inside it will be permanently deleted. This cannot be
          undone.
        </>
      ) : (
        <>
          <strong className="font-medium text-base-content">{name}</strong> will
          be permanently deleted. This cannot be undone.
        </>
      ),
    });

    if (ok) {
      deleteObject.mutate({
        // A folder row carries its own full prefix; a file key is relative.
        key: isDirectory ? object.objectKey : prefix + object.objectKey,
        recursive: isDirectory,
      });
    }
  };

  const menu = (
    <div className="flex flex-row items-center justify-end gap-0.5">
      {!isDirectory ? (
        <Button
          icon={DownloadIcon}
          size="sm"
          color="ghost"
          title={`Download ${name}`}
          onClick={() => window.open(objectUrl(object, "dl"), "_blank")}
        />
      ) : null}

      <Dropdown end vertical={end ? "top" : "bottom"}>
        <Dropdown.Toggle button={false}>
          <Button
            icon={EllipsisVertical}
            size="sm"
            color="ghost"
            title={`Actions for ${name}`}
          />
        </Dropdown.Toggle>

        <Dropdown.Menu className="panel min-w-44">
          {onInspect ? (
            <Dropdown.Item onClick={onInspect}>
              <Info size={15} /> Details
            </Dropdown.Item>
          ) : null}
          {!isDirectory ? (
            <Dropdown.Item
              onClick={() => window.open(objectUrl(object, "view"), "_blank")}
            >
              <ExternalLink size={15} /> Open in new tab
            </Dropdown.Item>
          ) : null}
          <Dropdown.Item
            onClick={() =>
              shareDialog.open({ key: object.objectKey, prefix })
            }
          >
            <Share2 size={15} /> Share link
          </Dropdown.Item>
          <Dropdown.Item
            className="text-error hover:bg-error/10"
            onClick={onDelete}
          >
            <Trash2 size={15} /> Delete
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );

  if (bare) return menu;

  return <td className="pr-2 md:pr-3">{menu}</td>;
};

export default ObjectActions;
