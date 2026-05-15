import type { ExpenseStatus, ExpenseDgiStatus } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw } from "lucide-react";

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  switch (status) {
    case "validated":
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 gap-1"><CheckCircle2 className="w-3 h-3"/> Validated</Badge>;
    case "rejected":
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 gap-1"><XCircle className="w-3 h-3"/> Rejected</Badge>;
    case "synced":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 gap-1"><RefreshCw className="w-3 h-3"/> Synced</Badge>;
    case "pending":
    default:
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 gap-1"><Clock className="w-3 h-3"/> Pending</Badge>;
  }
}

export function DgiStatusBadge({ status }: { status?: ExpenseDgiStatus | null }) {
  if (!status) return null;
  switch (status) {
    case "normalized":
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 gap-1 font-mono text-xs"><CheckCircle2 className="w-3 h-3"/> NORMALIZED</Badge>;
    case "failed":
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 gap-1 font-mono text-xs"><XCircle className="w-3 h-3"/> FAILED</Badge>;
    case "pending":
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 gap-1 font-mono text-xs"><AlertCircle className="w-3 h-3"/> PENDING</Badge>;
    case "not_submitted":
    default:
      return <Badge variant="outline" className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200 gap-1 font-mono text-xs">NOT SUBMITTED</Badge>;
  }
}
