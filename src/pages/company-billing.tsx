import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/lib/auth-context";
import { toast } from "sonner";

export const CompanyBillingPage = () => {
  const { company } = useCurrentUser();
  return <div className="max-w-7xl mx-auto space-y-6">
    <div><h1 className="text-3xl font-bold text-slate-900">Billing</h1><p className="text-slate-500">Billing status and plan details.</p></div>
    <Card><CardHeader><CardTitle>Current Plan</CardTitle></CardHeader><CardContent><div className="flex items-center justify-between"><div><p className="font-semibold text-slate-900">{company?.is_premium ? "Pro Plan" : "Free Plan"}</p><p className="text-sm text-slate-500">Premium badge benefits, higher visibility, unlimited applicant filters.</p></div><Badge variant={company?.is_premium?"default":"outline"}>{company?.is_premium?"Premium":"Free"}</Badge></div></CardContent></Card>
    <div className="grid md:grid-cols-3 gap-4">{["Free","Pro","Enterprise"].map((p)=><Card key={p}><CardHeader><CardTitle>{p}</CardTitle></CardHeader><CardContent className="space-y-2"><p className="text-sm text-slate-600">Active postings, applicant views, and recruiter messaging limits included.</p><Button variant={p==="Free"?"outline":"default"} className={p!=="Free"?"bg-blue-600 hover:bg-blue-700":""} onClick={()=>toast.info(`${p} plan selected`)}>Upgrade</Button></CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle>Usage Limits</CardTitle></CardHeader><CardContent className="text-sm text-slate-600 space-y-1"><p>Active postings used: 2 / 5</p><p>Applicants viewed: 18 / 50</p><p>Messages sent: 42 / 100</p></CardContent></Card>
    <Card><CardHeader><CardTitle>Invoice History</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{["INV-2026-001","INV-2026-002"].map((i)=><div key={i} className="p-3 border rounded-lg flex justify-between"><span>{i}</span><span>TRY 9,900</span></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>Payment Method</CardTitle></CardHeader><CardContent><div className="p-4 rounded-lg border flex items-center justify-between"><p className="text-sm text-slate-700">Visa ending 4242 • Expires 12/28</p><Button variant="outline" onClick={()=>toast.success("Payment method editor opened")}>Update</Button></div></CardContent></Card>
  </div>;
};
