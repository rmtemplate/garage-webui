import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import Checkbox from "@/components/ui/checkbox";
import { CheckboxField } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/states";
import { useKeys } from "@/pages/keys/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeySquare, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { AllowKeysSchema, allowKeysSchema } from "../schema";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useAllowKey } from "../hooks";
import { toast } from "sonner";
import { handleError } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useBucketContext } from "../context";

type Props = {
  currentKeys?: string[];
};

const AllowKeyDialog = ({ currentKeys }: Props) => {
  const { bucket } = useBucketContext();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: keys, isLoading } = useKeys();

  const form = useForm<AllowKeysSchema>({
    resolver: zodResolver(allowKeysSchema),
    defaultValues: { keys: [] },
  });
  const { fields: keyFields } = useFieldArray({
    control: form.control,
    name: "keys",
  });
  const watched = useWatch({ control: form.control, name: "keys" });
  const queryClient = useQueryClient();

  const allowKey = useAllowKey(bucket.id, {
    onSuccess: () => {
      form.reset();
      onClose();
      toast.success("Access granted");
      queryClient.invalidateQueries({ queryKey: ["bucket", bucket.id] });
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
    },
    onError: handleError,
  });

  useEffect(() => {
    form.setValue(
      "keys",
      keys
        ?.filter((key) => !currentKeys?.includes(key.id))
        ?.map((key) => ({
          checked: false,
          keyId: key.id,
          name: key.name,
          // Read is the sane default: it is the permission you almost always
          // want, and the one that cannot destroy anything.
          read: true,
          write: false,
          owner: false,
        })) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, currentKeys, isOpen]);

  const onToggleAll = (
    checked: boolean,
    field: keyof AllowKeysSchema["keys"][number]
  ) => {
    form.setValue(
      "keys",
      form.getValues("keys").map((item) => ({ ...item, [field]: checked }))
    );
  };

  const selected = useMemo(
    () => (watched || []).filter((k) => k?.checked).length,
    [watched]
  );

  const onSubmit = form.handleSubmit((values) => {
    const data = values.keys
      .filter((key) => key.checked)
      .map((key) => ({
        keyId: key.keyId,
        permissions: { read: key.read, write: key.write, owner: key.owner },
      }));

    if (!data.length) {
      toast.error("Select at least one key");
      return;
    }

    allowKey.mutate(data);
  });

  const allChecked =
    keyFields.length > 0 && selected === keyFields.length;

  return (
    <>
      <Button icon={Plus} color="primary" size="sm" onClick={onOpen}>
        Allow key
      </Button>

      <Dialog
        open={isOpen}
        onClose={onClose}
        size="lg"
        title="Allow access keys"
        description="Pick the keys that may use this bucket, and what each one is allowed to do."
        onSubmit={onSubmit}
        footer={
          <>
            <span className="flex-1 text-xs muted">
              {selected > 0
                ? `${selected} key${selected === 1 ? "" : "s"} selected`
                : null}
            </span>
            <Button type="button" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              color="primary"
              disabled={selected === 0}
              loading={allowKey.isPending}
            >
              Grant access
            </Button>
          </>
        }
      >
        {isLoading ? (
          <p className="text-sm muted py-6 text-center">Loading keys…</p>
        ) : keyFields.length === 0 ? (
          <EmptyState
            compact
            icon={KeySquare}
            title="No keys left to add"
            description="Every access key on this cluster already has permissions on this bucket. Create a new key to grant separate access."
          />
        ) : (
          <div className="-mx-1 overflow-x-auto">
            <table className="table min-w-[32rem]">
              <thead>
                <tr>
                  <th>
                    <Checkbox
                      checked={allChecked}
                      aria-label="Select all keys"
                      onChange={(e) => onToggleAll(e.target.checked, "checked")}
                    />
                  </th>
                  <th>Key</th>
                  <PermHeader label="Read" onToggle={onToggleAll} field="read" />
                  <PermHeader
                    label="Write"
                    onToggle={onToggleAll}
                    field="write"
                  />
                  <PermHeader
                    label="Owner"
                    onToggle={onToggleAll}
                    field="owner"
                  />
                </tr>
              </thead>

              <tbody>
                {keyFields.map((field, index) => (
                  <tr key={field.id}>
                    <td>
                      <CheckboxField
                        form={form}
                        name={`keys.${index}.checked`}
                        aria-label={`Select ${field.name || field.keyId}`}
                      />
                    </td>
                    <td>
                      <p className="font-medium truncate">
                        {field.name || "Unnamed key"}
                      </p>
                      <p className="text-xs muted font-mono truncate max-w-[12rem]">
                        {field.keyId}
                      </p>
                    </td>
                    <td className="text-center">
                      <CheckboxField
                        form={form}
                        name={`keys.${index}.read`}
                        aria-label={`Read access for ${field.name}`}
                      />
                    </td>
                    <td className="text-center">
                      <CheckboxField
                        form={form}
                        name={`keys.${index}.write`}
                        aria-label={`Write access for ${field.name}`}
                      />
                    </td>
                    <td className="text-center">
                      <CheckboxField
                        form={form}
                        name={`keys.${index}.owner`}
                        aria-label={`Owner access for ${field.name}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-xs muted mt-3 px-1 leading-relaxed">
              The object browser needs a key with both <strong>read</strong> and{" "}
              <strong>write</strong> on this bucket.
            </p>
          </div>
        )}
      </Dialog>
    </>
  );
};

const PermHeader = ({
  label,
  field,
  onToggle,
}: {
  label: string;
  field: "read" | "write" | "owner";
  onToggle: (checked: boolean, field: "read" | "write" | "owner") => void;
}) => (
  <th className="text-center">
    <span className="inline-flex flex-col items-center gap-1">
      {label}
      <Checkbox
        aria-label={`Toggle ${label} for all keys`}
        onChange={(e) => onToggle(e.target.checked, field)}
      />
    </span>
  </th>
);

export default AllowKeyDialog;
