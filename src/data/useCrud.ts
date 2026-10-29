import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type CrudTable = 'clients' | 'services' | 'professionals' | 'service_categories';
type Row = { id: string; company_id: string };

// Modo demonstração: dados de exemplo vivem só na memória desta aba.
const demoStore: Record<string, Row[]> = {};
const demoRows = <T extends Row>(table: CrudTable, seed: T[]): T[] => {
  if (!demoStore[table]) demoStore[table] = structuredClone(seed);
  return demoStore[table] as T[];
};

/** Lista + criar/editar/excluir de uma tabela da empresa (banco real ou demo). */
export function useCrud<T extends Row>(table: CrudTable, companyId: string, seed: T[], orderBy = 'created_at') {
  const qc = useQueryClient();
  const key = [table, companyId];
  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const list = useQuery({
    queryKey: key,
    enabled: companyId !== 'guest',
    queryFn: async (): Promise<T[]> => {
      if (!isSupabaseConfigured) return demoRows<T>(table, seed).filter((r) => r.company_id === companyId);
      const { data, error } = await supabase.from(table).select('*').eq('company_id', companyId).order(orderBy, { ascending: true });
      if (error) throw error;
      return (data || []) as T[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: Partial<T>): Promise<T> => {
      if (!isSupabaseConfigured) {
        const row = { ...input, id: crypto.randomUUID(), company_id: companyId } as T;
        demoRows<T>(table, seed).push(row);
        return row;
      }
      const { data, error } = await supabase.from(table).insert({ ...input, company_id: companyId }).select().single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<T> }) => {
      if (!isSupabaseConfigured) {
        const rows = demoRows<T>(table, seed);
        const i = rows.findIndex((r) => r.id === id);
        if (i >= 0) rows[i] = { ...rows[i], ...patch };
        return;
      }
      const { error } = await supabase.from(table).update(patch as Record<string, unknown>).eq('id', id).eq('company_id', companyId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) {
        const rows = demoRows<T>(table, seed);
        const i = rows.findIndex((r) => r.id === id);
        if (i >= 0) rows.splice(i, 1);
        return;
      }
      const { error } = await supabase.from(table).delete().eq('id', id).eq('company_id', companyId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { items: list.data ?? [], isLoading: list.isLoading, loadError: list.error, create, update, remove };
}
