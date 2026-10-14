import Code from "@/components/ui/code";
import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import { InputField } from "@/components/ui/input";
import { useConnectNode } from "../hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConnectNodeSchema, connectNodeSchema } from "../schema";
import { useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plug } from "lucide-react";
import { useDisclosure } from "@/hooks/useDisclosure";

const ConnectNodeDialog = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const queryClient = useQueryClient();

  const form = useForm<ConnectNodeSchema>({
    resolver: zodResolver(connectNodeSchema),
    defaultValues: { nodeId: "" },
  });

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => form.setFocus("nodeId"), 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const connectNode = useConnectNode({
    onSuccess() {
      form.reset({ nodeId: "" });
      onClose();
      toast.success("Node connected", {
        description: "Assign it a role to put it into the layout.",
      });
      queryClient.invalidateQueries({ queryKey: ["status"] });
      queryClient.invalidateQueries({ queryKey: ["health"] });
    },
    onError(err: Error) {
      toast.error(err?.message || "Unknown error");
    },
  });

  const onSubmit = form.handleSubmit((values) =>
    connectNode.mutate(values.nodeId)
  );

  return (
    <>
      <Button color="primary" size="sm" icon={Plug} onClick={onOpen}>
        Connect node
      </Button>

      <Dialog
        open={isOpen}
        onClose={onClose}
        title="Connect node"
        description="Garage nodes find each other by node ID. Run the command below on the target node to read its ID."
        onSubmit={onSubmit}
        footer={
          <>
            <Button type="button" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              color="primary"
              loading={connectNode.isPending}
            >
              Connect
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="label label-text pt-0">On the target node</p>
            <Code>docker exec garage /garage node id</Code>
          </div>

          <InputField
            form={form}
            name="nodeId"
            title="Node ID"
            placeholder="2a638ed6…@10.0.0.11:3901"
            autoComplete="off"
            inputClassName="font-mono text-xs"
            hint="Paste the full value, including the @host:port suffix."
          />
        </div>
      </Dialog>
    </>
  );
};

export default ConnectNodeDialog;
