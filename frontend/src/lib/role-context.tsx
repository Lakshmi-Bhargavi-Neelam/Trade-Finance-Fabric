import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role } from "./lc-types";
import { ROLES } from "./lc-store";

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
}

const Ctx = createContext<RoleCtx>({ role: "Bank Officer", setRole: () => {} });

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("Bank Officer");

  useEffect(() => {
    const stored = localStorage.getItem("tff.role");
    if (stored && (ROLES as string[]).includes(stored)) setRoleState(stored as Role);
  }, []);

  const setRole = (r: Role) => {
    setRoleState(r);
    localStorage.setItem("tff.role", r);
  };

  return <Ctx.Provider value={{ role, setRole }}>{children}</Ctx.Provider>;
}

export const useRole = () => useContext(Ctx);
