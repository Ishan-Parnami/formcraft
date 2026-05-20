"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreateFormSchema, type CreateFormInput } from "@formcraft/schemas/form";
import { trpc } from "~/trpc/client";

type CreateFormValues = z.input<typeof CreateFormSchema>;
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

export default function NewFormPage() {
  const router = useRouter();
  const createForm = trpc.forms.create.useMutation({
    onSuccess: (form) => {
      if (form) router.push(`/forms/${form.id}/edit`);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(CreateFormSchema),
    defaultValues: { visibility: "unlisted" },
  });

  const onSubmit = (data: CreateFormValues) => {
    createForm.mutate(data as CreateFormInput);
  };

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Create a new form</h1>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label>Form title *</Label>
              <Input placeholder="e.g. Customer Feedback Survey" {...register("title")} className="mt-1" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <Label>Description</Label>
              <Textarea placeholder="What is this form about?" {...register("description")} className="mt-1" rows={3} />
            </div>

            <div>
              <Label>Visibility</Label>
              <Select onValueChange={(v) => setValue("visibility", v as "public" | "unlisted")} defaultValue="unlisted">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlisted">Unlisted (accessible via link)</SelectItem>
                  <SelectItem value="public">Public (listed in Explore)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {createForm.error && (
              <p className="text-sm text-red-500">{createForm.error.message}</p>
            )}

            <Button
              type="submit"
              disabled={createForm.isPending}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              {createForm.isPending ? "Creating…" : "Create form & go to builder"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
