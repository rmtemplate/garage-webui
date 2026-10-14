import { DeepPartial, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuotaSchema, quotaSchema } from "../schema";
import { useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useUpdateBucket } from "../hooks";
import { InputField } from "@/components/ui/input";
import { ToggleField } from "@/components/ui/toggle";
import { useBucketContext } from "../context";
import { useQueryClient } from "@tanstack/react-query";
import SavingIndicator from "../components/saving-indicator";

const QuotaSection = () => {
  const { bucket } = useBucketContext();
  const queryClient = useQueryClient();

  const form = useForm<QuotaSchema>({
    resolver: zodResolver(quotaSchema),
  });
  const isEnabled = useWatch({ control: form.control, name: "enabled" });

  const updateMutation = useUpdateBucket(bucket.id);

  const onChange = useDebounce((values: DeepPartial<QuotaSchema>) => {
    const { enabled } = values;
    const maxObjects = Number(values.maxObjects);
    const maxSize = Math.round(Number(values.maxSize) * 1024 ** 3);

    updateMutation.mutate(
      {
        quotas: {
          maxObjects: enabled && maxObjects > 0 ? maxObjects : null,
          maxSize: enabled && maxSize > 0 ? maxSize : null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["bucket", bucket.id] });
          queryClient.invalidateQueries({ queryKey: ["buckets"] });
        },
      }
    );
  });

  useEffect(() => {
    form.reset({
      enabled:
        bucket.quotas?.maxSize != null || bucket.quotas?.maxObjects != null,
      maxSize: bucket.quotas?.maxSize ? bucket.quotas.maxSize / 1024 ** 3 : null,
      maxObjects: bucket.quotas?.maxObjects || null,
    });

    const { unsubscribe } = form.watch((values) => onChange(values));
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket]);

  return (
    <div>
      <div className="flex flex-row items-start gap-3">
        <ToggleField
          form={form}
          name="enabled"
          label="Enforce quotas"
          description="Garage rejects writes once a limit is reached."
          className="flex-1"
        />
        <SavingIndicator mutation={updateMutation} />
      </div>

      {isEnabled ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-base-300 animate-fade-in">
          <InputField
            form={form}
            name="maxObjects"
            title="Max objects"
            type="number"
            min={0}
            placeholder="Unlimited"
          />
          <InputField
            form={form}
            name="maxSize"
            title="Max size"
            type="number"
            min={0}
            step="0.1"
            placeholder="Unlimited"
            hint="In gigabytes (GiB)."
          />
        </div>
      ) : null}
    </div>
  );
};

export default QuotaSection;
