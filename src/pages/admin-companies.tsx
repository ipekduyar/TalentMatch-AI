import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminCompanies, updateCompanyVerification, type AdminCompany } from "@/lib/admin-service";

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

export const AdminCompaniesPage = () => {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingCompanyId, setUpdatingCompanyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCompanies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCompanies(await getAdminCompanies());
    } catch (err: any) {
      setError(err?.message || "Could not load companies.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadCompanies(); }, []);

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((company) => [company.name, company.industry, company.location, company.representative_name, company.representative_email].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [companies, search]);

  const handleVerificationChange = async (company: AdminCompany, verified: boolean) => {
    const action = verified ? "verify" : "remove verification from";
    if (!window.confirm(`Are you sure you want to ${action} ${company.name || "this company"}?`)) return;

    setUpdatingCompanyId(company.company_id);
    try {
      await updateCompanyVerification(company.company_id, verified);
      toast.success(verified ? "Company verified." : "Company verification removed.");
      setCompanies((current) => current.map((item) => item.company_id === company.company_id ? { ...item, is_verified: verified, verified_at: verified ? new Date().toISOString() : null } : item));
    } catch (err: any) {
      toast.error(err?.message || "Could not update company verification.");
    } finally {
      setUpdatingCompanyId(null);
    }
  };

  if (isLoading) return <div className="space-y-4"><h1 className="text-3xl font-black">Companies</h1>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>;
  if (error) return <ErrorState title="Companies" message={error} onRetry={loadCompanies} />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">Admin</p>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">Companies</h1>
        <p className="text-sm text-slate-500">Monitor companies, representatives, postings, and verification state.</p>
      </div>

      <Card><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by company, industry, location, or representative" className="pl-9" /></div></CardContent></Card>

      <Card>
        <CardHeader><CardTitle>{filteredCompanies.length} companies</CardTitle></CardHeader>
        <CardContent className="p-0">
          {filteredCompanies.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No companies match your search.</p>
          ) : (
            <div className="divide-y">
              {filteredCompanies.map((company) => (
                <div key={company.company_id} className="grid gap-4 p-5 lg:grid-cols-[1.2fr_1fr_0.9fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-slate-900">{company.name || "Unnamed company"}</p>
                      <Badge variant={company.is_verified ? "success" : "warning"}>{company.is_verified ? "Verified" : "Unverified"}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">{company.industry || "No industry"} · {company.size || "No size"} · {company.location || "No location"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{company.representative_name || "No representative"}</p>
                    <p className="text-xs text-slate-500">{company.representative_email || "—"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-black uppercase text-slate-400">Active posts</p><p className="font-black">{formatNumber(company.active_posting_count)}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-black uppercase text-slate-400">Applications</p><p className="font-black">{formatNumber(company.application_count)}</p></div>
                  </div>
                  <Button variant={company.is_verified ? "outline" : "primary"} disabled={updatingCompanyId === company.company_id} onClick={() => handleVerificationChange(company, !company.is_verified)}>
                    {company.is_verified ? "Remove Verification" : "Verify"}
                  </Button>
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
