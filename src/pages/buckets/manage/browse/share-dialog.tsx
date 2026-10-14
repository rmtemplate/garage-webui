import { createDisclosure } from "@/lib/disclosure";
import Dialog from "@/components/ui/dialog";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import CopyButton from "@/components/ui/copy-button";
import { useBucketContext } from "../context";
import { useConfig } from "@/hooks/useConfig";
import { useEffect, useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export const shareDialog = createDisclosure<{ key: string; prefix: string }>();

const ShareDialog = () => {
  const { isOpen, data } = shareDialog.use();
  const { bucket, bucketName } = useBucketContext();
  const { data: config } = useConfig();
  const [domain, setDomain] = useState(bucketName);

  const domains = useMemo(() => {
    const port = config?.s3_web?.bind_addr?.split(":").pop() || "80";
    const rootDomain = config?.s3_web?.root_domain;
    const hosts = [bucketName];

    if (rootDomain) {
      hosts.push(bucketName + rootDomain);
      if (port !== "80") hosts.push(`${bucketName}${rootDomain}:${port}`);
    }
    return hosts;
  }, [bucketName, config]);

  useEffect(() => setDomain(domains[0]), [domains]);

  const url = `http://${domain}/${data?.prefix || ""}${data?.key || ""}`;

  return (
    <Dialog
      open={isOpen}
      onClose={shareDialog.close}
      title="Share object"
      description="Website access serves this object over plain HTTP, with no credentials."
      footer={
        <Button size="sm" onClick={shareDialog.close}>
          Close
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {!bucket.websiteAccess ? (
          <div className="flex flex-row items-start gap-3 p-3 rounded-box border border-warning/30 bg-warning/[0.07]">
            <TriangleAlert
              size={16}
              className="text-warning shrink-0 mt-0.5"
              aria-hidden
            />
            <p className="text-[0.8125rem] leading-relaxed">
              Website access is off for this bucket, so this link will not
              resolve yet.{" "}
              <Link
                to={`/buckets/${bucket.id}?tab=overview`}
                onClick={shareDialog.close}
                className="text-primary hover:underline font-medium"
              >
                Enable it in Overview
              </Link>
              .
            </p>
          </div>
        ) : null}

        {domains.length > 1 ? (
          <div>
            <p className="eyebrow mb-2">Hostname</p>
            <div
              role="radiogroup"
              aria-label="Hostname"
              className="flex flex-col gap-1.5"
            >
              {domains.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="radio"
                  aria-checked={item === domain}
                  onClick={() => setDomain(item)}
                  className={cn(
                    "flex flex-row items-center gap-2.5 px-3 py-2 rounded-btn border text-left",
                    "text-[0.8125rem] font-mono transition-colors duration-150",
                    item === domain
                      ? "border-primary bg-primary/[0.07] text-base-content"
                      : "border-base-300 hover:border-base-content/20 text-base-content/70"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid place-items-center size-3.5 rounded-full border-2 shrink-0",
                      item === domain ? "border-primary" : "border-base-content/30"
                    )}
                  >
                    {item === domain ? (
                      <span className="size-1.5 rounded-full bg-primary" />
                    ) : null}
                  </span>
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="share-url" className="label label-text pt-0">
            Public URL
          </label>
          <Input
            id="share-url"
            readOnly
            value={url}
            className="font-mono text-xs"
            onFocus={(e) => e.target.select()}
            suffix={<CopyButton value={url} label="Copy link" />}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default ShareDialog;
