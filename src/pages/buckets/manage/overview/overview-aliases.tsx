import { Plus } from "lucide-react";
import Chips from "@/components/ui/chips";
import Dialog from "@/components/ui/dialog";
import confirm from "@/components/ui/confirm";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddAliasSchema, addAliasSchema } from "../schema";
import Button from "@/components/ui/button";
import { useAddAlias, useRemoveAlias } from "../hooks";
import { toast } from "sonner";
import { handleError } from "@/lib/utils";
import { InputField } from "@/components/ui/input";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBucketContext } from "../context";

const AliasesSection = () => {
  const { bucket } = useBucketContext();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["bucket", bucket.id] });
    queryClient.invalidateQueries({ queryKey: ["buckets"] });
  };

  const removeAlias = useRemoveAlias(bucket.id, {
    onSuccess: () => {
      toast.success("Alias removed");
      invalidate();
    },
    onError: handleError,
  });

  const onRemoveAlias = async (alias: string) => {
    const ok = await confirm({
      title: "Remove alias?",
      danger: true,
      confirmText: "Remove alias",
      description: (
        <>
          Clients addressing this bucket as{" "}
          <strong className="font-medium text-base-content">{alias}</strong>{" "}
          will stop resolving. Other aliases keep working.
        </>
      ),
    });
    if (ok) removeAlias.mutate(alias);
  };

  const aliases = bucket.globalAliases || [];

  return (
    <div className="flex flex-row flex-wrap items-center gap-2">
      {aliases.map((alias) => (
        <Chips
          key={alias}
          removeLabel={alias}
          // Garage requires at least one global alias.
          onRemove={aliases.length > 1 ? () => onRemoveAlias(alias) : undefined}
        >
          {alias}
        </Chips>
      ))}
      <AddAliasDialog />
    </div>
  );
};

const AddAliasDialog = () => {
  const { bucket } = useBucketContext();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const form = useForm<AddAliasSchema>({
    resolver: zodResolver(addAliasSchema),
    defaultValues: { alias: "" },
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => form.setFocus("alias"), 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const addAlias = useAddAlias(bucket.id, {
    onSuccess: () => {
      form.reset();
      onClose();
      toast.success("Alias added");
      queryClient.invalidateQueries({ queryKey: ["bucket", bucket.id] });
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
    },
    onError: handleError,
  });

  const onSubmit = form.handleSubmit((values) => addAlias.mutate(values.alias));

  return (
    <>
      <Button size="sm" onClick={onOpen} icon={Plus}>
        Add alias
      </Button>

      <Dialog
        open={isOpen}
        onClose={onClose}
        title="Add alias"
        description="A global alias is a cluster-wide name for this bucket. It must be unique."
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
              loading={addAlias.isPending}
            >
              Add alias
            </Button>
          </>
        }
      >
        <InputField
          form={form}
          name="alias"
          title="Alias"
          placeholder="my-other-name"
          autoComplete="off"
        />
      </Dialog>
    </>
  );
};

export default AliasesSection;
