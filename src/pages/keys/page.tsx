import Button from "@/components/ui/button";
import Page from "@/context/page-context";
import { Eye, EyeOff, KeySquare, SearchX, Trash2 } from "lucide-react";
import { useKeys, useRemoveKey } from "./hooks";
import CreateKeyDialog from "./components/create-key-dialog";
import { toast } from "sonner";
import { handleError } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";
import api from "@/lib/api";
import Card from "@/components/ui/card";
import CopyButton from "@/components/ui/copy-button";
import confirm from "@/components/ui/confirm";
import { SearchInput, Toolbar, ToolbarSpacer } from "@/components/ui/toolbar";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { useBuckets } from "../buckets/hooks";
import { Badge } from "@/components/ui/badge";

const KeysPage = () => {
  const { data, isLoading, error, refetch } = useKeys();
  const { data: buckets } = useBuckets();
  const [search, setSearch] = useState("");
  const [secretKeys, setSecretKeys] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string | null>(null);

  const removeKey = useRemoveKey({
    onSuccess: () => {
      refetch();
      toast.success("Access key revoked");
    },
    onError: handleError,
  });

  const fetchSecretKey = useCallback(async (id: string) => {
    setRevealing(id);
    try {
      const result = await api.get("/v2/GetKeyInfo", {
        params: { id, showSecretKey: "true" },
      });
      if (!result?.secretAccessKey) {
        throw new Error("The server did not return a secret key");
      }
      setSecretKeys((prev) => ({ ...prev, [id]: result.secretAccessKey }));
    } catch (err) {
      handleError(err);
    } finally {
      setRevealing(null);
    }
  }, []);

  const hide = (id: string) =>
    setSecretKeys(({ [id]: _removed, ...rest }) => rest);

  const onRemove = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Revoke access key?",
      danger: true,
      confirmText: "Revoke key",
      confirmWord: name,
      description: (
        <>
          <strong className="font-medium text-base-content">{name}</strong> will
          immediately lose access to every bucket it is allowed on. Any client
          still using this key will start receiving authentication errors. This
          cannot be undone.
        </>
      ),
    });
    if (ok) removeKey.mutate(id);
  };

  /** Bucket grants per key — the thing you actually need before revoking one. */
  const grants = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const bucket of buckets || []) {
      for (const key of bucket.keys || []) {
        const { read, write, owner } = key.permissions;
        if (!read && !write && !owner) continue;
        (map[key.accessKeyId] ||= []).push(
          bucket.globalAliases[0] || bucket.id
        );
      }
    }
    return map;
  }, [buckets]);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = data || [];
    if (!q) return list;
    return list.filter(
      (item) =>
        item.id.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <div className="page-container flex flex-col gap-4 md:gap-5">
      <Page
        title="Access keys"
        description="S3 credentials used by clients and services"
        actions={<CreateKeyDialog />}
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or key ID…"
          aria-label="Search access keys"
        />
        <ToolbarSpacer />
        {!isLoading && !error ? (
          <p className="text-xs muted tnum hidden sm:block">
            {items.length} of {data?.length ?? 0} keys
          </p>
        ) : null}
      </Toolbar>

      <Card padded={false}>
        {error ? (
          <ErrorState
            title="Could not load access keys"
            error={error}
            onRetry={() => refetch()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-row-hover min-w-[52rem]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Access key ID</th>
                  <th>Secret access key</th>
                  <th>Buckets</th>
                  <th className="w-0" />
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <SkeletonRows rows={5} cols={5} />
                ) : (
                  items.map((key) => {
                    const secret = secretKeys[key.id];
                    const allowed = grants[key.id] || [];

                    return (
                      <tr key={key.id}>
                        <td>
                          <div className="flex flex-row items-center gap-3">
                            <span
                              aria-hidden
                              className="grid place-items-center size-8 shrink-0 rounded-btn bg-base-200 border border-base-300"
                            >
                              <KeySquare
                                size={15}
                                className="text-base-content/50"
                              />
                            </span>
                            <span className="font-medium truncate">
                              {key.name || "Unnamed key"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="flex flex-row items-center gap-1">
                            <code
                              className="font-mono text-xs truncate max-w-[12rem] text-base-content/80"
                              title={key.id}
                            >
                              {key.id}
                            </code>
                            <CopyButton
                              value={key.id}
                              size="xs"
                              label="Copy access key ID"
                            />
                          </div>
                        </td>

                        <td>
                          {!secret ? (
                            <Button
                              size="sm"
                              icon={revealing === key.id ? undefined : Eye}
                              loading={revealing === key.id}
                              onClick={() => fetchSecretKey(key.id)}
                            >
                              Reveal
                            </Button>
                          ) : (
                            <div className="flex flex-row items-center gap-1">
                              <code
                                className="font-mono text-xs truncate max-w-[12rem] text-base-content/80"
                                title={secret}
                              >
                                {secret}
                              </code>
                              <CopyButton
                                value={secret}
                                size="xs"
                                label="Copy secret access key"
                              />
                              <button
                                type="button"
                                onClick={() => hide(key.id)}
                                title="Hide secret"
                                aria-label="Hide secret"
                                className="grid place-items-center size-6 rounded-md shrink-0
                                           text-base-content/45 hover:text-base-content
                                           hover:bg-base-content/[0.07] transition-colors"
                              >
                                <EyeOff size={12} />
                              </button>
                            </div>
                          )}
                        </td>

                        <td>
                          {allowed.length === 0 ? (
                            <span className="text-xs muted">No access</span>
                          ) : (
                            <div className="flex flex-row flex-wrap items-center gap-1">
                              {allowed.slice(0, 2).map((name) => (
                                <Badge key={name} tone="neutral">
                                  {name}
                                </Badge>
                              ))}
                              {allowed.length > 2 ? (
                                <span
                                  className="text-xs muted"
                                  title={allowed.join(", ")}
                                >
                                  +{allowed.length - 2}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </td>

                        <td className="pr-4 md:pr-5 text-right">
                          <Button
                            size="sm"
                            color="ghost"
                            icon={Trash2}
                            title={`Revoke ${key.name}`}
                            className="hover:text-error"
                            onClick={() => onRemove(key.id, key.name)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {!isLoading && items.length === 0 ? (
              search ? (
                <EmptyState
                  icon={SearchX}
                  title="No keys match your search"
                  description={`Nothing matched “${search}”.`}
                  action={
                    <Button size="sm" onClick={() => setSearch("")}>
                      Clear search
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={KeySquare}
                  title="No access keys yet"
                  description="Create a key to let an application read from or write to your buckets over S3."
                  action={<CreateKeyDialog />}
                />
              )
            ) : null}
          </div>
        )}
      </Card>

      <p className="text-xs muted px-1">
        Secret keys are only fetched from the server when you choose to reveal
        one, and are never stored in your browser.
      </p>
    </div>
  );
};

export default KeysPage;
