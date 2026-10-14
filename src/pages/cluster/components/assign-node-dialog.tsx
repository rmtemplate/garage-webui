import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import Input from "@/components/ui/input";
import Toggle from "@/components/ui/toggle";
import { useAssignNode, useClusterLayout, useClusterStatus } from "../hooks";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AssignNodeSchema,
  assignNodeSchema,
  capacityUnits,
  calculateCapacity,
  parseCapacity,
} from "../schema";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { assignNodeDialog } from "../stores";
import FormControl from "@/components/ui/form-control";
import Select from "@/components/ui/select";
import CopyButton from "@/components/ui/copy-button";

const defaultValues: AssignNodeSchema = {
  nodeId: "",
  zone: "",
  capacity: 1,
  capacityUnit: "GB",
  isGateway: false,
  tags: [],
};

const AssignNodeDialog = () => {
  const { isOpen, data } = assignNodeDialog.use();
  const { data: cluster } = useClusterStatus();
  const { data: layout } = useClusterLayout();
  const queryClient = useQueryClient();

  const form = useForm<AssignNodeSchema>({
    resolver: zodResolver(assignNodeSchema),
    defaultValues,
  });
  const isGateway = useWatch({ control: form.control, name: "isGateway" });

  const assignNode = useAssignNode({
    onSuccess() {
      form.reset();
      toast.success("Role staged", {
        description: "Apply the layout on the Nodes table to commit it.",
      });
      queryClient.invalidateQueries({ queryKey: ["status"] });
      queryClient.invalidateQueries({ queryKey: ["layout"] });
      assignNodeDialog.close();
    },
    onError(err: Error) {
      toast.error(err?.message || "Unknown error");
    },
  });

  useEffect(() => {
    if (!data) return;

    const cap = parseCapacity(data.capacity);
    // A node with no role yet arrives with undefined capacity/tags. Spreading
    // those straight in would seed the form with capacity 0 and tags
    // undefined — both of which fail validation before the user types
    // anything — so fall back to the defaults field by field.
    form.reset({
      nodeId: data.nodeId ?? "",
      zone: data.zone ?? "",
      capacity: cap.value || defaultValues.capacity,
      capacityUnit: cap.unit || defaultValues.capacityUnit,
      isGateway: data.capacity === null,
      tags: data.tags ?? [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  /** Zones and tags already used elsewhere, offered as suggestions. */
  const { zoneList, tagsList } = useMemo(() => {
    const nodes = cluster?.nodes || cluster?.knownNodes || [];
    const roleOf = (id: string) =>
      layout?.stagedRoleChanges.find((r) => r.id === id) ||
      layout?.roles.find((r) => r.id === id);

    const zones = new Set<string>();
    const tags = new Set<string>();

    for (const node of nodes) {
      const role = roleOf(node.id);
      const zone = role?.zone || node.role?.zone;
      if (zone) zones.add(zone);
      for (const tag of role?.tags || node.role?.tags || []) tags.add(tag);
    }

    const toOption = (v: string) => ({ label: v, value: v });
    return {
      zoneList: [...zones].map(toOption),
      tagsList: [...tags].map(toOption),
    };
  }, [cluster, layout]);

  const onSubmit = form.handleSubmit(
    (values) => {
      assignNode.mutate({
        id: values.nodeId,
        zone: values.zone,
        capacity: values.isGateway
          ? null
          : calculateCapacity(values.capacity, values.capacityUnit),
        tags: values.tags,
      });
    },
    // Without this a failed validation on a field that is scrolled out of
    // view (or has no visible control, like tags) looks like a dead button.
    (errors) => {
      const first = Object.values(errors)[0];
      toast.error(
        (first?.message as string) || "Please correct the highlighted fields"
      );
    }
  );

  const nodeId = form.watch("nodeId");

  return (
    <Dialog
      open={isOpen}
      onClose={assignNodeDialog.close}
      title="Assign node role"
      description="Roles are staged first. Apply the layout when you are happy with every pending change."
      onSubmit={onSubmit}
      footer={
        <>
          <Button type="button" size="sm" onClick={assignNodeDialog.close}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            color="primary"
            loading={assignNode.isPending}
          >
            Stage role
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="form-control">
          <label htmlFor="assign-node-id" className="label label-text pt-0">
            Node ID
          </label>
          <Input
            id="assign-node-id"
            readOnly
            className="font-mono text-xs bg-base-200"
            suffix={
              nodeId ? (
                <CopyButton value={nodeId} size="xs" label="Copy node ID" />
              ) : null
            }
            {...form.register("nodeId")}
          />
        </div>

        <FormControl
          form={form}
          name="zone"
          title="Zone"
          hint="Garage spreads replicas across zones — use one per failure domain (rack, datacentre, region)."
          render={(field) => (
            <Select
              creatable
              inputId={(field as any).id}
              {...field}
              value={field.value ? { label: field.value, value: field.value } : null}
              options={zoneList}
              placeholder="dc1"
              onChange={(option: any) => field.onChange(option?.value ?? "")}
            />
          )}
        />

        <Controller
          control={form.control}
          name="isGateway"
          render={({ field }) => (
            <Toggle
              {...field}
              value={undefined}
              checked={!!field.value}
              color={field.value ? "primary" : undefined}
              onChange={(e) => field.onChange(e.target.checked)}
              label="Gateway node"
              description="Routes requests but stores no data. Gateways have no capacity."
            />
          )}
        />

        {!isGateway ? (
          <div className="grid grid-cols-[1fr_7rem] gap-3 items-start">
            <FormControl
              form={form}
              name="capacity"
              title="Capacity"
              render={(field) => (
                <Input type="number" min={1} {...(field as any)} />
              )}
            />
            <FormControl
              form={form}
              name="capacityUnit"
              title="Unit"
              render={(field) => (
                <select
                  {...(field as any)}
                  className="select select-bordered w-full h-[var(--ctl-h-lg)] min-h-0 text-sm font-normal"
                >
                  {capacityUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        ) : null}

        <FormControl
          form={form}
          name="tags"
          title="Tags"
          hint="Optional labels, e.g. ssd or bulk."
          render={(field) => (
            <Select
              creatable
              isMulti
              inputId={(field as any).id}
              {...field}
              value={((field.value as string[]) || []).map((value) => ({
                label: value,
                value,
              }))}
              options={tagsList}
              placeholder="Add tags…"
              onChange={(values) =>
                field.onChange(
                  Array.isArray(values) ? values.map((v: any) => v.value) : []
                )
              }
            />
          )}
        />
      </div>
    </Dialog>
  );
};

export default AssignNodeDialog;
