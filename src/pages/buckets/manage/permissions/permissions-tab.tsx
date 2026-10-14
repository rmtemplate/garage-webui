import { useDenyKey } from "../hooks";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import confirm from "@/components/ui/confirm";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import CopyButton from "@/components/ui/copy-button";
import { Check, KeySquare, Minus, Trash2 } from "lucide-react";
import AllowKeyDialog from "./allow-key-dialog";
import { useMemo } from "react";
import { toast } from "sonner";
import { handleError } from "@/lib/utils";
import { useBucketContext } from "../context";
import { useQueryClient } from "@tanstack/react-query";

const PermissionsTab = () => {
  const { bucket, refetch } = useBucketContext();
  const queryClient = useQueryClient();

  const denyKey = useDenyKey(bucket.id, {
    onSuccess: () => {
      toast.success("Access revoked");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
    },
    onError: handleError,
  });

  const keys = useMemo(
    () =>
      bucket?.keys.filter(
        (key) =>
          key.permissions.read || key.permissions.write || key.permissions.owner
      ) || [],
    [bucket?.keys]
  );

  const onRemove = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Revoke access to this bucket?",
      danger: true,
      confirmText: "Revoke access",
      description: (
        <>
          <strong className="font-medium text-base-content">{name}</strong>{" "}
          loses read, write and owner permissions on{" "}
          <strong className="font-medium text-base-content">
            {bucket.globalAliases[0]}
          </strong>
          . The key itself is not deleted and keeps its access to other buckets.
        </>
      ),
    });

    if (ok) {
      denyKey.mutate({
        keyId: id,
        permissions: { read: true, write: true, owner: true },
      });
    }
  };

  return (
    <Card
      title="Allowed access keys"
      description="Which S3 credentials may use this bucket, and how"
      padded={false}
      actions={
        <AllowKeyDialog currentKeys={keys.map((key) => key.accessKeyId)} />
      }
    >
      {keys.length === 0 ? (
        <EmptyState
          icon={KeySquare}
          title="No keys can access this bucket"
          description="Until a key is allowed, nothing can read from or write to this bucket over S3 — including the object browser."
          action={<AllowKeyDialog currentKeys={[]} />}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-row-hover min-w-[44rem]">
            <thead>
              <tr>
                <th>Key</th>
                <th>Local aliases</th>
                <th className="text-center">Read</th>
                <th className="text-center">Write</th>
                <th className="text-center">Owner</th>
                <th className="w-0" />
              </tr>
            </thead>

            <tbody>
              {keys.map((key) => {
                const name = key.name || key.accessKeyId.substring(0, 8);

                return (
                  <tr key={key.accessKeyId}>
                    <td>
                      <div className="flex flex-row items-center gap-3">
                        <span
                          aria-hidden
                          className="grid place-items-center size-8 shrink-0 rounded-btn bg-base-200 border border-base-300"
                        >
                          <KeySquare
                            size={14}
                            className="text-base-content/50"
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{name}</p>
                          <p className="flex items-center gap-0.5 text-xs muted font-mono">
                            <span className="truncate max-w-[11rem]">
                              {key.accessKeyId}
                            </span>
                            <CopyButton
                              value={key.accessKeyId}
                              size="xs"
                              label="Copy access key ID"
                            />
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="text-[0.8125rem]">
                      {key.bucketLocalAliases?.length ? (
                        <div className="flex flex-row flex-wrap gap-1">
                          {key.bucketLocalAliases.map((alias) => (
                            <Badge key={alias} tone="neutral">
                              {alias}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>

                    <PermissionCell granted={key.permissions?.read} />
                    <PermissionCell granted={key.permissions?.write} />
                    <PermissionCell granted={key.permissions?.owner} />

                    <td className="pr-4 md:pr-5 text-right">
                      <Button
                        size="sm"
                        color="ghost"
                        icon={Trash2}
                        title={`Revoke ${name}`}
                        className="hover:text-error"
                        onClick={() => onRemove(key.accessKeyId, name)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

/** Read-only state, so a check/dash reads better than a disabled checkbox. */
const PermissionCell = ({ granted }: { granted?: boolean }) => (
  <td className="text-center">
    {granted ? (
      <>
        <Check
          size={15}
          className="inline text-success"
          aria-hidden
        />
        <span className="sr-only">Granted</span>
      </>
    ) : (
      <>
        <Minus
          size={15}
          className="inline text-base-content/25"
          aria-hidden
        />
        <span className="sr-only">Not granted</span>
      </>
    )}
  </td>
);

export default PermissionsTab;
