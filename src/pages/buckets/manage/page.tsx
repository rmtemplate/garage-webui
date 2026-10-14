import { useParams } from "react-router-dom";
import { useBucket } from "./hooks";
import Page from "@/context/page-context";
import TabView, { Tab } from "@/components/containers/tab-view";
import { ChartLine, FolderSearch, LockKeyhole } from "lucide-react";
import OverviewTab from "./overview/overview-tab";
import PermissionsTab from "./permissions/permissions-tab";
import MenuButton from "./components/menu-button";
import BrowseTab from "./browse/browse-tab";
import { BucketContext } from "./context";
import { ErrorState, LoadingBlock } from "@/components/ui/states";

const tabs: Tab[] = [
  {
    name: "overview",
    title: "Overview",
    icon: ChartLine,
    Component: OverviewTab,
  },
  {
    name: "permissions",
    title: "Permissions",
    icon: LockKeyhole,
    Component: PermissionsTab,
  },
  {
    name: "browse",
    title: "Browse",
    icon: FolderSearch,
    Component: BrowseTab,
  },
];

const ManageBucketPage = () => {
  const { id } = useParams();
  const { data, error, isLoading, refetch } = useBucket(id);

  const name = data?.globalAliases[0];

  return (
    <div className="page-container">
      <Page
        title={name || (isLoading ? "Loading…" : "Bucket")}
        breadcrumbs={[{ label: "Buckets", to: "/buckets" }, { label: name || "…" }]}
        prev="/buckets"
        actions={
          data ? <MenuButton bucketId={data.id} bucketName={name || ""} /> : undefined
        }
      />

      {isLoading ? <LoadingBlock label="Loading bucket…" /> : null}

      {error ? (
        <div className="surface">
          <ErrorState
            title="Could not load this bucket"
            error={error}
            onRetry={() => refetch()}
          />
        </div>
      ) : null}

      {data ? (
        <BucketContext.Provider
          value={{ bucket: data, refetch, bucketName: name || "" }}
        >
          <TabView tabs={tabs} />
        </BucketContext.Provider>
      ) : null}
    </div>
  );
};

export default ManageBucketPage;
