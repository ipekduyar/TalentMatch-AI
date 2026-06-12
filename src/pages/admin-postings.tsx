import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminPostings, updatePostingStatus, type AdminPosting } from "@/lib/admin-service";

const statusOptions = ["all", "draft", "pending_review", "active", "closed"];
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value)) : "—";

export const AdminPostingsPage = () => {
  const [postings, setPostings] = useState<AdminPosting[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingPostingId, setUpdatingPostingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPostings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setPostings(await getAdminPostings());
    } catch (err: any) {
      setError(err?.message || "Could not load postings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadPostings(); }, []);

  const filteredPostings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return postings.filter((posting) => {
      const matchesStatus = status === "all" || posting.status === status;
      const haystack = [posting.title, posting.company_name, posting.industry, posting.location].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!q || haystack.includes(q));
    });
  }, [postings, search, status]);

  const handleStatusChange = async (posting: AdminPosting, nextStatus: "active" | "closed") => {
    if (!window.confirm(`Are you sure you want to mark “${posting.title || "this posting"}” as ${nextStatus}?`)) return;

    setUpdatingPostingId(posting.internship_posting_id);
    try {
      await updatePostingStatus(posting.internship_posting_id, nextStatus);
      toast.success(`Posting marked as ${nextStatus}.`);
      setPostings((current) => current.map((item) => item.internship_posting_id === posting.internship_posting_id ? { ...item, status: nextStatus } : item));
    } catch (err: any) {
      toast.error(err?.message || "Could not update posting status.");
    } finally {
      setUpdatingPostingId(null);
    }
  };

  if (isLoading) return <div className="space-y-4"><h1 className="text-3xl font-black">Postings</h1>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>;
  if (error) return <ErrorState title="Postings" message={error} onRetry={loadPostings} />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">Admin</p>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">Postings</h1>
        <p className="text-sm text-slate-500">Monitor all internship postings and safely toggle active/closed status.</p>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, company, industry, or location" className="pl-9" /></div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
            {statusOptions.map((option) => <option key={option} value={option}>{option === "all" ? "All statuses" : option.replace("_", " ")}</option>)}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{filteredPostings.length} postings</CardTitle></CardHeader>
        <CardContent className="p-0">
          {filteredPostings.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No postings match the selected filters.</p>
          ) : (
            <div className="divide-y">
              {filteredPostings.map((posting) => (
                <div key={posting.internship_posting_id} className="grid gap-4 p-5 lg:grid-cols-[1.4fr_0.8fr_0.7fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-slate-900">{posting.title || "Untitled posting"}</p>
                      <Badge variant={posting.status === "active" ? "success" : posting.status === "closed" ? "destructive" : "outline"}>{posting.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">{posting.company_name || "Unknown company"} · {posting.industry || "No industry"} · {posting.location || "No location"}</p>
                  </div>
                  <div className="text-sm text-slate-600"><p><span className="font-bold">Deadline:</span> {formatDate(posting.deadline)}</p><p><span className="font-bold">Created:</span> {formatDate(posting.created_at)}</p></div>
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-black uppercase text-slate-400">Applications</p><p className="font-black">{posting.application_count}</p></div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button variant="outline" disabled={updatingPostingId === posting.internship_posting_id || posting.status === "active"} onClick={() => handleStatusChange(posting, "active")}>Active</Button>
                    <Button variant="danger" disabled={updatingPostingId === posting.internship_posting_id || posting.status === "closed"} onClick={() => handleStatusChange(posting, "closed")}>Closed</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ErrorState = ({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) => (
  <Card><CardContent className="flex items-center justify-between gap-3 p-6 text-rose-700"><div className="flex gap-3"><AlertCircle className="h-5 w-5" /><div><h1 className="font-black">{title}</h1><p className="text-sm">{message}</p></div></div><Button variant="outline" onClick={onRetry}>Retry</Button></CardContent></Card>
);
