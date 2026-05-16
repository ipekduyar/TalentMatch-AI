import { useState } from "react";
import { useCurrentUser } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const CompanyProfilePage = () => {
  const { company } = useCurrentUser();
  const [formData, setFormData] = useState({
    companyName: company?.name ?? "Nexora Labs",
    industry: "Software Development",
    location: "Austin, Texas",
    companySize: "201-500 employees",
    website: "https://www.nexoralabs.com",
    approvalStatus: "Approved",
    premiumStatus: "Premium Active",
    averageScore: "4.7 / 5.0",
    description:
      "Nexora Labs builds AI-powered talent and workforce tools that help organizations hire faster and retain top performers through data-informed decisions.",
    representativeName: "Elena Park",
    representativeEmail: "elena.park@nexoralabs.com",
    representativeJobTitle: "Director of Talent Acquisition",
  });

  const initials = formData.companyName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const onInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const saveChanges = () => {
    toast.success("Company profile changes saved successfully.");
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="rounded-xl border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-slate-900">Company Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-blue-100 text-blue-700">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-900">{formData.companyName}</h2>
                <p className="text-sm text-slate-600">{formData.industry}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{formData.approvalStatus}</Badge>
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">{formData.premiumStatus}</Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Location</p>
              <p className="text-sm text-slate-800">{formData.location}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Company Size</p>
              <p className="text-sm text-slate-800">{formData.companySize}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Website</p>
              <a href={formData.website} className="text-sm text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                {formData.website}
              </a>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Average Evaluation Score</p>
              <p className="text-sm text-slate-800">{formData.averageScore}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Company Description</p>
            <p className="text-sm leading-6 text-slate-700">{formData.description}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-slate-900">Edit Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input value={formData.companyName} onChange={(event) => onInputChange("companyName", event.target.value)} placeholder="Company Name" />
            <Input value={formData.industry} onChange={(event) => onInputChange("industry", event.target.value)} placeholder="Industry" />
            <Input value={formData.location} onChange={(event) => onInputChange("location", event.target.value)} placeholder="Location" />
            <Input value={formData.companySize} onChange={(event) => onInputChange("companySize", event.target.value)} placeholder="Company Size" />
            <Input value={formData.website} onChange={(event) => onInputChange("website", event.target.value)} placeholder="Website" />
            <Input value={formData.averageScore} onChange={(event) => onInputChange("averageScore", event.target.value)} placeholder="Average Evaluation Score" />
            <Input value={formData.representativeName} onChange={(event) => onInputChange("representativeName", event.target.value)} placeholder="Representative Name" />
            <Input value={formData.representativeEmail} onChange={(event) => onInputChange("representativeEmail", event.target.value)} placeholder="Representative Email" />
            <Input value={formData.representativeJobTitle} onChange={(event) => onInputChange("representativeJobTitle", event.target.value)} placeholder="Representative Job Title" />
            <Input value={formData.approvalStatus} onChange={(event) => onInputChange("approvalStatus", event.target.value)} placeholder="Approval Status" />
            <Input value={formData.premiumStatus} onChange={(event) => onInputChange("premiumStatus", event.target.value)} placeholder="Premium Status" />
            <Input value={formData.description} onChange={(event) => onInputChange("description", event.target.value)} placeholder="Company Description" />
          </div>

          <div className="pt-2">
            <Button onClick={saveChanges} className="bg-blue-600 text-white hover:bg-blue-700">
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
