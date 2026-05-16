import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPLICATIONS, POSTINGS } from "@/lib/mock-data";

export const CompanyBillingPage = () => {
  const usage = useMemo(() => {
    const activePostingsUsed = POSTINGS.filter((posting) => posting.status === "active").length;
    const applicantsViewed = APPLICATIONS.length;
    const messagesSent = 24;
    return { activePostingsUsed, applicantsViewed, messagesSent };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
        <p className="text-slate-500">Manage your plan, usage, payment details, and invoice history.</p>
      </div>

      <Card className="bg-white rounded-xl">
        <CardHeader><CardTitle className="text-slate-900">Current Plan</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">Pro Plan</p>
            <p className="text-sm text-slate-600">Renews on June 1, 2026 • $79/month</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => toast.success("Plan upgrade flow opened.")}>Upgrade Plan</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl"><CardHeader><CardTitle className="text-slate-900">Free</CardTitle></CardHeader><CardContent className="text-sm text-slate-700 space-y-2"><p>Up to 2 active postings</p><p>Basic applicant insights</p><p>Email support</p><Button variant="outline" onClick={() => toast.success("Free plan selected.")}>Select Free</Button></CardContent></Card>
        <Card className="bg-white rounded-xl border-blue-200"><CardHeader><CardTitle className="text-slate-900">Pro</CardTitle></CardHeader><CardContent className="text-sm text-slate-700 space-y-2"><p>Up to 15 active postings</p><p>Full applicant match analytics</p><p>Priority support</p><Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => toast.success("Pro plan is already active.")}>Current Plan</Button></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader><CardTitle className="text-slate-900">Enterprise</CardTitle></CardHeader><CardContent className="text-sm text-slate-700 space-y-2"><p>Unlimited postings</p><p>Custom integrations</p><p>Dedicated success manager</p><Button variant="outline" onClick={() => toast.success("Enterprise contact request sent.")}>Contact Sales</Button></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Active Postings Used</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{usage.activePostingsUsed}/15</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Applicants Viewed</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{usage.applicantsViewed}/500</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Messages Sent</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{usage.messagesSent}/1000</p></CardContent></Card>
      </div>

      <Card className="bg-white rounded-xl">
        <CardHeader><CardTitle className="text-slate-900">Invoice History</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm text-slate-700">
            <thead>
              <tr className="text-left border-b border-slate-200">
                <th className="py-2 pr-4">Invoice</th><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Amount</th><th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100"><td className="py-2 pr-4">INV-2026-004</td><td className="py-2 pr-4">2026-05-01</td><td className="py-2 pr-4">$79.00</td><td className="py-2">Paid</td></tr>
              <tr className="border-b border-slate-100"><td className="py-2 pr-4">INV-2026-003</td><td className="py-2 pr-4">2026-04-01</td><td className="py-2 pr-4">$79.00</td><td className="py-2">Paid</td></tr>
              <tr><td className="py-2 pr-4">INV-2026-002</td><td className="py-2 pr-4">2026-03-01</td><td className="py-2 pr-4">$79.00</td><td className="py-2">Paid</td></tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl">
        <CardHeader><CardTitle className="text-slate-900">Payment Method</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-slate-900">Visa ending in 4242</p>
            <p className="text-sm text-slate-600">Expires 11/2028</p>
          </div>
          <Button variant="outline" onClick={() => toast.success("Payment method update flow opened.")}>Update Payment Method</Button>
        </CardContent>
      </Card>
    </div>
  );
};
