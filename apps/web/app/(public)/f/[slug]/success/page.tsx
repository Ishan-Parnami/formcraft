import Link from "next/link";
import { Button } from "~/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import db, { forms } from "@formforge/db";
import { eq } from "@formforge/db";

export default async function SuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [form] = await db.select().from(forms).where(eq(forms.slug, slug));

  const settings = (form?.settings ?? {}) as Record<string, unknown>;
  const message = (settings.successMessage as string) ?? "Thank you for your response!";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-3">{message}</h1>
        <p className="text-gray-500 mb-8">Your response has been recorded.</p>
        {form && (
          <Link href={`/f/${slug}`}>
            <Button variant="outline">Submit another response</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
