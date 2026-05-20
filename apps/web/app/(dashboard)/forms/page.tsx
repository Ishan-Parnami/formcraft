import { auth } from "~/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Plus, FileText, Edit, BarChart3, Eye } from "lucide-react";
import db, { forms } from "@formcraft/db";
import { eq } from "@formcraft/db";

export default async function FormsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userForms = await db.select().from(forms).where(eq(forms.userId, session.user.id!));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">My Forms</h1>
        <Link href="/forms/new">
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" /> New Form
          </Button>
        </Link>
      </div>

      {userForms.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl border">
          <FileText className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-6">No forms yet. Create your first one!</p>
          <Link href="/forms/new">
            <Button className="bg-violet-600 hover:bg-violet-700">Create form</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userForms.map((form) => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm line-clamp-1">{form.title}</h3>
                  <Badge
                    className={`text-xs shrink-0 ml-2 ${form.isPublished ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600"}`}
                    variant="outline"
                  >
                    {form.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                {form.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{form.description}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <Link href={`/forms/${form.id}/edit`}>
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  </Link>
                  <Link href={`/forms/${form.id}/responses`}>
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                      <BarChart3 className="h-3 w-3 mr-1" /> Responses
                    </Button>
                  </Link>
                  {form.isPublished && (
                    <Link href={`/f/${form.slug}`} target="_blank">
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
