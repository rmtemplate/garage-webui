import api from "@/lib/api";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
} from "@tanstack/react-query";
import {
  GetObjectsResult,
  PutObjectPayload,
  UseBrowserObjectOptions,
} from "./types";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export const useBrowseObjects = (
  bucket: string,
  options?: UseBrowserObjectOptions
) => {
  return useQuery({
    queryKey: ["browse", bucket, options],
    queryFn: () =>
      api.get<GetObjectsResult>(`/browse/${bucket}`, { params: options }),
  });
};

export const usePutObject = (
  bucket: string,
  options?: UseMutationOptions<any, Error, PutObjectPayload>
) => {
  return useMutation({
    mutationFn: async (body) => {
      const formData = new FormData();
      if (body.file) {
        formData.append("file", body.file);
      }

      return api.put(`/browse/${bucket}/${body.key}`, { body: formData });
    },
    ...options,
  });
};

export const useDeleteObject = (
  bucket: string,
  options?: UseMutationOptions<any, Error, { key: string; recursive?: boolean }>
) => {
  return useMutation({
    mutationFn: (data) =>
      api.delete(`/browse/${bucket}/${data.key}`, {
        params: { recursive: data.recursive },
      }),
    ...options,
  });
};

/**
 * Folder navigation for the browser.
 *
 * Keeps two separate things apart, which the previous implementation
 * conflated: the *path* you are at (which drives the breadcrumb) and the
 * *history* of where you have been (which drives back/forward).
 */
export const useBrowseNavigation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const prefix = searchParams.get("prefix") || "";

  const [history, setHistory] = useState<string[]>([prefix]);
  const [index, setIndex] = useState(0);

  const commit = useCallback(
    (next: string) => {
      setSearchParams(
        (params) => {
          if (next) params.set("prefix", next);
          else params.delete("prefix");
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  /** Navigate into a folder: truncates any forward history, like a browser. */
  const goTo = useCallback(
    (next: string) => {
      setHistory((prev) => [...prev.slice(0, index + 1), next]);
      setIndex((i) => i + 1);
      commit(next);
    },
    [commit, index]
  );

  const goBack = useCallback(() => {
    if (index <= 0) return;
    setIndex(index - 1);
    commit(history[index - 1]);
  }, [commit, history, index]);

  const goForward = useCallback(() => {
    if (index >= history.length - 1) return;
    setIndex(index + 1);
    commit(history[index + 1]);
  }, [commit, history, index]);

  /** One crumb per path segment, each with the prefix it navigates to. */
  const crumbs = useMemo(() => {
    const parts = prefix.split("/").filter(Boolean);
    return parts.map((label, i) => ({
      label,
      prefix: parts.slice(0, i + 1).join("/") + "/",
    }));
  }, [prefix]);

  return {
    prefix,
    crumbs,
    goTo,
    goBack,
    goForward,
    canGoBack: index > 0,
    canGoForward: index < history.length - 1,
    /** Up one level; no-op at the root. */
    goUp: () => goTo(crumbs.length > 1 ? crumbs[crumbs.length - 2].prefix : ""),
  };
};
