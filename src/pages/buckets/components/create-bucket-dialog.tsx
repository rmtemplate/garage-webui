import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { useDisclosure } from "@/hooks/useDisclosure";
import { createBucketSchema, CreateBucketSchema } from "../schema";
import { InputField } from "@/components/ui/input";
import { useCreateBucket } from "../hooks";
import { useQueryClient } from "@tanstack/react-query";
import { handleError } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CreateBucketDialog = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const form = useForm<CreateBucketSchema>({
    resolver: zodResolver(createBucketSchema),
    defaultValues: { globalAlias: "" },
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      form.reset({ globalAlias: "" });
      // The dialog animates in; focus once it is on screen.
      const t = setTimeout(() => form.setFocus("globalAlias"), 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const createBucket = useCreateBucket({
    onSuccess: (bucket) => {
      onClose();
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
      toast.success("Bucket created", {
        description: form.getValues("globalAlias"),
        action: bucket?.id
          ? {
              label: "Open",
              onClick: () => navigate(`/buckets/${bucket.id}`),
            }
          : undefined,
      });
    },
    onError: handleError,
  });

  const onSubmit = form.handleSubmit((values) => createBucket.mutate(values));

  return (
    <>
      <Button icon={Plus} color="primary" size="sm" onClick={onOpen}>
        Create bucket
      </Button>

      <Dialog
        open={isOpen}
        onClose={onClose}
        title="Create bucket"
        description="Buckets are addressed by a globally unique alias. You can add more aliases later."
        onSubmit={onSubmit}
        footer={
          <>
            <Button type="button" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              color="primary"
              loading={createBucket.isPending}
            >
              Create bucket
            </Button>
          </>
        }
      >
        <InputField
          form={form}
          name="globalAlias"
          title="Bucket name"
          placeholder="my-bucket"
          autoComplete="off"
          hint="Lowercase letters, numbers and dashes work best with S3 clients."
        />
      </Dialog>
    </>
  );
};

export default CreateBucketDialog;
