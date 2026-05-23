"use client";

import { trpc } from "~/trpc/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateProfileSchema, type UpdateProfileInput } from "@formforge/schemas/user";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent } from "~/components/ui/card";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: user, isLoading } = trpc.users.me.useQuery();
  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => toast.success("Profile updated"),
    onError: () => toast.error("Failed to update profile"),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
  });

  if (isLoading) return <div className="p-8 text-gray-500">Loading…</div>;

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile settings</h1>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              {...register("name")}
              defaultValue={user?.name ?? ""}
              className="mt-1"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="mt-1 bg-gray-50" />
          </div>
          <Button
            onClick={handleSubmit((data) => updateProfile.mutate(data))}
            disabled={isSubmitting || updateProfile.isPending}
            className="bg-violet-600 hover:bg-violet-700"
          >
            Save changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
