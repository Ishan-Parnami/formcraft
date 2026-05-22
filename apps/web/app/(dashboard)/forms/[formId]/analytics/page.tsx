"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  ArrowLeft, Eye, MessageSquare, TrendingUp, Clock,
  Download, ExternalLink, BarChart2,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="space-y-2">
          <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function fillDays(data: Array<{ day: string; count: number }>) {
  const map = new Map(data.map((d) => [d.day, d.count]));
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ day: key.slice(5), count: map.get(key) ?? 0 });
  }
  return result;
}

const BAR_COLORS = ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];

export default function AnalyticsPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);

  const { data: stats, isLoading: statsLoading } = trpc.analytics.getFormStats.useQuery({ formId });
  const { data: fieldStats, isLoading: fieldLoading } = trpc.analytics.getFieldStats.useQuery({ formId });
  const { data: formData } = trpc.forms.getById.useQuery({ formId });
  const exportCsv = trpc.responses.exportCsv.useQuery({ formId }, { enabled: false });

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

  const chartData = fillDays(
    stats?.responsesByDay?.map((r) => ({ day: r.day, count: r.count })) ?? []
  );

  const firstVisField = fieldStats?.find((f) =>
    ["single_select", "multi_select", "rating", "checkbox", "dropdown"].includes(f.type)
  );
  const barData = firstVisField?.distribution
    ? Object.entries(firstVisField.distribution).map(([k, v]) => ({ name: k, count: v }))
    : [];

  const { data: responsesData } = trpc.responses.list.useQuery({ formId, page: 1, limit: 5 });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/forms/${formId}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
        <h1 className="text-2xl font-bold flex-1">{formData?.title ?? "…"} — Analytics</h1>
        <Button size="sm" variant="outline" onClick={downloadCsv} className="gap-1">
          <Download className="h-3 w-3" /> Export CSV
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            {[
              { label: "Total Views", value: stats?.totalViews ?? 0, icon: Eye, color: "text-blue-500" },
              { label: "Responses", value: stats?.totalResponses ?? 0, icon: MessageSquare, color: "text-violet-500" },
              { label: "Completion Rate", value: `${stats?.completionRate ?? 0}%`, icon: TrendingUp, color: "text-green-500" },
              { label: "Avg. Completion", value: stats?.avgCompletionTime ? `${stats.avgCompletionTime}s` : "—", icon: Clock, color: "text-orange-500" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-5 flex items-center gap-4">
                  <s.icon className={`h-8 w-8 ${s.color}`} />
                  <div>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-sm text-gray-500">{s.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4">Responses — last 30 days</h3>
            {statsLoading ? (
              <div className="h-48 bg-gray-50 animate-pulse rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={6} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number) => [v, "responses"]}
                  />
                  <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-1">
              {firstVisField ? `"${firstVisField.label}"` : "Field breakdown"}
            </h3>
            {firstVisField && <p className="text-xs text-gray-400 mb-3">{firstVisField.responseCount} responses</p>}
            {fieldLoading ? (
              <div className="h-48 bg-gray-50 animate-pulse rounded" />
            ) : barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} width={90} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [v, "responses"]} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {barData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No field data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top referrers */}
      {(stats?.topReferrers?.length ?? 0) > 0 && (
        <Card className="mb-8">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Top referrers</h3>
            <div className="space-y-2">
              {stats!.topReferrers.map((ref) => (
                <div key={ref.referrer} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-700 truncate max-w-xs">{ref.referrer}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{ref.count} views</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field stats */}
      {(fieldStats?.length ?? 0) > 0 && (
        <Card className="mb-8">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart2 className="h-4 w-4" /> Field statistics
            </h3>
            <div className="space-y-3">
              {fieldStats!.map((f) => (
                <div key={f.fieldId} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{f.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{f.type.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-gray-400">{f.responseCount} responses</span>
                    </div>
                  </div>
                  {f.avgRating !== undefined && <p className="text-sm text-gray-600">Avg rating: <strong>{f.avgRating}</strong></p>}
                  {f.avgLength !== undefined && <p className="text-sm text-gray-600">Avg length: <strong>{f.avgLength} chars</strong></p>}
                  {f.trueCount !== undefined && (
                    <p className="text-sm text-gray-600">Checked: <strong>{f.trueCount}</strong> · Unchecked: <strong>{f.falseCount}</strong></p>
                  )}
                  {f.distribution && Object.keys(f.distribution).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(f.distribution)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([k, v]) => {
                          const pct = f.responseCount > 0 ? Math.round((v / f.responseCount) * 100) : 0;
                          return (
                            <div key={k} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-28 truncate">{k}</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent responses */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Recent responses</h3>
            <Link href={`/forms/${formId}/responses`}>
              <Button size="sm" variant="outline" className="text-xs">View all</Button>
            </Link>
          </div>
          {!responsesData || responsesData.responses.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No responses yet</p>
          ) : (
            <div className="divide-y">
              {responsesData.responses.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-mono text-xs text-gray-500">{r.id.slice(0, 8)}…</span>
                  <span className="text-gray-400 text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</span>
                  <span className="text-gray-400 text-xs">{r.completionTime ? `${r.completionTime}s` : "—"}</span>
                  <span className="text-gray-400 text-xs">{r.respondentEmail ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
