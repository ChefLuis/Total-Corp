import React, { useState } from 'react';
import { supabase, humanError } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Loader2, CalendarCheck, LogOut } from 'lucide-react';

const slugify = (v: string) =>
  v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-slate-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-sm">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Total Corp</span>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1 mb-5">{subtitle}</p>
          {children}
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-4">
          Seus dados são protegidos e tratados conforme a LGPD.
        </p>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600';
const btnCls =
  'w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors';

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo('');
    if (mode !== 'reset' && password.length < 8) { setError('A senha precisa ter pelo menos 8 caracteres.'); return; }
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
      } else if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(), password, options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        if (!data.session) setInfo('Pronto! Enviamos um link de confirmação para o seu e-mail. Clique nele para ativar a conta e depois entre aqui.');
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
        if (err) throw err;
        setInfo('Se esse e-mail estiver cadastrado, você receberá um link para criar uma nova senha.');
      }
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(false);
    }
  };

  const titles = {
    login: ['Que bom te ver por aqui! 👋', 'Entre para cuidar da sua agenda e dos seus clientes.'],
    signup: ['Vamos começar?', 'Crie sua conta — leva menos de um minuto e você já ganha 7 dias de teste grátis.'],
    reset: ['Sem problemas, acontece!', 'Informe seu e-mail e enviaremos um link para você criar uma nova senha.'],
  } as const;

  return (
    <Shell title={titles[mode][0]} subtitle={titles[mode][1]}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-700">E-mail</label>
          <input className={inputCls} type="email" required autoComplete="email" value={email}
                 onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com.br" />
        </div>
        {mode !== 'reset' && (
          <div>
            <label className="text-xs font-medium text-slate-700">Senha</label>
            <input className={inputCls} type="password" required minLength={8}
                   autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                   value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" />
          </div>
        )}
        {error && <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        {info && <div role="status" className="text-sm text-teal-900 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">{info}</div>}
        <button type="submit" disabled={busy} className={btnCls}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar minha conta' : 'Enviar link'}
        </button>
      </form>
      <div className="mt-4 flex flex-col items-center gap-1.5 text-sm">
        {mode === 'login' && (
          <>
            <button className="text-teal-700 hover:underline" onClick={() => { setMode('reset'); setError(''); setInfo(''); }}>Esqueci minha senha</button>
            <button className="text-slate-600 hover:underline" onClick={() => { setMode('signup'); setError(''); setInfo(''); }}>Ainda não tenho conta</button>
          </>
        )}
        {mode !== 'login' && (
          <button className="text-teal-700 hover:underline" onClick={() => { setMode('login'); setError(''); setInfo(''); }}>Voltar para o login</button>
        )}
      </div>
    </Shell>
  );
}

export function CreateCompanyPage() {
  const { refreshAccount, signOut } = useAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onName = (v: string) => { setName(v); if (!slugTouched) setSlug(slugify(v)); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) { setError('Conte para a gente o nome do seu negócio.'); return; }
    if (slug.length < 3) { setError('O endereço precisa ter pelo menos 3 letras ou números.'); return; }
    setBusy(true);
    const { error: err } = await supabase.rpc('create_company_for_user', { p_name: name.trim(), p_slug: slug });
    if (err) { setError(humanError(err)); setBusy(false); return; }
    await refreshAccount();
    setBusy(false);
  };

  return (
    <Shell title="Quase lá! Qual é o nome do seu negócio?" subtitle="Vamos criar o seu espaço no Total Corp. Você poderá alterar os detalhes depois.">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-700">Nome do negócio</label>
          <input className={inputCls} required value={name} onChange={(e) => onName(e.target.value)} placeholder="Ex.: Naturo SPA" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">Endereço da sua página de agendamento</label>
          <div className="flex items-center rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-teal-600 overflow-hidden">
            <span className="pl-3 text-xs text-slate-400 whitespace-nowrap">{window.location.host}/</span>
            <input className="flex-1 px-1 py-2.5 text-sm outline-none" required value={slug}
                   onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} placeholder="naturo-spa" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">É por esse link que seus clientes vão agendar sozinhos.</p>
        </div>
        {error && <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <button type="submit" disabled={busy} className={btnCls}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Criar meu espaço
        </button>
      </form>
      <button onClick={signOut} className="mt-4 mx-auto flex items-center gap-1.5 text-xs text-slate-500 hover:underline">
        <LogOut className="w-3.5 h-3.5" /> Sair desta conta
      </button>
    </Shell>
  );
}

export function SplashScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm gap-2">
      <Loader2 className="w-4 h-4 animate-spin" /> Carregando o seu espaço...
    </div>
  );
}
