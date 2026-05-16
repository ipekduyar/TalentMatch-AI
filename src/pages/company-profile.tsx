import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/lib/auth-context";
import { toast } from "sonner";

export const CompanyProfilePage = () => {
  const { company, user, rep } = useCurrentUser();
  const [form, setForm] = useState({
    name: company?.name ?? "",
    website: company?.website ?? "",
    location: company?.location ?? "",
    industry: company?.industry ?? "",
    description: company?.description ?? "",
    repName: `${user?.first_name ?? ""} ${user?.last_name ?? ""}`,
    repTitle: rep?.job_title ?? "",
    repEmail: user?.email ?? "",
  });
  return <div className="max-w-7xl mx-auto space-y-6"> 
    <div><h1 className="text-3xl font-bold text-slate-900">Company Profile</h1><p className="text-slate-500">Manage brand profile and employer details.</p></div>
    <Card>
      <CardContent className="p-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Avatar className="w-20 h-20"><AvatarImage src={company?.logo_url || undefined} /><AvatarFallback>{company?.name.slice(0, 2)}</AvatarFallback></Avatar>
          <div><h2 className="text-xl font-semibold text-slate-900">{company?.name}</h2><p className="text-sm text-slate-500">{company?.industry} • {company?.location}</p></div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={company?.is_approved ? "success" : "warning"}>{company?.is_approved ? "Approved" : "Pending Approval"}</Badge>
            <Badge variant={company?.is_premium ? "default" : "outline"}>{company?.is_premium ? "Premium" : "Free"}</Badge>
          </div>
          <p className="text-sm text-slate-600">Avg evaluation score: <span className="font-semibold text-slate-900">{company?.avg_evaluation_score}/5</span></p>
          <p className="text-sm text-slate-600">Company size: <span className="font-semibold text-slate-900">{company?.size}</span></p>
        </div>
        <div className="md:col-span-2 space-y-5">
          <CardHeader className="px-0 pt-0"><CardTitle>Edit Company Profile</CardTitle></CardHeader>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(form).map(([k,v]) => (
              <div key={k} className={k === "description" ? "md:col-span-2" : ""}>
                <label className="text-xs text-slate-500 capitalize">{k}</label>
                <Input value={v} onChange={(e)=>setForm((prev)=>({ ...prev, [k]: e.target.value }))} className="mt-1" />
              </div>
            ))}
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => toast.success("Company profile changes saved")}>Save changes</Button>
        </div>
      </CardContent>
    </Card>
  </div>;
};
