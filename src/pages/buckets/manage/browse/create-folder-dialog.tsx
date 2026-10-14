import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import { InputField } from "@/components/ui/input";
import { createDisclosure } from "@/lib/disclosure";
import { handleError } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useBucketContext } from "../context";
import { usePutObject } from "./hooks";
import { createFolderSchema, CreateFolderSchema } from "./schema";

export const createFolderDialog = createDisclosure<{ prefix: string }>();

const CreateFolderDialog = () => {
  const { isOpen, data } = createFolderDialog.use();
  const { bucketName } = useBucketContext();
  const queryClient = useQueryClient();
  const prefix = data?.prefix || "";

  const form = useForm<CreateFolderSchema>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ name: "" });
      const t = setTimeout(() => form.setFocus("name"), 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const createFolder = usePutObject(bucketName, {
    onSuccess: () => {
      toast.success("Folder created");
      queryClient.invalidateQueries({ queryKey: ["browse", bucketName] });
      createFolderDialog.close();
    },
    onError: handleError,
  });

  const onSubmit = form.handleSubmit((values) =>
    createFolder.mutate({ key: `${prefix}${values.name}/`, file: null })
  );

  return (
    <Dialog
      open={isOpen}
      onClose={createFolderDialog.close}
      title="New folder"
      description={
        prefix
          ? `Created inside ${prefix}`
          : "Created in the root of this bucket"
      }
      onSubmit={onSubmit}
      footer={
        <>
          <Button type="button" size="sm" onClick={createFolderDialog.close}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            color="primary"
            loading={createFolder.isPending}
          >
            Create folder
          </Button>
        </>
      }
    >
      <InputField
        form={form}
        name="name"
        title="Folder name"
        placeholder="images"
        autoComplete="off"
        hint="S3 has no real folders — this writes a zero-byte marker object under the prefix."
      />
    </Dialog>
  );
};

export default CreateFolderDialog;
