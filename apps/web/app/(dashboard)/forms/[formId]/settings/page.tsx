"use client";

import { use, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, Copy, Check, ExternalLink, QrCode, Globe2, Zap } from "lucide-react";
import { ComingSoonBadge } from "~/components/ui/coming-soon-badge";
import { ConfirmModal } from "~/components/ui/ConfirmModal";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

export default function FormSettingsPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const router = useRouter();
  const { data: formData, refetch } = trpc.forms.getById.useQuery({ formId });

  const [slugValue, setSlugValue] = useState("");
  const [slugEditing, setSlugEditing] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  const settings = (formData?.settings ?? {}) as Record<string, unknown>;
  const currentSlug = formData?.slug ?? "";
  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";
  const publicUrl = `${appUrl}/f/${currentSlug}`;

  const updateForm = trpc.forms.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved");
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateSlug = trpc.forms.updateSlug.useMutation({
    onSuccess: () => {
      toast.success("Slug updated");
      setSlugEditing(false);
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updatePassword = trpc.forms.updatePassword.useMutation({
    onSuccess: () => {
      toast.success("Password settings saved");
      void refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteForm = trpc.forms.delete.useMutation({
    onSuccess: () => router.push("/forms"),
    onError: (e) => toast.error(e.message),
  });

  const cloneForm = trpc.forms.clone.useMutation({
    onSuccess: (newForm) => {
      toast.success("Form cloned");
      if (newForm?.id) router.push(`/forms/${newForm.id}/settings`);
    },
    onError: (e) => toast.error(e.message),
  });

  function copyUrl() {
    void navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQr() {
    const svg = qrRef.current;
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${currentSlug}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!formData) {
    return (
      <div className="p-8 max-w-xl space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/forms/${formId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex-1">{formData.title} — Settings</h1>
        <Badge variant={formData.isPublished ? "default" : "outline"}>
          {formData.isPublished ? "Published" : "Draft"}
        </Badge>
      </div>

      <div className="space-y-6">
        {/* Public URL & Slug */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="font-semibold text-sm">Public URL</h2>

            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-600 flex-1 truncate">{publicUrl}</span>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={copyUrl}>
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>

            <div>
              <Label>Custom slug</Label>
              {slugEditing ? (
                <div className="flex gap-2 mt-1">
                  <Input
                    value={slugValue}
                    onChange={(e) =>
                      setSlugValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                    }
                    placeholder={currentSlug}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => updateSlug.mutate({ formId, slug: slugValue })}
                    disabled={updateSlug.isPending || slugValue.length < 3}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSlugEditing(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1">
                    {currentSlug}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSlugValue(currentSlug);
                      setSlugEditing(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Visibility */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-semibold text-sm">Form visibility</h2>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  {
                    value: "public",
                    icon: "🌐",
                    title: "Public",
                    desc: "Appears in explore page and public galleries",
                  },
                  {
                    value: "unlisted",
                    icon: "🔗",
                    title: "Unlisted",
                    desc: "Only accessible via direct link",
                  },
                ] as const
              ).map(({ value, icon, title, desc }) => {
                const active = (formData.visibility ?? "unlisted") === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateForm.mutate({ formId, visibility: value })}
                    className={`text-left p-3 rounded-lg border-2 transition-colors ${active
                        ? "border-violet-500 bg-violet-50"
                        : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="text-base mb-0.5">
                      {icon}{" "}
                      <span className={`text-sm font-medium ${active ? "text-violet-700" : ""}`}>
                        {title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Custom Domain — coming soon */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Globe2 className="h-4 w-4" /> Custom Domain
              </h2>
              <ComingSoonBadge />
            </div>
            <div className="opacity-40 pointer-events-none select-none">
              <p className="text-xs text-gray-500 mb-2">
                Connect your own domain like{" "}
                <span className="font-mono">forms.yourcompany.com</span>
              </p>
              <input
                disabled
                placeholder="yourdomain.com"
                className="w-full border rounded-md px-3 py-2 text-sm bg-gray-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Integrations — coming soon */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" /> Integrations
              </h2>
              <ComingSoonBadge />
            </div>
            <div className="opacity-40 pointer-events-none select-none">
              <p className="text-xs text-gray-500">
                Connect Slack, Zapier, Webhooks and more to automate your workflows.
              </p>
              <div className="mt-3 flex gap-2">
                {["Slack", "Zapier", "Webhook", "Notion"].map((i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 border rounded-md bg-white text-gray-600"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  <QrCode className="h-4 w-4" /> QR Code
                </h2>
                <p className="text-xs text-gray-400 mb-3">Share your form via QR code.</p>
                <Button size="sm" variant="outline" onClick={downloadQr}>
                  Download SVG
                </Button>
              </div>
              <div className="border rounded-lg p-2 bg-white">
                <QRCodeSVG ref={qrRef} value={publicUrl} size={96} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submission settings */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="font-semibold text-sm">Submission</h2>
            <div>
              <Label>Submit button text</Label>
              <Input
                key={`submit-${formData.id}`}
                defaultValue={(settings.submitButtonText as string) ?? "Submit"}
                onBlur={(e) =>
                  updateForm.mutate({
                    formId,
                    settings: { ...settings, submitButtonText: e.target.value },
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Success message</Label>
              <Input
                key={`success-${formData.id}`}
                defaultValue={(settings.successMessage as string) ?? "Thank you for your response!"}
                onBlur={(e) =>
                  updateForm.mutate({
                    formId,
                    settings: { ...settings, successMessage: e.target.value },
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Redirect URL after submission</Label>
              <Input
                key={`redirect-${formData.id}`}
                defaultValue={(settings.redirectUrl as string) ?? ""}
                placeholder="https://..."
                onBlur={(e) =>
                  updateForm.mutate({
                    formId,
                    settings: { ...settings, redirectUrl: e.target.value || undefined },
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Max responses</Label>
              <Input
                key={`max-${formData.id}`}
                type="number"
                defaultValue={(settings.maxResponses as number | undefined) ?? ""}
                placeholder="Unlimited"
                onBlur={(e) =>
                  updateForm.mutate({
                    formId,
                    settings: { ...settings, maxResponses: parseInt(e.target.value) || undefined },
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Expiry date</Label>
              <Input
                key={`expiry-${formData.id}`}
                type="datetime-local"
                defaultValue={
                  settings.expiresAt
                    ? new Date(settings.expiresAt as string).toISOString().slice(0, 16)
                    : ""
                }
                onBlur={(e) =>
                  updateForm.mutate({
                    formId,
                    settings: {
                      ...settings,
                      expiresAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    },
                  })
                }
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank for no expiry.</p>
            </div>
          </CardContent>
        </Card>

        {/* Password protection */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-sm">Password protection</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {settings.requirePassword ? "Currently enabled" : "Currently disabled"}
                </p>
              </div>
              <Switch checked={passwordEnabled} onCheckedChange={setPasswordEnabled} />
            </div>

            {passwordEnabled && (
              <div>
                <Label>New password</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="password"
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    placeholder="Set a password..."
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      updatePassword.mutate({ formId, password: passwordValue });
                      setPasswordValue("");
                      setPasswordEnabled(false);
                    }}
                    disabled={updatePassword.isPending || passwordValue.length < 4}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}

            {!!settings.requirePassword && !passwordEnabled && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-500 border-red-200"
                onClick={() => updatePassword.mutate({ formId, password: null })}
                disabled={updatePassword.isPending}
              >
                Remove password
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Clone */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold text-sm mb-2">Clone form</h2>
            <p className="text-xs text-gray-400 mb-3">
              Create a duplicate of this form with all its fields.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => cloneForm.mutate({ formId })}
              disabled={cloneForm.isPending}
            >
              {cloneForm.isPending ? "Cloning…" : "Clone this form"}
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardContent className="p-5">
            <h2 className="font-semibold text-sm text-red-600 mb-3">Danger Zone</h2>
            <Button
              variant="outline"
              className="border-red-300 text-red-500 hover:bg-red-50"
              onClick={() => setDeleteModalOpen(true)}
              disabled={deleteForm.isPending}
            >
              {deleteForm.isPending ? "Deleting…" : "Delete form"}
            </Button>
            <ConfirmModal
              isOpen={deleteModalOpen}
              title="Delete form"
              description="Delete this form and all its responses? This cannot be undone."
              confirmLabel="Delete"
              cancelLabel="Cancel"
              variant="destructive" 
              onConfirm={() => { setDeleteModalOpen(false); deleteForm.mutate({ formId }); }} 
              onCancel={() => setDeleteModalOpen(false)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
