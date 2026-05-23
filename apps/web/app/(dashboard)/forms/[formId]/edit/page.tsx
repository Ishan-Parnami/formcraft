"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RouterOutputs } from "@formforge/trpc/client";
import type { CreateFieldInput, UpdateFieldInput, FieldValidations, FieldOption } from "@formforge/schemas/form";
import { ComingSoonBadge } from "~/components/ui/coming-soon-badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/ui/tooltip";
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Trash2,
  Eye,
  Globe,
  Lock,
  Type,
  AlignLeft,
  Mail,
  Hash,
  ChevronDown,
  CheckSquare,
  Star,
  Calendar,
  List,
  Palette,
} from "lucide-react";
type TRPCField = NonNullable<RouterOutputs["forms"]["getById"]>["fields"][number];
type SaveStatus = "saved" | "saving" | "unsaved" | "error";

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

const SAVE_STATUS_CLASSES: Record<SaveStatus, string> = {
  saved: "text-gray-400",
  saving: "text-blue-500",
  unsaved: "text-amber-500",
  error: "text-red-500",
};

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  saved: "Saved",
  saving: "Saving…",
  unsaved: "Unsaved changes",
  error: "Save failed",
};

// Per-key debounced auto-save — each key (title, field:<id>) has its own timer
// so rapid edits to different things never cancel each other.
function useAutoSave() {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const timers = useRef(new Map<string, NodeJS.Timeout>());
  const inFlight = useRef(0);

  const schedule = useCallback((key: string, fn: () => Promise<unknown>) => {
    setSaveStatus("unsaved");
    const prev = timers.current.get(key);
    if (prev) clearTimeout(prev);
    timers.current.set(
      key,
      setTimeout(async () => {
        timers.current.delete(key);
        inFlight.current++;
        setSaveStatus("saving");
        try {
          await fn();
        } catch {
          setSaveStatus("error");
        } finally {
          inFlight.current--;
          // Only move to "saved" if there was no error (error state persists)
          if (inFlight.current === 0) {
            setSaveStatus((prev) => (prev === "saving" ? "saved" : prev));
          }
        }
      }, 500),
    );
  }, []);

  return { saveStatus, schedule };
}

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
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
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
      {field.required && (
        <Badge variant="outline" className="text-xs border-red-200 text-red-500">
          Required
        </Badge>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-gray-300 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || undefined)}
        className="mt-1 text-sm"
      />
    </div>
  );
}

function FieldConfig({
  field,
  onUpdate,
}: {
  field: TRPCField;
  onUpdate: (data: UpdateFieldInput) => void;
}) {
  const validations = (field.validations ?? {}) as FieldValidations;
  const options = (field.options ?? []) as FieldOption[];

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
          <NumberInput
            label="Min length"
            value={(validations.minLength as number) ?? ""}
            onChange={(v) => onUpdate({ validations: { ...validations, minLength: v } })}
          />
          <NumberInput
            label="Max length"
            value={(validations.maxLength as number) ?? ""}
            onChange={(v) => onUpdate({ validations: { ...validations, maxLength: v } })}
          />
        </div>
      )}

      {field.type === "number" && (
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Min value"
            value={(validations.min as number) ?? ""}
            onChange={(v) => onUpdate({ validations: { ...validations, min: v } })}
          />
          <NumberInput
            label="Max value"
            value={(validations.max as number) ?? ""}
            onChange={(v) => onUpdate({ validations: { ...validations, max: v } })}
          />
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
              onClick={() =>
                onUpdate({
                  options: [
                    ...options,
                    {
                      label: `Option ${options.length + 1}`,
                      value: `option_${options.length + 1}`,
                    },
                  ],
                })
              }
            >
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input
                value={opt.label}
                onChange={(e) => {
                  const updated = options.map((o, j) =>
                    j === i
                      ? {
                          label: e.target.value,
                          value: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                        }
                      : o,
                  );
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

      {/* Conditional Logic — coming soon */}
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-400">Conditional Logic</span>
          <ComingSoonBadge />
        </div>
      </div>
    </div>
  );
}

export default function FormBuilderPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const utils = trpc.useUtils();
  const { saveStatus, schedule } = useAutoSave();

  const { data: formData, isLoading } = trpc.forms.getById.useQuery({ formId });
  const updateForm = trpc.forms.update.useMutation();
  const publishForm = trpc.forms.publish.useMutation({
    onSuccess: () => utils.forms.getById.invalidate({ formId }),
  });
  const unpublishForm = trpc.forms.unpublish.useMutation({
    onSuccess: () => utils.forms.getById.invalidate({ formId }),
  });
  const createField = trpc.fields.create.useMutation({
    onSuccess: () => utils.forms.getById.invalidate({ formId }),
  });
  const updateField = trpc.fields.update.useMutation();
  const deleteField = trpc.fields.delete.useMutation({
    onSuccess: () => utils.forms.getById.invalidate({ formId }),
  });
  const reorderFields = trpc.fields.reorder.useMutation();

  const [title, setTitle] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [localFields, setLocalFields] = useState<TRPCField[]>([]);
  const [mobilePanel, setMobilePanel] = useState<"add" | "fields" | "config">("fields");

  useEffect(() => {
    if (formData) {
      setTitle(formData.title);
      setLocalFields([...formData.fields].sort((a, b) => a.order - b.order));
    }
  }, [formData]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    schedule("title", () => updateForm.mutateAsync({ formId, title: newTitle }));
  };

  const handleFieldUpdate = useCallback(
    (fieldId: string, data: UpdateFieldInput) => {
      setLocalFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, ...data } : f)));
      schedule(`field:${fieldId}`, () => updateField.mutateAsync({ fieldId, ...data }));
    },
    [updateField, schedule],
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localFields.findIndex((f) => f.id === String(active.id));
    const newIndex = localFields.findIndex((f) => f.id === String(over.id));
    const reordered = arrayMove(localFields, oldIndex, newIndex);
    setLocalFields(reordered);
    await reorderFields.mutateAsync({ formId, fieldIds: reordered.map((f) => f.id) });
  };

  const selectedField = localFields.find((f) => f.id === selectedFieldId);
  const canPublish = localFields.length > 0 && saveStatus === "saved";

  if (isLoading) return <div className="p-8 text-gray-500">Loading form builder…</div>;
  if (!formData) return <div className="p-8 text-red-500">Form not found</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="h-14 border-b bg-white flex items-center px-4 gap-2 shrink-0 overflow-x-auto">
        <Link href={`/forms/${formId}`}>
          <Button size="sm" variant="ghost" className="gap-1 shrink-0">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
        </Link>
        {/* <Separator orientation="vertical" className="h-6 shrink-0" /> */}
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-sm font-semibold bg-transparent border-0 outline-none flex-1 min-w-0"
          placeholder="Form title"
        />
        <span className={`text-xs shrink-0 ${SAVE_STATUS_CLASSES[saveStatus]}`}>
          {SAVE_STATUS_LABELS[saveStatus]}
        </span>
        <Separator orientation="vertical" className="h-6" />
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="shrink-0">
              <Button size="sm" variant="ghost" disabled className="gap-1 cursor-not-allowed opacity-60 pointer-events-none">
                <Palette className="h-3 w-3" /> Theme
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="h-6" />
        <Button
          size="sm"
          variant="outline"
          disabled={!formData.isPublished || saveStatus !== "saved"}
          title={
            saveStatus !== "saved"
              ? "Save your changes before previewing"
              : !formData.isPublished
                ? "Publish the form before previewing"
                : undefined
          }
          onClick={() => window.open(`/f/${formData.slug}`, "_blank")}
        >
          <Eye className="h-3 w-3" /> Preview
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
            disabled={!canPublish}
            title={
              localFields.length === 0
                ? "Add at least one field before publishing"
                : saveStatus !== "saved"
                  ? "Save your changes before publishing"
                  : undefined
            }
            onClick={() => publishForm.mutate({ formId })}
          >
            <Globe className="h-3 w-3 mr-1" /> Publish
          </Button>
        )}
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b bg-white shrink-0">
        {(["add", "fields", "config"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobilePanel(tab)}
            className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              mobilePanel === tab
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "add" ? "Add Field" : tab === "fields" ? "Fields" : "Configure"}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Add fields */}
        <div
          className={`${mobilePanel === "add" ? "block" : "hidden"} md:block w-full md:w-52 shrink-0 border-r bg-gray-50 p-3 overflow-y-auto`}
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Add field
          </p>
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
        <div
          className={`${mobilePanel === "fields" ? "block" : "hidden"} md:block flex-1 overflow-y-auto p-6 bg-gray-50`}
        >
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
                    onSelect={() => {
                      setSelectedFieldId(field.id);
                      setMobilePanel("config");
                    }}
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
        <div
          className={`${mobilePanel === "config" ? "block" : "hidden"} md:block w-full md:w-72 shrink-0 border-l bg-white p-4 overflow-y-auto`}
        >
          {selectedField ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setMobilePanel("fields")}
                  className="md:hidden text-xs text-violet-600 hover:underline"
                >
                  ← Back
                </button>
                <h3 className="text-sm font-semibold">Field settings</h3>
              </div>
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
