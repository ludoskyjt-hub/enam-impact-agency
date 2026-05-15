import { useState } from "react";
import { useGetEmployees, useCreateEmployee, useReimburseEmployee, getGetEmployeesQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Phone, Smartphone, Loader2, Send, ShieldAlert, ChevronDown, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatFCFA } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { getToken } from "@/lib/auth";

type LimitRow = { id: number; period: string; maxAmount: number; spent: number; percentage: number; overLimit: boolean };

function EmployeeLimitsSection({ empId }: { empId: number }) {
  const { toast } = useToast();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<"monthly" | "weekly" | "daily">("monthly");
  const [amount, setAmount] = useState("");
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const { data: limits = [], refetch } = useQuery<LimitRow[]>({
    queryKey: ["employee-limits", empId],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${empId}/limits`, { headers });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  const addMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/employees/${empId}/limits`, {
        method: "POST", headers,
        body: JSON.stringify({ period, maxAmount: parseFloat(amount) }),
      });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: () => { refetch(); setAmount(""); toast({ title: t.employees.limitAdded }); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/employees/${empId}/limits/${id}`, { method: "DELETE", headers });
    },
    onSuccess: () => { refetch(); toast({ title: t.employees.limitRemoved }); },
  });

  const periodLabel: Record<string, string> = {
    monthly: t.employees.limitMonthly,
    weekly: t.employees.limitWeekly,
    daily: t.employees.limitDaily,
  };

  return (
    <div className="border-t pt-2 mt-1">
      <button
        className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          {t.employees.limitsTitle}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {limits.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-1">{t.employees.noLimits}</p>
          )}
          {limits.map(lim => (
            <div key={lim.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{periodLabel[lim.period] ?? lim.period}</span>
                <div className="flex items-center gap-1.5">
                  {lim.overLimit && (
                    <Badge variant="destructive" className="text-[10px] h-4 py-0">{t.employees.limitOverLimit}</Badge>
                  )}
                  <span className="font-mono text-muted-foreground">
                    {formatFCFA(lim.spent)} / {formatFCFA(lim.maxAmount)}
                  </span>
                  <button
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => deleteMut.mutate(lim.id)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${lim.overLimit ? "bg-destructive" : lim.percentage > 75 ? "bg-amber-500" : "bg-primary"}`}
                  style={{ width: `${lim.percentage}%` }}
                />
              </div>
            </div>
          ))}

          <div className="flex gap-1.5 pt-1">
            <Select value={period} onValueChange={v => setPeriod(v as "monthly" | "weekly" | "daily")}>
              <SelectTrigger className="h-7 text-xs w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{t.employees.limitMonthly}</SelectItem>
                <SelectItem value="weekly">{t.employees.limitWeekly}</SelectItem>
                <SelectItem value="daily">{t.employees.limitDaily}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              className="h-7 text-xs flex-1"
              placeholder="FCFA"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="1"
            />
            <Button
              size="sm"
              className="h-7 text-xs px-2"
              disabled={!amount || addMut.isPending}
              onClick={() => addMut.mutate()}
            >
              {addMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : t.employees.limitAdd}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Employees() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const [addOpen, setAddOpen] = useState(false);
  const [reimburseOpen, setReimburseOpen] = useState<number | null>(null);
  const [reimburseAmount, setReimburseAmount] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<string>("");
  const [momoNumber, setMomoNumber] = useState("");

  const { data: employees, isLoading } = useGetEmployees({ query: { queryKey: getGetEmployeesQueryKey() } } as any);
  const createEmployee = useCreateEmployee();
  const reimburseEmployee = useReimburseEmployee();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createEmployee.mutate({
      data: {
        name, email, phone,
        ...(provider ? { mobileMoneyProvider: provider as "mtn_momo" | "moov_money" } : {}),
        ...(momoNumber ? { mobileMoneyNumber: momoNumber } : {}),
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() });
        toast({ title: `${name} ${t.employees.addedSuccess}` });
        setAddOpen(false);
        setName(""); setEmail(""); setPhone(""); setProvider(""); setMomoNumber("");
      },
      onError: () => toast({ title: t.employees.addError, variant: "destructive" })
    });
  };

  const handleReimburse = (id: number) => {
    if (!reimburseAmount) return;
    reimburseEmployee.mutate({ id, data: { amount: parseFloat(reimburseAmount), expenseIds: [] } }, {
      onSuccess: (result) => {
        toast({ title: t.employees.reimburseSuccess, description: result.message });
        setReimburseOpen(null);
        setReimburseAmount("");
      },
      onError: () => toast({ title: t.employees.reimburseError, variant: "destructive" })
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.employees.title}</h1>
          <p className="text-muted-foreground mt-1">{employees?.length ?? 0} {t.employees.count}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-employee">
              <Plus className="w-4 h-4" />
              {t.employees.addEmployee}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.employees.addTitle}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>{t.employees.name}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Kossi Agbeko" required data-testid="input-employee-name" />
              </div>
              <div className="space-y-2">
                <Label>{t.employees.email}</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="kossi@entreprise.bj" required data-testid="input-employee-email" />
              </div>
              <div className="space-y-2">
                <Label>{t.employees.phone}</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+22961234567" required data-testid="input-employee-phone" />
              </div>
              <div className="space-y-2">
                <Label>{t.employees.momoProvider}</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger data-testid="select-provider">
                    <SelectValue placeholder={t.employees.momoProviderPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mtn_momo">MTN MoMo</SelectItem>
                    <SelectItem value="moov_money">Moov Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {provider && (
                <div className="space-y-2">
                  <Label>{t.employees.momoNumber}</Label>
                  <Input value={momoNumber} onChange={e => setMomoNumber(e.target.value)} placeholder="+22961234567" data-testid="input-momo-number" />
                </div>
              )}
              <Button type="submit" disabled={createEmployee.isPending} className="w-full" data-testid="button-submit-employee">
                {createEmployee.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t.employees.submit}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : !employees || employees.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground font-medium">{t.employees.noEmployees}</p>
            <p className="text-sm text-muted-foreground mt-1">{t.employees.noEmployeesDesc}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map(emp => (
            <Card key={emp.id} className="hover:shadow-md transition-shadow" data-testid={`card-employee-${emp.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {emp.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </div>
                  <Badge variant="outline" className="text-xs">{emp.role}</Badge>
                </div>
                <div className="mt-2">
                  <CardTitle className="text-base" data-testid={`text-employee-name-${emp.id}`}>{emp.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{emp.email}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{emp.phone}</span>
                </div>
                {emp.mobileMoneyProvider && (
                  <div className="flex items-center gap-2 text-sm">
                    <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {emp.mobileMoneyProvider === "mtn_momo" ? "MTN MoMo" : "Moov Money"}
                      {emp.mobileMoneyNumber ? ` · ${emp.mobileMoneyNumber}` : ""}
                    </span>
                  </div>
                )}
                <EmployeeLimitsSection empId={emp.id} />
                <Dialog open={reimburseOpen === emp.id} onOpenChange={(open) => { setReimburseOpen(open ? emp.id : null); setReimburseAmount(""); }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full gap-2" data-testid={`button-reimburse-${emp.id}`}>
                      <Send className="w-3.5 h-3.5" />
                      {t.employees.reimburse}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.employees.reimburseTitle} — {emp.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <p className="text-sm text-muted-foreground">
                        {t.employees.reimburseDesc} {emp.mobileMoneyProvider === "mtn_momo" ? "MTN MoMo" : emp.mobileMoneyProvider === "moov_money" ? "Moov Money" : "Mobile Money"} au {emp.mobileMoneyNumber ?? emp.phone}.
                      </p>
                      <div className="space-y-2">
                        <Label>{t.employees.reimburseAmount}</Label>
                        <Input
                          type="number"
                          value={reimburseAmount}
                          onChange={e => setReimburseAmount(e.target.value)}
                          placeholder="Ex: 15000"
                          min="1"
                          data-testid="input-reimburse-amount"
                        />
                      </div>
                      {reimburseAmount && <p className="text-sm font-bold text-primary">{formatFCFA(parseFloat(reimburseAmount))}</p>}
                      <Button
                        onClick={() => handleReimburse(emp.id)}
                        disabled={reimburseEmployee.isPending || !reimburseAmount}
                        className="w-full gap-2"
                        data-testid="button-confirm-reimburse"
                      >
                        {reimburseEmployee.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {t.employees.reimburseBtn}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
