import Button from "@/components/ui/button";
import confirm from "@/components/ui/confirm";
import { EllipsisVertical, Trash2 } from "lucide-react";
import { Dropdown } from "react-daisyui";
import { useNavigate } from "react-router-dom";
import { useBucket, useRemoveBucket } from "../hooks";
import { toast } from "sonner";
import { handleError } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  bucketId: string;
  bucketName: string;
};

/**
 * Rendered into the page header, which lives in MainLayout — outside this
 * route's BucketContext.Provider. So it takes its identity as props and reads
 * live bucket data from the query cache rather than from context.
 */
const MenuButton = ({ bucketId, bucketName }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: bucket } = useBucket(bucketId);

  const removeBucket = useRemoveBucket({
    onSuccess: () => {
      toast.success("Bucket deleted", { description: bucketName });
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
      navigate("/buckets", { replace: true });
    },
    onError: handleError,
  });

  const onRemove = async () => {
    const objects = bucket?.objects ?? 0;

    const ok = await confirm({
      title: "Delete bucket?",
      danger: true,
      confirmText: "Delete bucket",
      confirmWord: bucketName,
      description: (
        <>
          Deleting{" "}
          <strong className="font-medium text-base-content">
            {bucketName}
          </strong>{" "}
          removes its aliases and every key grant on it.
          {objects > 0 ? (
            <>
              {" "}
              It still holds{" "}
              <strong className="font-medium text-base-content">
                {objects.toLocaleString()} object{objects === 1 ? "" : "s"}
              </strong>
              , and Garage will refuse to delete a bucket that is not empty.
            </>
          ) : null}{" "}
          This cannot be undone.
        </>
      ),
    });
    if (ok) removeBucket.mutate(bucketId);
  };

  return (
    <Dropdown end>
      <Dropdown.Toggle button={false}>
        <Button
          icon={EllipsisVertical}
          size="sm"
          color="ghost"
          title="Bucket actions"
        />
      </Dropdown.Toggle>

      <Dropdown.Menu className="panel min-w-44">
        <Dropdown.Item
          onClick={onRemove}
          className="text-error hover:bg-error/10"
        >
          <Trash2 size={15} /> Delete bucket
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default MenuButton;
