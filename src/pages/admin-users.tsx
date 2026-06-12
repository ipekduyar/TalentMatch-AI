import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminUsers, type AdminUser } from "@/lib/admin-service";

const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value)) : "—";
const roleOptions = ["all", "student", "company_rep", "admin"];

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAdminUsers();
        if (mounted) setUsers(data);
      } catch (err: any) {
        if (mounted) setError(err?.message || "Could not load users.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = role === "all" || user.role === role;
      const haystack = [user.first_name, user.last_name, user.email, user.company_name, user.university].filter(Boolean).join(" ").toLowerCase();
      return matchesRole && (!q || haystack.includes(q));
    });
  }, [role, search, users]);

  if (isLoading) return <div className="space-y-4"><h1 className="text-3xl font-black">Users</h1>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;
  if (error) return <ErrorState title="Users" message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">Admin</p>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">Users</h1>
        <p className="text-sm text-slate-500">Read-only view of all registered platform users.</p>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, company, or university" className="pl-9" />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
            {roleOptions.map((option) => <option key={option} value={option}>{option === "all" ? "All roles" : option.replace("_", " ")}</option>)}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{filteredUsers.length} users</CardTitle></CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No users match the selected filters.</p>
          ) : (
            <div className="divide-y">
              {filteredUsers.map((user) => (
                <div key={user.person_id} className="grid gap-4 p-4 md:grid-cols-[1.2fr_1fr_0.9fr_0.8fr] md:items-center">
                  <div>
                    <p className="font-black text-slate-900">{[user.first_name, user.last_name].filter(Boolean).join(" ") || "Unnamed user"}</p>
                    <p className="text-sm text-slate-500">{user.email || "No email"}</p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>{user.company_name || user.university || "No related profile"}</p>
                    <p className="text-xs text-slate-400">{user.department || user.representative_job_title || "—"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={user.role === "admin" ? "warning" : user.role === "company_rep" ? "indigo" : "secondary"}>{user.role.replace("_", " ")}</Badge>
                    <Badge variant={user.kvkk_consent ? "success" : "destructive"}>KVKK</Badge>
                    <Badge variant={user.terms_consent ? "success" : "destructive"}>Terms</Badge>
                  </div>
                  <p className="text-sm font-bold text-slate-500">{formatDate(user.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ErrorState = ({ title, message }: { title: string; message: string }) => (
  <Card><CardContent className="flex gap-3 p-6 text-rose-700"><AlertCircle className="h-5 w-5" /><div><h1 className="font-black">{title}</h1><p className="text-sm">{message}</p></div></CardContent></Card>
);
