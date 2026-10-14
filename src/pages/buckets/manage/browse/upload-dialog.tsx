import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/states";
import { createDisclosure } from "@/lib/disclosure";
import { cn, readableBytes } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CloudUpload,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useBucketContext } from "../context";
import { getFileIcon } from "./file-types";
import { usePutObject } from "./hooks";

export const uploadDialog = createDisclosure<{ prefix: string }>();

/** Matches the limit the original implementation enforced. */
const MAX_FILES = 20;

type Status = "pending" | "uploading" | "done" | "error";
type Item = { file: File; status: Status; error?: string };

const UploadDialog = () => {
  const { isOpen, data } = uploadDialog.use();
  const { bucketName } = useBucketContext();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);

  const prefix = data?.prefix || "";

  useEffect(() => {
    if (!isOpen) {
      setItems([]);
      setDragging(false);
      setRunning(false);
    }
  }, [isOpen]);

  const putObject = usePutObject(bucketName);

  const addFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const incoming = Array.from(files);

    setItems((prev) => {
      const existing = new Set(prev.map((i) => i.file.name));
      const merged = [
        ...prev,
        ...incoming
          .filter((f) => !existing.has(f.name))
          .map((file): Item => ({ file, status: "pending" })),
      ];

      if (merged.length > MAX_FILES) {
        toast.error(`You can upload up to ${MAX_FILES} files at a time`);
        return merged.slice(0, MAX_FILES);
      }
      return merged;
    });
  };

  const remove = (name: string) =>
    setItems((prev) => prev.filter((i) => i.file.name !== name));

  const setStatus = (name: string, status: Status, error?: string) =>
    setItems((prev) =>
      prev.map((i) => (i.file.name === name ? { ...i, status, error } : i))
    );

  const onUpload = async () => {
    const queue = items.filter((i) => i.status !== "done");
    if (!queue.length) return;

    setRunning(true);
    let failed = 0;

    // Sequential: keeps the per-file status honest and avoids hammering the
    // S3 endpoint with twenty parallel PUTs.
    for (const item of queue) {
      setStatus(item.file.name, "uploading");
      try {
        await putObject.mutateAsync({
          key: prefix + item.file.name,
          file: item.file,
        });
        setStatus(item.file.name, "done");
      } catch (err) {
        failed++;
        setStatus(item.file.name, "error", (err as Error)?.message);
      }
    }

    setRunning(false);
    queryClient.invalidateQueries({ queryKey: ["browse", bucketName] });
    queryClient.invalidateQueries({ queryKey: ["bucket"] });
    queryClient.invalidateQueries({ queryKey: ["buckets"] });

    const done = queue.length - failed;
    if (done > 0) {
      toast.success(`Uploaded ${done} file${done === 1 ? "" : "s"}`);
    }
    if (failed === 0) uploadDialog.close();
    else toast.error(`${failed} file${failed === 1 ? "" : "s"} failed`);
  };

  const pending = items.filter((i) => i.status !== "done").length;
  const totalBytes = items.reduce((acc, i) => acc + i.file.size, 0);

  return (
    <Dialog
      open={isOpen}
      onClose={uploadDialog.close}
      size="lg"
      title="Upload files"
      description={
        prefix ? `Into ${prefix}` : "Into the root of this bucket"
      }
      footer={
        <>
          <span className="flex-1 text-xs muted tnum">
            {items.length > 0
              ? `${items.length} file${items.length === 1 ? "" : "s"} · ${readableBytes(totalBytes)}`
              : null}
          </span>
          <Button
            type="button"
            size="sm"
            onClick={uploadDialog.close}
            disabled={running}
          >
            {items.some((i) => i.status === "done") ? "Close" : "Cancel"}
          </Button>
          <Button
            size="sm"
            color="primary"
            icon={Upload}
            onClick={onUpload}
            loading={running}
            disabled={pending === 0}
          >
            Upload {pending > 0 ? pending : ""}
          </Button>
        </>
      }
    >
      {/* -- Drop zone ------------------------------------------------- */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-box border-2 border-dashed transition-colors duration-150",
          dragging
            ? "border-primary bg-primary/[0.06]"
            : "border-base-300 bg-base-200/50"
        )}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 px-6 py-9 text-center"
        >
          <CloudUpload
            size={26}
            aria-hidden
            className={cn(
              "transition-colors",
              dragging ? "text-primary" : "text-base-content/35"
            )}
          />
          <span className="text-[0.8125rem] font-medium">
            Drop files here, or <span className="text-primary">browse</span>
          </span>
          <span className="text-xs muted">
            Up to {MAX_FILES} files per upload
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          aria-label="Choose files to upload"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* -- Queue ------------------------------------------------------ */}
      {items.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-1.5" aria-label="Upload queue">
          {items.map((item) => {
            const { Icon, color } = getFileIcon(item.file.name);

            return (
              <li
                key={item.file.name}
                className="flex flex-row items-center gap-3 px-3 py-2 rounded-btn
                           bg-base-200/60 border border-base-300"
              >
                <Icon size={16} aria-hidden className={cn("shrink-0", color)} />

                <div className="flex-1 min-w-0">
                  <p className="text-[0.8125rem] truncate">{item.file.name}</p>
                  <p className="text-xs muted tnum">
                    {readableBytes(item.file.size)}
                    {item.error ? (
                      <span className="text-error"> · {item.error}</span>
                    ) : null}
                  </p>
                </div>

                <StatusIcon status={item.status} />

                {item.status === "pending" ? (
                  <button
                    type="button"
                    onClick={() => remove(item.file.name)}
                    title={`Remove ${item.file.name}`}
                    aria-label={`Remove ${item.file.name}`}
                    className="grid place-items-center size-6 rounded-md shrink-0
                               text-base-content/45 hover:text-error hover:bg-error/10
                               transition-colors"
                  >
                    <X size={13} />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </Dialog>
  );
};

const StatusIcon = ({ status }: { status: Status }) => {
  if (status === "uploading") return <Spinner size={15} />;
  if (status === "done")
    return (
      <>
        <Check size={15} className="text-success shrink-0" aria-hidden />
        <span className="sr-only">Uploaded</span>
      </>
    );
  if (status === "error")
    return (
      <>
        <TriangleAlert size={15} className="text-error shrink-0" aria-hidden />
        <span className="sr-only">Failed</span>
      </>
    );
  return null;
};

export default UploadDialog;
