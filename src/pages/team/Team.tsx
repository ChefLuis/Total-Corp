import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { useCrud } from '../../data/useCrud';
import { INITIAL_PROFESSIONALS } from '../../services/mockData';
import { Professional } from '../../types';
import { humanError } from '../../lib/supabase';
import { Modal, Field, ErrorBox, EmptyState, inputCls, primaryBtn, ghostBtn } from '../../components/ui/Modal';
import { UserCheck, Plus, Percent, Calendar, Loader2 } from 'lucide-react';

type Crud = ReturnType<typeof useCrud<Professional>>;
const COLORS = ['#0F766E', '#0284C7', '#7C3AED', '#DB2777', '#EA580C', '#CA8A04', '#16A34A', '#475569'];

function ProfessionalForm({ initial, crud, onClose }: { initial?: Professional; crud: Crud; onClose: () => void }) {
  const { units } = useAuth();
  const [name, setName] = useState(initial?.name ?? '');
  const [roleTitle, setRoleTitle] = useState(initial?.role_title ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [commission, setCommission] = useState(String(initial?.commission_rate ?? 0));
  const [specialties, setSpecialties] = useState((initial?.specialties ?? []).join(', '));
  const [color, setColor] = useState(initial?.color_tag ?? COLORS[crud.items.length % COLORS.length]);
  const [email, setEmail] = useState(initial?.email ?? '');
  const [pix, setPix] = useState(initial?.pix_key ?? '');
  const [unitIds, setUnitIds] = useState<string[]>(initial?.unit_ids ?? []);
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggleUnit = (id: string) => setUnitIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const rate = parseFloat(commission.replace(',', '.'));
    if (name.trim().length < 2) return setError('Informe o nome da profissional.');
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return setError('A comissão deve ficar entre 0% e 100%.');
    const payload = {
      name: name.trim(), role_title: roleTitle.trim() || null, bio: bio.trim() || null, commission_rate: rate,
      specialties: specialties.split(',').map((s) => s.trim()).filter(Boolean), color_tag: color,
      email: email.trim() || null, pix_key: pix.trim() || null, unit_ids: unitIds, is_active: active,
    } as unknown as Partial<Professional>;
    setBusy(true);
    try {
      if (initial) await crud.update.mutateAsync({ id: initial.id, patch: payload });
      else await crud.create.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(humanError(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-3">
      <Field label="Nome *"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Cargo / função"><input className={inputCls} value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Ex.: Massoterapeuta" /></Field>
        <Field label="Comissão base (%)"><input className={inputCls} inputMode="decimal" value={commission} onChange={(e) => setCommission(e.target.value)} /></Field>
      </div>
      <Field label="Especialidades" hint="Separe por vírgula."><input className={inputCls} value={specialties} onChange={(e) => setSpecialties(e.target.value)} placeholder="Drenagem, Relaxante" /></Field>
      <Field label="Apresentação"><textarea className={inputCls} rows={2} value={bio} onChange={(e) => setBio(e.target.value)} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="E-mail"><input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Chave Pix (comissões)"><input className={inputCls} value={pix} onChange={(e) => setPix(e.target.value)} /></Field>
      </div>
      <div>
        <span className="text-xs font-medium text-slate-700">Cor na agenda</span>
        <div className="flex gap-2 mt-1.5 flex-wrap">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Cor ${c}`}
                    className={`w-7 h-7 rounded-full border-2 ${color === c ? 'border-slate-900' : 'border-white shadow'}`} style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      {units.length > 1 && (
        <div>
          <span className="text-xs font-medium text-slate-700">Atende nas unidades</span>
          <div className="mt-1.5 space-y-1">
            {units.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={unitIds.includes(u.id)} onChange={() => toggleUnit(u.id)} /> {u.name}</label>
            ))}
          </div>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Ativa na agenda</label>
      <ErrorBox message={error} />
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className={ghostBtn}>Cancelar</button>
        <button type="submit" disabled={busy} className={primaryBtn}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}{initial ? 'Salvar alterações' : 'Cadastrar'}</button>
      </div>
    </form>
  );
}

export default function TeamPage() {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const { hasPermission } = useRBAC();
  const canWrite = hasPermission('team:write');
  const crud = useCrud<Professional>('professionals', currentCompany.id, INITIAL_PROFESSIONALS);
  const [editing, setEditing] = useState<Professional | 'new' | null>(null);

  const newBtn = canWrite && <button onClick={() => setEditing('new')} className={primaryBtn}><Plus className="w-4 h-4" /> Cadastrar Profissional</button>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">{currentCompany.name} · Equipe</div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2"><UserCheck className="w-6 h-6 text-teal-700" />{t('nav.team')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">As pessoas que atendem na sua casa, com comissão e cor na agenda</p>
        </div>
        {newBtn}
      </div>

      {crud.isLoading && <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando sua equipe...</div>}
      {crud.loadError && <ErrorBox message="Não consegui carregar a equipe agora. Atualize a página e tente de novo." />}
      {!crud.isLoading && !crud.loadError && crud.items.length === 0 && (
        <EmptyState icon={<UserCheck className="w-5 h-5" />} title="Ainda não há profissionais" text="Cadastre quem atende. Sem profissionais, a agenda não consegue receber agendamentos." action={newBtn || undefined} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {crud.items.map((prof) => (
          <div key={prof.id} className={`bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 ${prof.is_active ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-xs" style={{ backgroundColor: prof.color_tag }}>{prof.name[0]}</div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{prof.name}</h3>
                  <div className="text-[11px] text-slate-500 truncate">{prof.role_title || prof.bio}</div>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${prof.is_active ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>{prof.is_active ? 'Ativa' : 'Inativa'}</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between"><span className="text-slate-500 flex items-center gap-1"><Percent className="w-3.5 h-3.5 text-teal-700" /> Comissão base:</span><span className="font-bold text-slate-900 tabular-nums">{prof.commission_rate}%</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-teal-700" /> Especialidades:</span><span className="font-medium text-slate-900 truncate max-w-[150px]">{prof.specialties.join(', ') || '—'}</span></div>
            </div>
            {canWrite && <button onClick={() => setEditing(prof)} className="text-xs text-teal-700 hover:text-teal-900 font-semibold">Editar</button>}
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Nova profissional' : 'Editar profissional'} onClose={() => setEditing(null)}>
          <ProfessionalForm initial={editing === 'new' ? undefined : editing} crud={crud} onClose={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
