"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RouterOutputs } from "@formcraft/trpc/client";
import type { CreateFieldInput } from "@formcraft/schemas/form";
import {
  GripVertical, Plus, Trash2, Eye, Globe, Lock,
  Type, AlignLeft, Mail, Hash, ChevronDown, CheckSquare, Star, Calendar, List,
} from "lucide-react";

// Use tRPC output type so dates are serialized strings, matching what tRPC sends over the wire
type TRPCField = NonNullable<RouterOutputs["forms"]["getById"]>["fields"][number];

const FIELD_TYPES = [
  { type: "short_text", label: "Short Text", icon: Type },
  { type: "long_text", label: "Long Text", icon: AlignLeft },
  { type: "email", label: "Email", icon: Mail },
  { type: "number", label: "Number", icon: Hash },
  { type: "single_select", label: "Single Select", icon: ChevronDown },
  { type: "multi_select", label: "Multi Select", icon: List },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "rating", label: "Rating", icon: Star },
  { type: "date", label: "Date", icon: Calendar },
];

function SortableField({
  field,
  isSelected,
  onSelect,
  onDelete,
}: {
  field: TRPCField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex items-center gap-2 p-3 rounded-lg border bg-white cursor-pointer transition-all ${
        isSelected ? "border-violet-500 shadow-sm" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{field.label}</p>
        <p className="text-xs text-gray-400">{field.type.replace(/_/g, " ")}</p>
      </div>
      {field.required && <Badge variant="outline" className="text-xs border-red-200 text-red-500">Required</Badge>}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function FieldConfig({ field, onUpdate }: { field: TRPCField; onUpdate: (data: Partial<TRPCField>) => void }) {
  const validations = (field.validations ?? {}) as Record<string, unknown>;
  const options = (field.options ?? []) as Array<{ label: string; value: string }>;

  return (
    <div className="space-y-4">
      <div>
        <Label>Label</Label>
        <Input
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="mt-1 text-sm"
        />
      </div>

      {["short_text", "long_text", "email", "number"].includes(field.type) && (
        <div>
          <Label>Placeholder</Label>
          <Input
            value={field.placeholder ?? ""}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            className="mt-1 text-sm"
          />
        </div>
      )}

      <div>
        <Label>Description</Label>
        <Input
          value={field.description ?? ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="mt-1 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={field.required ?? false}
          onCheckedChange={(v) => onUpdate({ required: v })}
        />
        <Label>Required</Label>
      </div>

      {["short_text", "long_text"].includes(field.type) && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Min length</Label>
            <Input
              type="number"
              value={(validations.minLength as number) ?? ""}
              onChange={(e) =>
                onUpdate({ validations: { ...validations, minLength: parseInt(e.target.value) || undefined } })
              }
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Max length</Label>
            <Input
              type="number"
              value={(validations.maxLength as number) ?? ""}
              onChange={(e) =>
                onUpdate({ validations: { ...validations, maxLength: parseInt(e.target.value) || undefined } })
              }
              className="mt-1 text-sm"
            />
          </div>
        </div>
      )}

      {field.type === "number" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Min value</Label>
            <Input
              type="number"
              value={(validations.min as number) ?? ""}
              onChange={(e) =>
                onUpdate({ validations: { ...validations, min: parseInt(e.target.value) || undefined } })
              }
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Max value</Label>
            <Input
              type="number"
              value={(validations.max as number) ?? ""}
              onChange={(e) =>
                onUpdate({ validations: { ...validations, max: parseInt(e.target.value) || undefined } })
              }
              className="mt-1 text-sm"
            />
          </div>
        </div>
      )}

      {["single_select", "multi_select", "dropdown"].includes(field.type) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Options</Label>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => {
                const newOption = { label: `Option ${options.length + 1}`, value: `option_${options.length + 1}` };
                onUpdate({ options: [...options, newOption] });
              }}
            >
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input
                value={opt.label}
                onChange={(e) => {
                  const updated = [...options];
                  updated[i] = { ...opt, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, "_") };
                  onUpdate({ options: updated });
                }}
                className="text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 text-red-400"
                onClick={() => onUpdate({ options: options.filter((_, j) => j !== i) })}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {field.type === "rating" && (
        <div>
          <Label className="text-xs">Max rating</Label>
          <Input
            type="number"
            min={2}
            max={10}
            value={(validations.max as number) ?? 5}
            onChange={(e) =>
              onUpdate({ validations: { ...validations, max: parseInt(e.target.value) } })
            }
            className="mt-1 text-sm"
          />
        </div>
      )}
    </div>
  );
}

export default function FormBuilderPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const utils = trpc.useUtils();

  const { data: formData, isLoading } = trpc.forms.getById.useQuery({ formId });
  const updateForm = trpc.forms.update.useMutation();
  const publishForm = trpc.forms.publish.useMutation({ onSuccess: () => utils.forms.getById.invalidate({ formId }) });
  const unpublishForm = trpc.forms.unpublish.useMutation({ onSuccess: () => utils.forms.getById.invalidate({ formId }) });
  const createField = trpc.fields.create.useMutation({ onSuccess: () => utils.forms.getById.invalidate({ formId }) });
  const updateField = trpc.fields.update.useMutation();
  const deleteField = trpc.fields.delete.useMutation({ onSuccess: () => utils.forms.getById.invalidate({ formId }) });
  const reorderFields = trpc.fields.reorder.useMutation();

  const [title, setTitle] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [localFields, setLocalFields] = useState<TRPCField[]>([]);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  useEffect(() => {
    if (formData) {
      setTitle(formData.title);
      setLocalFields((formData.fields ?? []).sort((a: TRPCField, b: TRPCField) => a.order - b.order));
    }
  }, [formData]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setSaveStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus("saving");
      await updateForm.mutateAsync({ formId, title: newTitle });
      setSaveStatus("saved");
    }, 500);
  };

  const handleFieldUpdate = useCallback(
    (fieldId: string, data: Partial<TRPCField>) => {
      setLocalFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, ...data } : f)));
      setSaveStatus("unsaved");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaveStatus("saving");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateField.mutateAsync({ fieldId, ...(data as any) });
        setSaveStatus("saved");
      }, 500);
    },
    [updateField]
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const oldIndex = localFields.findIndex((f) => f.id === activeId);
    const newIndex = localFields.findIndex((f) => f.id === overId);
    const reordered = arrayMove(localFields, oldIndex, newIndex);
    setLocalFields(reordered);

    await reorderFields.mutateAsync({ formId, fieldIds: reordered.map((f) => f.id) });
  };

  const selectedField = localFields.find((f) => f.id === selectedFieldId);

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading form builder…</div>;
  }

  if (!formData) {
    return <div className="p-8 text-red-500">Form not found</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="h-14 border-b bg-white flex items-center px-4 gap-4 shrink-0">
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-sm font-semibold bg-transparent border-0 outline-none flex-1 min-w-0"
          placeholder="Form title"
        />
        <span className="text-xs text-gray-400 shrink-0">
          {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving…" : "Unsaved changes"}
        </span>
        <Separator orientation="vertical" className="h-6" />
        <Button size="sm" variant="outline" asChild>
          <a href={`/f/${formData.slug}`} target="_blank" className="flex items-center gap-1">
            <Eye className="h-3 w-3" /> Preview
          </a>
        </Button>
        {formData.isPublished ? (
          <Button
            size="sm"
            variant="outline"
            className="text-red-500 border-red-200"
            onClick={() => unpublishForm.mutate({ formId })}
          >
            <Lock className="h-3 w-3 mr-1" /> Unpublish
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => publishForm.mutate({ formId })}
          >
            <Globe className="h-3 w-3 mr-1" /> Publish
          </Button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Add fields */}
        <div className="w-52 shrink-0 border-r bg-gray-50 p-3 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Add field</p>
          <div className="space-y-1">
            {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  createField.mutate({
                    formId,
                    type: type as CreateFieldInput["type"],
                    label,
                    required: false,
                    order: localFields.length,
                  })
                }
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-white hover:shadow-sm transition-all text-gray-700"
              >
                <Icon className="h-4 w-4 text-violet-500 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Field list */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localFields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 max-w-2xl mx-auto">
                {localFields.length === 0 && (
                  <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-xl">
                    <Plus className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Add your first field from the left panel</p>
                  </div>
                )}
                {localFields.map((field) => (
                  <SortableField
                    key={field.id}
                    field={field}
                    isSelected={selectedFieldId === field.id}
                    onSelect={() => setSelectedFieldId(field.id)}
                    onDelete={() => {
                      deleteField.mutate({ fieldId: field.id });
                      if (selectedFieldId === field.id) setSelectedFieldId(null);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Right: Field config */}
        <div className="w-72 shrink-0 border-l bg-white p-4 overflow-y-auto">
          {selectedField ? (
            <>
              <h3 className="text-sm font-semibold mb-4">Field settings</h3>
              <FieldConfig
                field={selectedField}
                onUpdate={(data) => handleFieldUpdate(selectedField.id, data)}
              />
            </>
          ) : (
            <div className="text-center text-gray-400 pt-16">
              <p className="text-sm">Select a field to configure it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
