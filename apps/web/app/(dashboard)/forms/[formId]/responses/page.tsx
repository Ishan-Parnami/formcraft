"use client";

import { use, useState } from "react";
import Link from "next/link";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { ArrowLeft, Download, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import type { RouterOutputs } from "@formforge/trpc/client";

type Response = RouterOutputs["responses"]["list"]["responses"][number];

function ResponseRow({
  response,
  index,
  fields,
}: {
  response: Response;
  index: number;
  fields: Array<{ id: string; label: string }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const answers = (response.answers ?? {}) as Record<string, unknown>;

  function formatAnswer(v: unknown): string {
    if (v === null || v === undefined || v === "") return "—";
    if (Array.isArray(v)) return v.join(", ");
    return String(v);
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-mono text-gray-400 w-6">{index}</span>
        <span className="font-mono text-xs text-gray-500 flex-1">{response.id.slice(0, 8)}…</span>
        <span className="text-xs text-gray-400">
          {response.createdAt ? new Date(response.createdAt).toLocaleString("en-US") : ""}
        </span>
        {response.completionTime && (
          <Badge variant="outline" className="text-xs">{response.completionTime}s</Badge>
        )}
        {response.respondentEmail ? (
          <span className="text-xs text-gray-500 hidden sm:inline">{response.respondentEmail}</span>
        ) : (
          <span className="text-xs text-gray-300 hidden sm:inline">anonymous</span>
        )}
        {expanded ? <ChevronUp className="h-3 w-3 text-gray-400" /> : <ChevronDown className="h-3 w-3 text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t bg-gray-50 p-4 space-y-2">
          {fields.map((field) => (
            <div key={field.id} className="grid grid-cols-3 gap-3 text-sm">
              <span className="text-gray-500 font-medium truncate">{field.label}</span>
              <span className="col-span-2 text-gray-900">{formatAnswer(answers[field.id])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResponsesPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const LIMIT = 10;

  const { data: formData } = trpc.forms.getById.useQuery({ formId });
  const { data: responsesData, isLoading } = trpc.responses.list.useQuery({
    formId,
    page,
    limit: LIMIT,
  });
  const exportCsv = trpc.responses.exportCsv.useQuery({ formId }, { enabled: false });

  const formFields = (formData?.fields ?? []).sort((a, b) => a.order - b.order);
  const totalPages = responsesData ? Math.ceil(responsesData.total / LIMIT) : 1;

  function downloadCsv() {
    exportCsv.refetch().then(({ data }) => {
      if (!data) return;
      const blob = new Blob([data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `responses-${formId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/forms/${formId}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
        <h1 className="text-2xl font-bold flex-1">{formData?.title ?? "…"} — Responses</h1>
        <Button size="sm" variant="outline" onClick={downloadCsv} className="gap-1">
          <Download className="h-3 w-3" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">From</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-8 text-xs w-36"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">To</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-8 text-xs w-36"
          />
        </div>
        {(dateFrom || dateTo) && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
          >
            Clear
          </Button>
        )}
        <span className="text-xs text-gray-400 self-center">
          {responsesData?.total ?? 0} total responses
        </span>
      </div>

      {/* Table header */}
      <div className="hidden sm:flex items-center gap-3 px-3 pb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <span className="w-6">#</span>
        <span className="flex-1">ID</span>
        <span>Submitted</span>
        <span>Time</span>
        <span className="hidden sm:inline">Email</span>
        <span className="w-4" />
      </div>

      {/* Responses list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: LIMIT }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !responsesData || responsesData.responses.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <MessageSquare className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No responses yet.</p>
            <p className="text-sm text-gray-400 mt-1">Share your form to start collecting responses.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {responsesData.responses.map((r, i) => (
            <ResponseRow
              key={r.id}
              response={r}
              index={(page - 1) * LIMIT + i + 1}
              fields={formFields.map((f) => ({ id: f.id, label: f.label }))}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-3 w-3" /> Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="gap-1"
          >
            Next <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
