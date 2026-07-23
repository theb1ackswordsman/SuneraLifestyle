"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, TrendingUp, Zap, AlertCircle, BarChart3,
  Plus, Trash2, Star, CheckCircle, XCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KeywordStat {
  _id: string;
  keyword: string;
  searchCount: number;
  clickCount: number;
  noResultsCount: number;
  isTrending: boolean;
  trendingOrder: number;
}

interface Analytics {
  topKeywords: KeywordStat[];
  noResultKeywords: KeywordStat[];
  totalSearches: number;
  totalClicks: number;
  clickThroughRate: number;
  trendingKeywords: KeywordStat[];
}

type Tab = "overview" | "trending" | "no-results";

const ADMIN_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "x-user-role": "admin",
  "x-admin-verified": "1",
};

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; iconBg: string; iconColor: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-gray-900 tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={cn("rounded-xl p-2.5", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
    </div>
  );
}

export default function AdminSearchPage() {
  const [analytics,     setAnalytics]     = useState<Analytics | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState<Tab>("overview");
  const [newKeyword,    setNewKeyword]    = useState("");
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/search/analytics", { headers: ADMIN_HEADERS });
      const json = await res.json();
      if (json.success) setAnalytics(json.data);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  async function addTrending(keyword: string) {
    if (!keyword.trim()) return;
    setAddingKeyword(true);
    try {
      await fetch("/api/admin/search/trending", { method: "POST", headers: ADMIN_HEADERS, body: JSON.stringify({ keyword: keyword.trim() }) });
      setNewKeyword("");
      await fetchAnalytics();
    } finally { setAddingKeyword(false); }
  }

  async function removeTrending(keyword: string) {
    setActionLoading(keyword);
    try {
      await fetch("/api/admin/search/trending", { method: "DELETE", headers: ADMIN_HEADERS, body: JSON.stringify({ keyword }) });
      await fetchAnalytics();
    } finally { setActionLoading(null); }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1a5c14]" /></div>;
  }

  const a = analytics;
  const topKeyword = a?.topKeywords?.[0]?.keyword ?? "—";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">Search Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor search performance and manage trending keywords.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Search}       label="Total Searches"       value={a?.totalSearches?.toLocaleString() ?? "0"} iconBg="bg-blue-50"   iconColor="text-blue-600" />
        <StatCard icon={TrendingUp}   label="Click-Through Rate"   value={a ? `${a.clickThroughRate.toFixed(1)}%` : "0%"} sub={`${a?.totalClicks?.toLocaleString() ?? 0} clicks`} iconBg="bg-green-50"  iconColor="text-green-600" />
        <StatCard icon={Zap}          label="Top Keyword"          value={topKeyword} sub={a?.topKeywords?.[0] ? `${a.topKeywords[0].searchCount.toLocaleString()} searches` : undefined} iconBg="bg-amber-50"  iconColor="text-amber-600" />
        <StatCard icon={AlertCircle}  label="No-Result Keywords"   value={a?.noResultKeywords?.length?.toLocaleString() ?? "0"} sub="unique keywords" iconBg="bg-red-50"    iconColor="text-red-500" />
      </div>

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {([
          { id: "overview" as Tab,    label: "Overview",          icon: BarChart3 },
          { id: "trending" as Tab,    label: "Trending Keywords", icon: TrendingUp },
          { id: "no-results" as Tab,  label: "No Results",        icon: AlertCircle },
        ]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
              tab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Top Search Keywords</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Keyword</th>
                  <th className="px-5 py-3 text-right">Searches</th>
                  <th className="px-5 py-3 text-right">Clicks</th>
                  <th className="px-5 py-3 text-right">CTR%</th>
                  <th className="px-5 py-3 text-right">No Results</th>
                  <th className="px-5 py-3 text-center">Trending</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(a?.topKeywords ?? []).length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">No data available yet.</td></tr>
                )}
                {(a?.topKeywords ?? []).map((kw, i) => {
                  const ctr = kw.searchCount > 0 ? ((kw.clickCount / kw.searchCount) * 100).toFixed(1) : "0.0";
                  const isActioning = actionLoading === kw.keyword;
                  return (
                    <tr key={kw._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{kw.keyword}</td>
                      <td className="px-5 py-3 text-right text-gray-700 tabular-nums">{kw.searchCount.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-gray-700 tabular-nums">{kw.clickCount.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        <span className={cn("font-semibold", parseFloat(ctr) >= 30 ? "text-green-600" : parseFloat(ctr) >= 10 ? "text-amber-600" : "text-red-500")}>{ctr}%</span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        <span className={cn("font-medium", kw.noResultsCount > 0 ? "text-red-500" : "text-gray-400")}>{kw.noResultsCount.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {kw.isTrending ? <CheckCircle className="inline h-4 w-4 text-green-500" /> : <XCircle className="inline h-4 w-4 text-gray-200" />}
                      </td>
                      <td className="px-5 py-3">
                        {kw.isTrending ? (
                          <button disabled={isActioning} onClick={() => removeTrending(kw.keyword)}
                            className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors">
                            {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Remove
                          </button>
                        ) : (
                          <button disabled={isActioning} onClick={() => addTrending(kw.keyword)}
                            className="flex items-center gap-1 rounded-lg border border-[#1a5c14]/20 bg-[#1a5c14]/5 px-2.5 py-1 text-xs font-medium text-[#1a5c14] hover:bg-[#1a5c14]/10 disabled:opacity-50 transition-colors">
                            {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className="h-3 w-3" />} Add Trending
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "trending" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Manually Add Trending Keyword</h2>
            <div className="flex gap-2">
              <input type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addTrending(newKeyword); }}
                placeholder="e.g. whey protein"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 transition-shadow" />
              <button disabled={addingKeyword || !newKeyword.trim()} onClick={() => addTrending(newKeyword)}
                className="flex items-center gap-1.5 rounded-xl bg-[#1a5c14] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a5c14]/90 disabled:opacity-50 transition-colors">
                {addingKeyword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Current Trending Keywords
                <span className="ml-2 rounded-full bg-[#1a5c14]/10 px-2 py-0.5 text-xs text-[#1a5c14] font-medium">{(a?.trendingKeywords ?? []).length}</span>
              </h2>
              <p className="text-xs text-gray-400">Sorted by trending order</p>
            </div>
            {(a?.trendingKeywords ?? []).length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
                <TrendingUp className="h-8 w-8 text-gray-200" />
                <p className="text-sm">No trending keywords set</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {[...(a?.trendingKeywords ?? [])].sort((x, y) => x.trendingOrder - y.trendingOrder).map((kw, i) => {
                  const isActioning = actionLoading === kw.keyword;
                  return (
                    <li key={kw._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1a5c14]/10 text-xs font-bold text-[#1a5c14]">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{kw.keyword}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500 tabular-nums">{kw.searchCount.toLocaleString()} searches</span>
                      <button disabled={isActioning} onClick={() => removeTrending(kw.keyword)}
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors">
                        {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "no-results" && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Keywords With No Search Results</h2>
            <p className="mt-0.5 text-xs text-gray-400">These searches returned zero products — consider adding inventory or synonyms.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Keyword</th>
                  <th className="px-5 py-3 text-right">Searches With No Result</th>
                  <th className="px-5 py-3">Suggestion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(a?.noResultKeywords ?? []).length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400 text-sm">No zero-result keywords found.</td></tr>
                )}
                {(a?.noResultKeywords ?? []).map((kw, i) => (
                  <tr key={kw._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        <AlertCircle className="h-3 w-3" /> {kw.keyword}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-red-600">{kw.noResultsCount.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">Consider adding products for this keyword</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
