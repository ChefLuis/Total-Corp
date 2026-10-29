import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** true quando as variáveis do Supabase existem → o app usa login e banco reais. */
export const isSupabaseConfigured = Boolean(url && key);

// A chave "publishable" é pública por desenho; quem protege os dados é o RLS no banco.
export const supabase = createClient(url || 'http://localhost', key || 'sem-chave', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Traduz erros técnicos em mensagens humanas, em português. */
export function humanError(err: unknown): string {
  const msg = String((err as { message?: string })?.message ?? err ?? '').toLowerCase();
  if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos. Confira e tente de novo.';
  if (msg.includes('email not confirmed')) return 'Falta confirmar seu e-mail. Procure o link que enviamos na sua caixa de entrada (e no spam).';
  if (msg.includes('user already registered')) return 'Já existe uma conta com esse e-mail. Que tal entrar?';
  if (msg.includes('password should be at least')) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.';
  if (msg.includes('network') || msg.includes('failed to fetch')) return 'Não consegui falar com o servidor. Verifique sua internet e tente de novo.';
  if (msg.includes('horario_indisponivel')) return 'Esse horário acabou de ser ocupado. Escolha outro, por favor.';
  if (msg.includes('horario_bloqueado')) return 'Esse horário está bloqueado para a profissional.';
  if (msg.includes('antecedencia_minima_1h')) return 'Os agendamentos precisam ser feitos com pelo menos 1 hora de antecedência.';
  if (msg.includes('consentimento_lgpd_obrigatorio')) return 'Para agendar, precisamos do seu aceite da política de privacidade.';
  if (msg.includes('violates foreign key')) return 'Não dá para excluir: existem agendamentos ou registros ligados a este item. Você pode desativá-lo em vez de excluir.';
  if (msg.includes('row-level security') || msg.includes('permission denied')) return 'Você não tem permissão para fazer isso. Fale com o responsável pela conta.';
  if (msg.includes('duplicate key') || msg.includes('already exists') || msg.includes('23505')) return 'Esse endereço já está em uso. Escolha outro.';
  if (msg.includes('usuario_ja_possui_empresa')) return 'Sua conta já tem uma empresa criada.';
  return 'Algo não saiu como esperado. Tente novamente em instantes.';
}

/** Violação de unicidade (ex.: telefone já cadastrado). */
export const isDuplicate = (err: unknown) => {
  const e = err as { code?: string; message?: string };
  return e?.code === '23505' || String(e?.message || '').toLowerCase().includes('duplicate key');
};
