import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number; // 1-based
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Noun for the row count, e.g. "bucket" → "12 buckets". */
  unit?: string;
};

const Pagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  className,
  unit = "item",
}: Props) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-row items-center justify-between gap-3 px-4 md:px-5 py-3 border-t border-base-300",
        className
      )}
    >
      <p className="text-xs muted tnum">
        {total === 0 ? (
          <>No {unit}s</>
        ) : (
          <>
            <span className="font-medium text-base-content/80">
              {from}–{to}
            </span>{" "}
            of {total} {unit}
            {total === 1 ? "" : "s"}
          </>
        )}
      </p>

      {pages > 1 ? (
        <div className="flex flex-row items-center gap-1">
          <button
            type="button"
            className="btn btn-sm btn-ghost btn-circle"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs muted tnum px-1.5" aria-current="page">
            {page} / {pages}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-ghost btn-circle"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      ) : null}
    </nav>
  );
};

export default Pagination;
