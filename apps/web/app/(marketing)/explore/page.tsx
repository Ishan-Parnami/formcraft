import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import db, { forms, responses } from "@formforge/db";
import { eq, and, desc, count, ilike, or } from "@formforge/db";
import ExploreSearch from "./search";

export const revalidate = 60;

async function getPublicForms(query?: string) {
  const base = and(eq(forms.isPublished, true), eq(forms.visibility, "public"));
  const where = query
    ? and(base, or(ilike(forms.title, `%${query}%`), ilike(forms.description ?? forms.title, `%${query}%`)))
    : base;

  return db
    .select()
    .from(forms)
    .where(where)
    .orderBy(desc(forms.createdAt))
    .limit(48);
}

async function getFeaturedForms() {
  const counts = await db
    .select({ formId: responses.formId, total: count() })
    .from(responses)
    .groupBy(responses.formId)
    .orderBy(desc(count()))
    .limit(3);

  if (!counts.length) return [];

  const ids = counts.map((c) => c.formId);
  const featured = await Promise.all(
    ids.map((id) =>
      db
        .select()
        .from(forms)
        .where(and(eq(forms.id, id), eq(forms.isPublished, true), eq(forms.visibility, "public")))
        .limit(1)
        .then((r) => r[0])
    )
  );

  return featured
    .filter((f): f is NonNullable<typeof f> => !!f)
    .map((f, i) => ({ ...f, responseCount: counts[i]?.total ?? 0 }));
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [allForms, featuredForms] = await Promise.all([
    getPublicForms(q),
    q ? Promise.resolve([]) : getFeaturedForms(),
  ]);

  const featuredIds = new Set(featuredForms.map((f) => f.id));
  const regularForms = allForms.filter((f) => !featuredIds.has(f.id));

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-violet-600">FormForge</Link>
          <div className="flex gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link href="/register"><Button size="sm" className="bg-violet-600 hover:bg-violet-700">Get started</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-10">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">Explore public forms</h1>
            <p className="text-gray-500">Browse forms shared by the community</p>
          </div>
          <ExploreSearch defaultValue={q} />
        </div>

        {/* Featured section */}
        {featuredForms.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Featured</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {featuredForms.map((form) => (
                <Link key={form.id} href={`/f/${form.slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-violet-200 bg-violet-50/30">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="text-xs bg-violet-600">Featured</Badge>
                        <span className="text-xs text-gray-400">{form.responseCount} responses</span>
                      </div>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">{form.title}</h3>
                      {form.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{form.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All forms */}
        {regularForms.length === 0 && !featuredForms.length ? (
          <div className="text-center py-24 text-gray-500">
            {q ? (
              <>
                <p className="text-lg">No forms found for &ldquo;{q}&rdquo;</p>
                <Link href="/explore" className="mt-4 inline-block">
                  <Button variant="outline">Clear search</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-lg">No public forms yet.</p>
                <p className="text-sm mt-2">Be the first to publish one!</p>
                <Link href="/register" className="mt-4 inline-block">
                  <Button className="bg-violet-600 hover:bg-violet-700">Create a form</Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            {regularForms.length > 0 && (
              <>
                {featuredForms.length > 0 && (
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">All Forms</h2>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularForms.map((form) => (
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
