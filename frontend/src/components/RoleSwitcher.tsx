import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from "@/lib/role-context";
import { ROLES } from "@/lib/lc-store";
import type { Role } from "@/lib/lc-types";
import { UserCircle2 } from "lucide-react";

const roleOrg: Record<Role, string> = {
  "Bank Officer": "Importer's Bank",
  "Exporter Company": "Exporter's Bank",
  "Customs Officer": "Customs Authority",
  "Importer Company": "Importer's Bank",
};

export function RoleSwitcher() {
  const { role, setRole } = useRole();
  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:block text-right">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Acting as</div>
        <div className="text-xs text-muted-foreground">{roleOrg[role]}</div>
      </div>
      <Select value={role} onValueChange={(v) => setRole(v as Role)}>
        <SelectTrigger className="w-[200px]">
          <UserCircle2 className="h-4 w-4 mr-1 text-accent" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
