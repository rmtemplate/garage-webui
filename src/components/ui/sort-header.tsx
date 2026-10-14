import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export type Sort<K extends string> = { key: K; dir: SortDir };

/**
 * Click-to-sort state plus the comparator, so each list only supplies a value
 * accessor per column.
 */
export const useSort = <K extends string>(initial: Sort<K>) => {
  const [sort, setSort] = useState<Sort<K>>(initial);

  /**
   * First click on a new column picks the direction that column is usually
   * read in: A→Z for text, largest-first for numbers.
   */
  const toggle = useCallback((key: K, defaultDir: SortDir = "asc") => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: defaultDir }
    );
  }, []);

  const compare = useCallback(
    (a: unknown, b: unknown) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (typeof a === "number" && typeof b === "number") return (a - b) * dir;
      return String(a ?? "").localeCompare(String(b ?? ""), undefined, {
        numeric: true,
        sensitivity: "base",
      }) * dir;
    },
    [sort.dir]
  );

  /** Sort a list by a per-column accessor map. */
  const sortBy = useCallback(
    <T,>(items: T[], accessors: Record<K, (item: T) => unknown>) =>
      [...items].sort((a, b) =>
        compare(accessors[sort.key](a), accessors[sort.key](b))
      ),
    [compare, sort.key]
  );

  return useMemo(
    () => ({ sort, setSort, toggle, sortBy }),
    [sort, toggle, sortBy]
  );
};

type Props<K extends string> = {
  label: string;
  sortKey: K;
  sort: Sort<K>;
  onSort: (key: K, defaultDir?: SortDir) => void;
  align?: "left" | "right";
  className?: string;
};

export const SortHeader = <K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
  className,
}: Props<K>) => {
  const active = sort.key === sortKey;
  const Icon = !active ? ChevronsUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      className={className}
      aria-sort={
        active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(sortKey, align === "right" ? "desc" : "asc")}
        className={cn(
          "inline-flex items-center gap-1 -mx-1 px-1 py-1 rounded transition-colors",
          "uppercase tracking-[0.06em] text-[0.6875rem] font-semibold",
          align === "right" && "flex-row-reverse",
          active
            ? "text-base-content/80"
            : "text-base-content/55 hover:text-base-content/80"
        )}
      >
        {label}
        <Icon
          size={12}
          aria-hidden
          className={cn("shrink-0", active ? "opacity-90" : "opacity-45")}
        />
      </button>
    </th>
  );
};

export default SortHeader;
