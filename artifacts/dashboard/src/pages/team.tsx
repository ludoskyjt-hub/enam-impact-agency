import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Plus, Trash2, Shield, BookOpen, User, Loader2 } from "lucide-react";

interface TeamMember {
  id: number;
  email: string;
  companyName: string;
  role: string;
  phone: string | null;
  createdAt: string;
}

const apiCall = async (path: string, options: RequestInit = {}) => {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erreur inconnue" }));
    throw new Error((err as { error?: string }).error ?? "Erreur");
  }
  return res.status === 204 ? null : res.json();
};

function RoleBadge({ role }: { role: string }) {
  const { t } = useI18n();
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    admin: {
      label: t.team.adminBadge,
      className: "bg-yellow-400/15 text-yellow-400 border-yellow-400/30",
      icon: <Shield className="w-3 h-3" />,
    },
    accountant: {
      label: t.team.accountantBadge,
      className: "bg-blue-400/15 text-blue-400 border-blue-400/30",
      icon: <BookOpen className="w-3 h-3" />,
    },
    employee: {
      label: t.team.employeeBadge,
      className: "bg-green-400/15 text-green-400 border-green-400/30",
      icon: <User className="w-3 h-3" />,
    },
  };
  const entry = map[role] ?? map.employee;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${entry.className}`}>
      {entry.icon}
      {entry.label}
    </span>
  );
}

export default function TeamPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"accountant" | "employee">("employee");
  const [phone, setPhone] = useState("");

  const { data: members = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["team-members"],
    queryFn: () => apiCall("/team/members"),
  });

  const addMutation = useMutation({
    mutationFn: () => apiCall("/team/members", {
      method: "POST",
      body: JSON.stringify({ email, password, role, phone: phone || undefined }),
    }),
    onSuccess: () => {
      toast({ title: t.team.addedSuccess });
      qc.invalidateQueries({ queryKey: ["team-members"] });
      setEmail(""); setPassword(""); setPhone(""); setRole("employee");
      setShowForm(false);
    },
    onError: (e: Error) => toast({ title: t.team.addError, description: e.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => apiCall(`/team/members/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: t.team.removedSuccess });
      qc.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (e: Error) => toast({ title: t.team.removeError, description: e.message, variant: "destructive" }),
  });

  const roleDescMap: Record<string, string> = {
    admin: t.team.roleDescAdmin,
    accountant: t.team.roleDescAccountant,
    employee: t.team.roleDescEmployee,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="w-6 h-6 text-primary" />
            {t.team.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t.team.subtitle}</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t.team.addMember}
        </Button>
      </div>

      {/* Add member form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.team.addMember}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.team.email}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="utilisateur@entreprise.bj"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.team.password}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.team.role}</Label>
                <Select value={role} onValueChange={v => setRole(v as "accountant" | "employee")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">
                      <span className="flex flex-col">
                        <span>{t.team.employeeBadge}</span>
                        <span className="text-xs text-muted-foreground">{t.team.roleDescEmployee}</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="accountant">
                      <span className="flex flex-col">
                        <span>{t.team.accountantBadge}</span>
                        <span className="text-xs text-muted-foreground">{t.team.roleDescAccountant}</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.employees.phone}</Label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+229 97 00 00 00"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => addMutation.mutate()}
                disabled={!email || !password || addMutation.isPending}
              >
                {addMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{t.team.adding}</>
                ) : t.team.addBtn}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>{t.common.cancel}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(["admin", "accountant", "employee"] as const).map(r => (
          <Card key={r} className="border-muted/50">
            <CardContent className="pt-4 pb-3 flex items-start gap-3">
              <div className="mt-0.5">
                {r === "admin" && <Shield className="w-5 h-5 text-yellow-400" />}
                {r === "accountant" && <BookOpen className="w-5 h-5 text-blue-400" />}
                {r === "employee" && <User className="w-5 h-5 text-green-400" />}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {r === "admin" ? t.team.adminBadge : r === "accountant" ? t.team.accountantBadge : t.team.employeeBadge}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{roleDescMap[r]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Members list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {members.length} {members.length <= 1 ? t.team.memberSingular : t.team.memberPlural}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.common.loading}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCog className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t.team.noMembers}</p>
              <p className="text-sm">{t.team.noMembersDesc}</p>
            </div>
          ) : (
            <div className="divide-y">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">{member.email}</span>
                        {member.id === user?.id && (
                          <Badge variant="outline" className="text-xs py-0">{t.team.youBadge}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <RoleBadge role={member.role} />
                        {member.phone && (
                          <span className="text-xs text-muted-foreground">{member.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {member.id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 shrink-0"
                      onClick={() => removeMutation.mutate(member.id)}
                      disabled={removeMutation.isPending}
                    >
                      {removeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">{t.team.remove}</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
