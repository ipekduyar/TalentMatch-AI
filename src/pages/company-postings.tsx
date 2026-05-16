import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const CompanyPageTemplate = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="max-w-7xl mx-auto space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      <p className="text-slate-500">{subtitle}</p>
    </div>
    <Card>
      <CardHeader><CardTitle>{title} Overview</CardTitle></CardHeader>
      <CardContent className="text-sm text-slate-600">Mock demo content for {title.toLowerCase()}.</CardContent>
    </Card>
  </div>
);

export const CompanyPostingsPage = () => <CompanyPageTemplate title="Company Postings" subtitle="Review and manage internship postings." />;
