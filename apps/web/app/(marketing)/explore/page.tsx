import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import db, { forms, users } from "@formcraft/db";
import { eq, and, desc } from "@formcraft/db";

export const revalidate = 60;

async function getPublicForms() {
  return db
    .select()
    .from(forms)
    .where(and(eq(forms.isPublished, true), eq(forms.visibility, "public")))
    .orderBy(desc(forms.createdAt))
    .limit(24);
}

export default async function ExplorePage() {
  const publicForms = await getPublicForms();

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-violet-600">FormCraft</Link>
          <div className="flex gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link href="/register"><Button size="sm" className="bg-violet-600 hover:bg-violet-700">Get started</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Explore public forms</h1>
        <p className="text-gray-500 mb-10">Browse forms shared by the community</p>

        {publicForms.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <p className="text-lg">No public forms yet.</p>
            <p className="text-sm mt-2">Be the first to publish one!</p>
            <Link href="/register" className="mt-4 inline-block">
              <Button className="bg-violet-600 hover:bg-violet-700">Create a form</Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicForms.map((form) => (
              <Link key={form.id} href={`/f/${form.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <Badge variant="outline" className="text-xs mb-3">Public</Badge>
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{form.title}</h3>
                    {form.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">{form.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-3">
                      {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : ""}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
