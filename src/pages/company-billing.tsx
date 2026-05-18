import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompanyUsage } from "@/lib/company-billing-service";

export const CompanyBillingPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState({ activePostingsUsed: 0, totalPostings: 0, applicantsViewed: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setUsage(await getCompanyUsage());
      } catch (err: any) {
        setError(err?.message || "Could not load plan and usage data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const notifyDemo = () => toast.info("Billing integration is not enabled in this demo.");

  if (loading) return <div className="max-w-7xl mx-auto text-slate-600">Loading plan and usage...</div>;
  if (error) return <div className="max-w-7xl mx-auto text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-3xl font-bold text-slate-900">Plan & Usage</h1><p className="text-slate-500">Billing integration is not enabled in this demo.</p></div>
      <Card className="bg-white rounded-xl"><CardHeader><CardTitle className="text-slate-900">Current Plan</CardTitle></CardHeader><CardContent className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-lg font-semibold text-slate-900">Free Demo</p><p className="text-sm text-slate-600">Demo pricing placeholder</p></div><Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={notifyDemo}>Upgrade Plan</Button></CardContent></Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl"><CardHeader><CardTitle className="text-slate-900">Free</CardTitle></CardHeader><CardContent className="text-sm text-slate-700 space-y-2"><p>Demo pricing placeholder</p><Button variant="outline" onClick={notifyDemo}>Select Free</Button></CardContent></Card>
        <Card className="bg-white rounded-xl border-blue-200"><CardHeader><CardTitle className="text-slate-900">Pro</CardTitle></CardHeader><CardContent className="text-sm text-slate-700 space-y-2"><p>Demo pricing placeholder</p><Button onClick={notifyDemo} className="bg-blue-600 hover:bg-blue-700 text-white">Demo Only</Button></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader><CardTitle className="text-slate-900">Enterprise</CardTitle></CardHeader><CardContent className="text-sm text-slate-700 space-y-2"><p>Demo pricing placeholder</p><Button variant="outline" onClick={notifyDemo}>Contact Sales</Button></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Active Postings Used</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{usage.activePostingsUsed}</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Total Postings</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{usage.totalPostings}</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Applicants Viewed</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{usage.applicantsViewed}</p></CardContent></Card>
      </div>
      <Card className="bg-white rounded-xl"><CardHeader><CardTitle className="text-slate-900">Messages</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-600">Not enabled</p></CardContent></Card>
      <Card className="bg-white rounded-xl"><CardHeader><CardTitle className="text-slate-900">Invoice History</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-600">No billing records. Payment integration is not enabled in this demo.</p></CardContent></Card>
    </div>
  );
};
