import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { LC } from "./lc-types";

export function useLCs(): LC[] {
  const { data } = useQuery({
    queryKey: ["lcs"],
    queryFn: () => api.listLCs(),
    refetchInterval: 15_000,
  });
  return data ?? [];
}

export function useLC(id: string): LC | undefined {
  const { data: lc } = useQuery({
    queryKey: ["lcs", id],
    queryFn: () => api.getLC(id),
    enabled: !!id,
  });
  const { data: history } = useQuery({
    queryKey: ["lcs", id, "history"],
    queryFn: () => api.getHistory(id),
    enabled: !!id,
  });
  if (!lc) return undefined;
  return { ...lc, history: history ?? [] };
}

export function useInvalidateLCs() {
  const qc = useQueryClient();
  return (lcId?: string) => {
    qc.invalidateQueries({ queryKey: ["lcs"] });
    if (lcId) {
      qc.invalidateQueries({ queryKey: ["lcs", lcId] });
      qc.invalidateQueries({ queryKey: ["lcs", lcId, "history"] });
    }
  };
}
