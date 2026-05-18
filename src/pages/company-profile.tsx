import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getCurrentCompanyContext, updateCompanyProfile } from "@/lib/company-profile-service";

const fallback = (value?: string | null) => (value && value.trim() ? value : "Not provided");

export const CompanyProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readonlyData, setReadonlyData] = useState({ representativeName: "Not provided", representativeEmail: "Not provided" });
  const [formData, setFormData] = useState({ companyName: "", industry: "", location: "", companySize: "", website: "", description: "", representativeJobTitle: "" });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const context = await getCurrentCompanyContext();
        setFormData({
          companyName: context.company.name ?? "",
          industry: context.company.industry ?? "",
          location: context.company.location ?? "",
          companySize: context.company.size ?? "",
          website: context.company.website ?? "",
          description: context.company.description ?? "",
          representativeJobTitle: context.representative.job_title ?? "",
        });
        setReadonlyData({
          representativeName: [context.person.first_name, context.person.last_name].filter(Boolean).join(" ") || "Not provided",
          representativeEmail: context.person.email || context.user.email || "Not provided",
        });
      } catch (err: any) {
        setError(err?.message || "Could not load company profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = (key: keyof typeof formData, value: string) => setFormData((prev) => ({ ...prev, [key]: value }));

  const saveChanges = async () => {
    try {
      await updateCompanyProfile({
        company: {
          name: formData.companyName,
          industry: formData.industry,
          location: formData.location,
          size: formData.companySize,
          website: formData.website,
          description: formData.description,
        },
        representativeJobTitle: formData.representativeJobTitle,
      });
      toast.success("Company profile updated.");
    } catch (err: any) {
      toast.error(err?.message || "Could not save company profile.");
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto text-slate-600">Loading company profile...</div>;
  if (error) return <div className="max-w-7xl mx-auto text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-3xl font-bold text-slate-900">Company Profile</h1><p className="text-slate-500">Manage your company information.</p></div>
      <Card className="bg-white rounded-xl"><CardHeader><CardTitle className="text-slate-900">Company Information</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
        <p><span className="font-semibold text-slate-900">Company Name:</span> {fallback(formData.companyName)}</p>
        <p><span className="font-semibold text-slate-900">Industry:</span> {fallback(formData.industry)}</p>
        <p><span className="font-semibold text-slate-900">Location:</span> {fallback(formData.location)}</p>
        <p><span className="font-semibold text-slate-900">Company Size:</span> {fallback(formData.companySize)}</p>
        <p><span className="font-semibold text-slate-900">Website:</span> {fallback(formData.website)}</p>
        <p><span className="font-semibold text-slate-900">Representative:</span> {readonlyData.representativeName}</p>
        <p><span className="font-semibold text-slate-900">Representative Email:</span> {readonlyData.representativeEmail}</p>
        <p><span className="font-semibold text-slate-900">Representative Job Title:</span> {fallback(formData.representativeJobTitle)}</p>
        <p className="md:col-span-2"><span className="font-semibold text-slate-900">Description:</span> {fallback(formData.description)}</p>
      </CardContent></Card>

      <Card className="bg-white rounded-xl"><CardHeader><CardTitle className="text-slate-900">Edit Profile</CardTitle></CardHeader><CardContent className="space-y-4">
        <Input value={formData.companyName} onChange={(e) => onChange("companyName", e.target.value)} placeholder="Company Name" />
        <Input value={formData.industry} onChange={(e) => onChange("industry", e.target.value)} placeholder="Industry" />
        <Input value={formData.location} onChange={(e) => onChange("location", e.target.value)} placeholder="Location" />
        <Input value={formData.companySize} onChange={(e) => onChange("companySize", e.target.value)} placeholder="Company Size" />
        <Input value={formData.website} onChange={(e) => onChange("website", e.target.value)} placeholder="Website" />
        <Input value={formData.representativeJobTitle} onChange={(e) => onChange("representativeJobTitle", e.target.value)} placeholder="Representative Job Title" />
        <textarea value={formData.description} onChange={(e) => onChange("description", e.target.value)} className="w-full min-h-24 rounded-md border border-slate-200 px-3 py-2" placeholder="Company Description" />
        <Button onClick={saveChanges} className="bg-blue-600 text-white hover:bg-blue-700">Save changes</Button>
      </CardContent></Card>
    </div>
  );
};
