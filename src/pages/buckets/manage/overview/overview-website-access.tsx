import { DeepPartial, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { websiteConfigSchema, WebsiteConfigSchema } from "../schema";
import { useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useUpdateBucket } from "../hooks";
import { useConfig } from "@/hooks/useConfig";
import { ExternalLink, Info } from "lucide-react";
import { InputField } from "@/components/ui/input";
import { ToggleField } from "@/components/ui/toggle";
import { useBucketContext } from "../context";
import { useQueryClient } from "@tanstack/react-query";
import SavingIndicator from "../components/saving-indicator";

const WebsiteAccessSection = () => {
  const { bucket, bucketName } = useBucketContext();
  const { data: config } = useConfig();
  const queryClient = useQueryClient();

  const form = useForm<WebsiteConfigSchema>({
    resolver: zodResolver(websiteConfigSchema),
  });
  const isEnabled = useWatch({ control: form.control, name: "websiteAccess" });

  const updateMutation = useUpdateBucket(bucket.id);

  const urls = useMemo(() => {
    const port = config?.s3_web?.bind_addr?.split(":").pop() || "80";
    const rootDomain = config?.s3_web?.root_domain;
    const hosts = [bucketName];

    if (rootDomain) {
      hosts.push(bucketName + rootDomain);
      if (port !== "80") hosts.push(`${bucketName}${rootDomain}:${port}`);
    }

    return hosts;
  }, [bucketName, config]);

  const onChange = useDebounce((values: DeepPartial<WebsiteConfigSchema>) => {
    updateMutation.mutate(
      {
        websiteAccess: {
          enabled: values.websiteAccess,
          indexDocument: values.websiteAccess
            ? values.websiteConfig?.indexDocument
            : undefined,
          errorDocument: values.websiteAccess
            ? values.websiteConfig?.errorDocument
            : undefined,
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
      websiteAccess: bucket.websiteAccess,
      websiteConfig: {
        indexDocument: bucket.websiteConfig?.indexDocument || "index.html",
        errorDocument: bucket.websiteConfig?.errorDocument || "error/400.html",
      },
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
          name="websiteAccess"
          label="Expose as a website"
          description="Serves objects over HTTP without S3 credentials."
          className="flex-1"
        />
        <SavingIndicator mutation={updateMutation} />
      </div>

      {isEnabled ? (
        <div className="mt-4 pt-4 border-t border-base-300 flex flex-col gap-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              form={form}
              name="websiteConfig.indexDocument"
              title="Index document"
              placeholder="index.html"
              autoComplete="off"
            />
            <InputField
              form={form}
              name="websiteConfig.errorDocument"
              title="Error document"
              placeholder="error/400.html"
              autoComplete="off"
            />
          </div>

          <div>
            <p className="eyebrow mb-2">Reachable at</p>
            <ul className="flex flex-col gap-1">
              {urls.map((host) => (
                <li key={host}>
                  <a
                    href={`http://${host}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[0.8125rem] font-mono
                               text-primary hover:underline break-all"
                  >
                    <ExternalLink size={13} className="shrink-0" aria-hidden />
                    {host}
                  </a>
                </li>
              ))}
            </ul>
            <p className="flex items-start gap-1.5 text-xs muted mt-2.5">
              <Info size={12} className="mt-0.5 shrink-0" aria-hidden />
              These hostnames must resolve to your Garage web endpoint.{" "}
              <a
                href="https://garagehq.deuxfleurs.fr/documentation/cookbook/exposing-websites"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Setup guide
              </a>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WebsiteAccessSection;
