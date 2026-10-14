import Button from "@/components/ui/button";
import CopyButton from "@/components/ui/copy-button";
import Dialog from "@/components/ui/dialog";
import confirm from "@/components/ui/confirm";
import { createDisclosure } from "@/lib/disclosure";
import { dayjs, handleError, readableBytes } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { DownloadIcon, ExternalLink, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import mime from "mime/lite";
import { useBucketContext } from "../context";
import { FILE_KIND_LABELS, getFileExt, getFileIcon, isImageExt } from "./file-types";
import { useDeleteObject } from "./hooks";
import { objectUrl } from "./object-url";
import { shareDialog } from "./share-dialog";
import type { Object as S3Object } from "./types";

export const objectDetails = createDisclosure<{
  object: S3Object;
  prefix: string;
}>();

const ObjectDetails = () => {
  const { isOpen, data } = objectDetails.use();
  const { bucketName } = useBucketContext();
  const queryClient = useQueryClient();
  const [imageFailed, setImageFailed] = useState(false);

  const object = data?.object;
  const prefix = data?.prefix || "";

  const deleteObject = useDeleteObject(bucketName, {
    onSuccess: () => {
      toast.success("Object deleted", { description: object?.objectKey });
      queryClient.invalidateQueries({ queryKey: ["browse", bucketName] });
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
      objectDetails.close();
    },
    onError: handleError,
  });

  if (!object) return null;

  const ext = getFileExt(object.objectKey);
  const { Icon, color, kind } = getFileIcon(object.objectKey);
  const fullKey = prefix + object.objectKey;

  const onDelete = async () => {
    const ok = await confirm({
      title: "Delete object?",
      danger: true,
      confirmText: "Delete",
      description: (
        <>
          <strong className="font-medium text-base-content">
            {object.objectKey}
          </strong>{" "}
          will be permanently deleted. This cannot be undone.
        </>
      ),
    });
    if (ok) deleteObject.mutate({ key: fullKey });
  };

  return (
    <Dialog
      open={isOpen}
      onClose={objectDetails.close}
      title={object.objectKey}
      size="md"
      footer={
        <>
          <Button
            size="sm"
            icon={Trash2}
            className="mr-auto hover:text-error"
            color="ghost"
            loading={deleteObject.isPending}
            onClick={onDelete}
          >
            Delete
          </Button>
          <Button
            size="sm"
            icon={Share2}
            onClick={() =>
              shareDialog.open({ key: object.objectKey, prefix })
            }
          >
            Share
          </Button>
          <Button
            size="sm"
            color="primary"
            icon={DownloadIcon}
            onClick={() => window.open(objectUrl(object, "dl"), "_blank")}
          >
            Download
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* -- Preview ------------------------------------------------- */}
        {isImageExt(ext) && !imageFailed ? (
          <div className="rounded-box overflow-hidden border border-base-300 bg-base-200">
            <img
              src={objectUrl(object, "view")}
              alt={object.objectKey}
              onError={() => setImageFailed(true)}
              className="w-full max-h-72 object-contain"
            />
          </div>
        ) : (
          <div className="grid place-items-center h-32 rounded-box border border-base-300 bg-base-200">
            <Icon size={40} aria-hidden className={color} />
          </div>
        )}

        {/* -- Metadata ------------------------------------------------ */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5">
          <Field label="Size" value={readableBytes(object.size)} />
          <Field label="Kind" value={FILE_KIND_LABELS[kind]} />
          <Field
            label="Content type"
            value={mime.getType(ext || "") || "application/octet-stream"}
          />
          <Field
            label="Last modified"
            value={dayjs(object.lastModified).format("D MMM YYYY, HH:mm")}
            hint={dayjs(object.lastModified).fromNow()}
          />
        </dl>

        <div>
          <p className="eyebrow mb-1.5">Object key</p>
          <div className="flex flex-row items-start gap-1.5 bg-base-200 border border-base-300 rounded-btn pl-3 pr-1 py-2">
            <code className="font-mono text-xs flex-1 min-w-0 break-all leading-relaxed">
              {fullKey}
            </code>
            <CopyButton value={fullKey} label="Copy object key" />
          </div>
        </div>

        <a
          href={objectUrl(object, "view")}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[0.8125rem] text-primary hover:underline"
        >
          <ExternalLink size={13} aria-hidden />
          Open in a new tab
        </a>
      </div>
    </Dialog>
  );
};

const Field = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="min-w-0">
    <dt className="eyebrow">{label}</dt>
    <dd className="text-[0.8125rem] mt-1 truncate" title={value}>
      {value}
      {hint ? <span className="muted"> · {hint}</span> : null}
    </dd>
  </div>
);

export default ObjectDetails;
