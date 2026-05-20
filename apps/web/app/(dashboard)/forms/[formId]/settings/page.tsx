"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Card, CardContent } from "~/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function FormSettingsPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const { data: formData } = trpc.forms.getById.useQuery({ formId });
  const updateForm = trpc.forms.update.useMutation({
    onSuccess: () => toast.success("Settings saved"),
    onError: () => toast.error("Failed to save settings"),
  });
  const deleteForm = trpc.forms.delete.useMutation({
    onSuccess: () => { window.location.href = "/forms"; },
  });

  const settings = (formData?.settings ?? {}) as Record<string, unknown>;

  if (!formData) return <div className="p-8 text-gray-500">Loading…</div>;

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/forms/${formId}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
        <h1 className="text-2xl font-bold">Form Settings</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="font-semibold text-sm">Submission</h2>
            <div>
              <Label>Submit button text</Label>
              <Input
                defaultValue={(settings.submitButtonText as string) ?? "Submit"}
                onBlur={(e) =>
                  updateForm.mutate({ formId, settings: { ...settings, submitButtonText: e.target.value } })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Success message</Label>
              <Input
                defaultValue={(settings.successMessage as string) ?? "Thank you for your response!"}
                onBlur={(e) =>
                  updateForm.mutate({ formId, settings: { ...settings, successMessage: e.target.value } })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Redirect URL after submission</Label>
              <Input
                defaultValue={(settings.redirectUrl as string) ?? ""}
                placeholder="https://..."
                onBlur={(e) =>
                  updateForm.mutate({ formId, settings: { ...settings, redirectUrl: e.target.value || undefined } })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Max responses</Label>
              <Input
                type="number"
                defaultValue={(settings.maxResponses as number) ?? ""}
                placeholder="Unlimited"
                onBlur={(e) =>
                  updateForm.mutate({ formId, settings: { ...settings, maxResponses: parseInt(e.target.value) || undefined } })
                }
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-5">
            <h2 className="font-semibold text-sm text-red-600 mb-3">Danger Zone</h2>
            <Button
              variant="outline"
              className="border-red-300 text-red-500 hover:bg-red-50"
              onClick={() => {
                if (confirm("Delete this form and all its responses? This cannot be undone.")) {
                  deleteForm.mutate({ formId });
                }
              }}
            >
              Delete form
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
