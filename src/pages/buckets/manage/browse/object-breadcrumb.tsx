import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  CornerLeftUp,
  Database,
} from "lucide-react";
import { Fragment } from "react";
import type { useBrowseNavigation } from "./hooks";

type Props = {
  nav: ReturnType<typeof useBrowseNavigation>;
  bucketName: string;
};

/**
 * Path bar: back / forward / up, then the folder path itself.
 *
 * The crumbs track the current *path*, not the navigation history, so the
 * trail always reads as the folder you are actually in.
 */
const ObjectBreadcrumb = ({ nav, bucketName }: Props) => {
  const atRoot = nav.crumbs.length === 0;

  return (
    <div className="flex flex-row items-center gap-1 px-2 md:px-3 py-2 border-b border-base-300">
      <Button
        icon={ChevronLeft}
        size="sm"
        color="ghost"
        title="Back"
        disabled={!nav.canGoBack}
        onClick={nav.goBack}
      />
      <Button
        icon={ChevronRight}
        size="sm"
        color="ghost"
        title="Forward"
        disabled={!nav.canGoForward}
        onClick={nav.goForward}
      />
      <Button
        icon={CornerLeftUp}
        size="sm"
        color="ghost"
        title="Up one level"
        disabled={atRoot}
        onClick={nav.goUp}
      />

      <nav
        aria-label="Folder path"
        className="flex-1 min-w-0 flex flex-row items-center gap-0.5
                   overflow-x-auto ml-1 pl-2 border-l border-base-300"
      >
        <Crumb
          label={bucketName}
          icon={Database}
          isActive={atRoot}
          onClick={() => nav.goTo("")}
        />

        {nav.crumbs.map((crumb, i) => (
          <Fragment key={crumb.prefix}>
            <ChevronRight
              size={13}
              aria-hidden
              className="shrink-0 text-base-content/30"
            />
            <Crumb
              label={crumb.label}
              isActive={i === nav.crumbs.length - 1}
              onClick={() => nav.goTo(crumb.prefix)}
            />
          </Fragment>
        ))}
      </nav>
    </div>
  );
};

const Crumb = ({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon?: typeof Database;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={isActive ? "location" : undefined}
    title={label}
    className={cn(
      "inline-flex items-center gap-1.5 shrink-0 h-7 px-2 rounded-btn",
      "text-[0.8125rem] max-w-[12rem] transition-colors duration-150",
      isActive
        ? "font-medium text-base-content bg-base-content/[0.06]"
        : "text-base-content/60 hover:text-base-content hover:bg-base-content/[0.05]"
    )}
  >
    {Icon ? <Icon size={14} className="shrink-0" aria-hidden /> : null}
    <span className="truncate">{label}</span>
  </button>
);

export default ObjectBreadcrumb;
