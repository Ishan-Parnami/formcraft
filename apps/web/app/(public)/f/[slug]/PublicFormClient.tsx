"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { SelectField } from "@formforge/db";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface FieldValue {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string | null;
  description?: string | null;
  options?: Array<{ label: string; value: string }> | null;
  validations?: Record<string, unknown> | null;
}

interface PublicFormClientProps {
  form: {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    settings?: Record<string, unknown> | null;
    fields: SelectField[];
  };
  theme: Record<string, unknown>;
}

function FieldRenderer({
  field,
  value,
  onChange,
  error,
  primaryColor = "#7c3aed",
  textColor = "#111827",
  accentColor = "#6b7280",
  borderRadius = 8,
}: {
  field: FieldValue;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
  primaryColor?: string;
  textColor?: string;
  accentColor?: string;
  borderRadius?: number;
}) {
  const validations = (field.validations ?? {}) as Record<string, number | string>;
  const options = (field.options ?? []) as Array<{ label: string; value: string }>;
  const maxRating = (validations.max as number) ?? 5;

  const inputStyle: React.CSSProperties = {
    borderColor: error ? "#ef4444" : primaryColor + "60",
    borderRadius,
    color: textColor,
  };

  return (
    <div className="mb-6">
      <Label className="text-base font-medium mb-1" style={{ color: textColor }}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-sm mb-2" style={{ color: accentColor }}>{field.description}</p>
      )}

      {field.type === "short_text" && (
        <Input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          className="mt-1"
          style={inputStyle}
        />
      )}

      {field.type === "long_text" && (
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          rows={4}
          className="mt-1"
          style={inputStyle}
        />
      )}

      {field.type === "email" && (
        <Input
          type="email"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? "raj@example.com"}
          className="mt-1"
          style={inputStyle}
        />
      )}

      {field.type === "number" && (
        <Input
          type="number"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          className="mt-1"
          style={inputStyle}
        />
      )}

      {field.type === "date" && (
        <Input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1"
          style={inputStyle}
        />
      )}

      {field.type === "checkbox" && (
        <div className="flex items-center gap-2 mt-2">
          <Checkbox checked={!!value} onCheckedChange={(v) => onChange(v)} />
          <span className="text-sm">{field.placeholder ?? field.label}</span>
        </div>
      )}

      {field.type === "single_select" && (
        <RadioGroup
          value={(value as string) ?? ""}
          onValueChange={onChange}
          className="mt-2 space-y-2"
        >
          {options.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <RadioGroupItem value={opt.value} id={`${field.id}-${opt.value}`} />
              <Label htmlFor={`${field.id}-${opt.value}`} className="font-normal">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {field.type === "multi_select" && (
        <div className="mt-2 space-y-2">
          {options.map((opt) => {
            const selected = ((value as string[]) ?? []).includes(opt.value);
            return (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={`${field.id}-${opt.value}`}
                  checked={selected}
                  onCheckedChange={(checked) => {
                    const current = (value as string[]) ?? [];
                    onChange(
                      checked ? [...current, opt.value] : current.filter((v) => v !== opt.value),
                    );
                  }}
                />
                <Label htmlFor={`${field.id}-${opt.value}`} className="font-normal">
                  {opt.label}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      {field.type === "dropdown" && (
        <Select value={(value as string) ?? ""} onValueChange={onChange}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "rating" && (
        <div className="flex gap-1 mt-2">
          {Array.from({ length: maxRating }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" onClick={() => onChange(n)} className="p-1">
              <Star
                className={`h-6 w-6 ${(value as number) >= n ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
              />
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function PasswordGate({ formId, onUnlock }: { formId: string; onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const verify = trpc.forms.verifyFormPassword.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        onUnlock();
      } else {
        setError("Incorrect password. Please try again.");
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm p-8 w-full max-w-sm text-center">
        <div className="text-3xl mb-3">🔒</div>
        <h2 className="text-lg font-bold mb-1">Password required</h2>
        <p className="text-sm text-gray-500 mb-5">Enter the password to access this form.</p>
        <Input
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && verify.mutate({ formId, password: pw })}
          placeholder="Password"
          className="mb-3"
        />
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
        <Button
          className="w-full bg-violet-600 hover:bg-violet-700"
          onClick={() => verify.mutate({ formId, password: pw })}
          disabled={verify.isPending || !pw}
        >
          {verify.isPending ? "Checking…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

export default function PublicFormClient({ form, theme }: PublicFormClientProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [startTime] = useState(() => Date.now());
  const [unlocked, setUnlocked] = useState(false);

  const settings = (form.settings ?? {}) as Record<string, unknown>;

  const submitResponse = trpc.responses.submit.useMutation({
    onSuccess: () => {
      const redirectUrl = settings.redirectUrl as string | undefined;
      if (redirectUrl?.startsWith("http")) {
        window.location.href = redirectUrl;
      } else {
        router.push(`/f/${form.slug}/success`);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of form.fields) {
      const val = answers[field.id];
      if (
        field.required &&
        (val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0))
      ) {
        newErrors[field.id] = "This field is required";
      }
      if (field.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) {
        newErrors[field.id] = "Please enter a valid email address";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const completionTime = Math.round((Date.now() - startTime) / 1000);
    submitResponse.mutate({
      formId: form.id,
      answers,
      completionTime,
    });
  };

  if (settings.requirePassword && !unlocked) {
    return <PasswordGate formId={form.id} onUnlock={() => setUnlocked(true)} />;
  }

  const bgColor = (theme.bgColor as string) ?? "#ffffff";
  const primaryColor = (theme.primaryColor as string) ?? "#7c3aed";
  const textColor = (theme.textColor as string) ?? "#111827";
  const accentColor = (theme.accentColor as string) ?? "#6b7280";
  const borderRadius = (theme.borderRadius as number) ?? 8;
  const fontFamily = (theme.fontFamily as string) ?? "Inter, sans-serif";
  const buttonStyle = (theme.buttonStyle as string) ?? "filled";

  const submitBtnStyle: React.CSSProperties =
    buttonStyle === "filled"
      ? { backgroundColor: primaryColor, borderColor: primaryColor, color: "#fff", borderRadius }
      : buttonStyle === "outline"
        ? { backgroundColor: "transparent", borderColor: primaryColor, color: primaryColor, borderRadius }
        : { backgroundColor: "transparent", borderColor: "transparent", color: primaryColor, borderRadius };

  return (
    <div style={{ backgroundColor: bgColor, color: textColor, fontFamily, minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: textColor }}>
            {form.title}
          </h1>
          {form.description && (
            <p style={{ color: accentColor }}>{form.description}</p>
          )}
        </div>

        <div className="shadow-sm p-8" style={{ backgroundColor: bgColor, borderRadius, color: textColor, fontFamily, border: `1px solid ${primaryColor}20` }}>
          {form.fields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={{
                id: field.id,
                label: field.label,
                type: field.type,
                required: field.required ?? false,
                placeholder: field.placeholder,
                description: field.description,
                options: field.options as Array<{ label: string; value: string }> | null,
                validations: field.validations as Record<string, unknown> | null,
              }}
              value={answers[field.id]}
              onChange={(v) => setAnswers((prev) => ({ ...prev, [field.id]: v }))}
              error={errors[field.id]}
              primaryColor={primaryColor}
              textColor={textColor}
              accentColor={accentColor}
              borderRadius={borderRadius}
            />
          ))}

          <Button
            onClick={handleSubmit}
            disabled={submitResponse.isPending}
            style={submitBtnStyle}
            className="mt-4 w-full border"
          >
            {submitResponse.isPending
              ? "Submitting…"
              : ((settings.submitButtonText as string) ?? "Submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
