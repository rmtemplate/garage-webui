import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Plus, ShieldAlert } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { useDisclosure } from "@/hooks/useDisclosure";
import { createKeySchema, CreateKeySchema } from "../schema";
import { InputField } from "@/components/ui/input";
import { CheckboxField } from "@/components/ui/checkbox";
import { useCreateKey } from "../hooks";
import { useQueryClient } from "@tanstack/react-query";
import { handleError } from "@/lib/utils";
import { useEffect, useState } from "react";
import CopyButton from "@/components/ui/copy-button";

type Created = { accessKeyId: string; secretAccessKey?: string };

const CreateKeyDialog = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [created, setCreated] = useState<Created | null>(null);

  const form = useForm<CreateKeySchema>({
    resolver: zodResolver(createKeySchema),
    defaultValues: { name: "", isImport: false },
  });
  const isImport = useWatch({ control: form.control, name: "isImport" });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => form.setFocus("name"), 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const createKey = useCreateKey({
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["keys"] });
      // Garage returns the secret exactly once. Hold the dialog open and show
      // it, rather than closing and leaving the user with no way to get it.
      setCreated(result);
    },
    onError: handleError,
  });

  const close = () => {
    onClose();
    setCreated(null);
    form.reset({ name: "", isImport: false });
    createKey.reset();
  };

  const onSubmit = form.handleSubmit((values) => createKey.mutate(values));

  return (
    <>
      <Button icon={Plus} color="primary" size="sm" onClick={onOpen}>
        Create key
      </Button>

      <Dialog
        open={isOpen}
        onClose={close}
        title={created ? "Access key created" : "Create access key"}
        description={
          created
            ? undefined
            : "An access key is an S3 credential pair that clients use to reach your buckets."
        }
        onSubmit={created ? undefined : onSubmit}
        footer={
          created ? (
            <Button size="sm" color="primary" icon={Check} onClick={close}>
              Done
            </Button>
          ) : (
            <>
              <Button type="button" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                color="primary"
                loading={createKey.isPending}
              >
                {isImport ? "Import key" : "Create key"}
              </Button>
            </>
          )
        }
      >
        {created ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-row items-start gap-3 p-3 rounded-box border border-warning/30 bg-warning/[0.07]">
              <ShieldAlert
                size={16}
                className="text-warning shrink-0 mt-0.5"
                aria-hidden
              />
              <p className="text-[0.8125rem] leading-relaxed">
                This is the only time the secret access key is shown. Copy it
                now and store it somewhere safe — it cannot be retrieved again
                after you close this dialog.
              </p>
            </div>

            <SecretRow label="Access key ID" value={created.accessKeyId} />
            {created.secretAccessKey ? (
              <SecretRow
                label="Secret access key"
                value={created.secretAccessKey}
              />
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <InputField
              form={form}
              name="name"
              title="Key name"
              placeholder="ci-deploy"
              autoComplete="off"
              hint="Letters, numbers, dashes and underscores."
            />

            <CheckboxField
              form={form}
              name="isImport"
              label="Import an existing key pair"
              description="Reuse credentials from another cluster instead of generating a new pair."
            />

            {isImport ? (
              <div className="flex flex-col gap-4 pl-[1.625rem] border-l-2 border-base-300 ml-[0.3125rem]">
                <InputField
                  form={form}
                  name="accessKeyId"
                  title="Access key ID"
                  placeholder="GK…"
                  autoComplete="off"
                  inputClassName="font-mono text-xs"
                />
                <InputField
                  form={form}
                  name="secretAccessKey"
                  title="Secret access key"
                  type="password"
                  autoComplete="new-password"
                  inputClassName="font-mono text-xs"
                />
              </div>
            ) : null}
          </div>
        )}
      </Dialog>
    </>
  );
};

const SecretRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="label label-text pt-0">{label}</p>
    <div className="flex flex-row items-center gap-1.5 bg-base-200 border border-base-300 rounded-btn pl-3 pr-1 py-2">
      <code className="font-mono text-xs flex-1 min-w-0 break-all">
        {value}
      </code>
      <CopyButton value={value} label={`Copy ${label.toLowerCase()}`} />
    </div>
  </div>
);

export default CreateKeyDialog;
