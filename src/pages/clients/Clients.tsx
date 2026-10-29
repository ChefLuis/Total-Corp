import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { useCrud } from '../../data/useCrud';
import { INITIAL_CLIENTS } from '../../services/mockData';
import { Client } from '../../types';
import { humanError, isDuplicate } from '../../lib/supabase';
import { formatPhone, onlyDigits, isValidBrPhone } from '../../utils/phone';
import { Modal, Field, ErrorBox, EmptyState, inputCls, primaryBtn, ghostBtn } from '../../components/ui/Modal';
import { Users, Plus, Search, Phone, Mail, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

type Crud = ReturnType<typeof useCrud<Client>>;

function ClientForm({ initial, crud, canDelete, onClose }: { initial?: Client; crud: Crud; canDelete: boolean; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial ? formatPhone(initial.phone) : '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [birth, setBirth] = useState(initial?.birth_date?.slice(0, 10) ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [lgpd, setLgpd] = useState(initial?.lgpd_consent ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Informe o nome do cliente.');
    if (!isValidBrPhone(phone)) return setError('Confira o telefone: use DDD + número, por exemplo (41) 99123-4567.');
    if (!lgpd) return setError('Marque que o cliente autorizou o uso dos dados (LGPD) para salvar o cadastro.');
    const payload = {
      name: name.trim(),
      phone: onlyDigits(phone),
      email: email.trim() || null,
      birth_date: birth || null,
      notes: notes.trim() || null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      lgpd_consent: true,
      lgpd_consent_at: initial?.lgpd_consent_at || new Date().toISOString(),
    } as unknown as Partial<Client>;
    setBusy(true);
    try {
      if (initial) await crud.update.mutateAsync({ id: initial.id, patch: payload });
      else await crud.create.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(isDuplicate(err) ? 'Já existe um cliente com esse telefone.' : humanError(err));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!initial || !window.confirm(`Excluir o cadastro de ${initial.name}? Essa ação não pode ser desfeita.`)) return;
    setBusy(true);
    try { await crud.remove.mutateAsync(initial.id); onClose(); }
    catch (err) { setError(humanError(err)); setBusy(false); }
  };

  return (
    <form onSubmit={save} className="space-y-3">
      <Field label="Nome completo *"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Telefone / WhatsApp *"><input className={inputCls} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(41) 99123-4567" /></Field>
        <Field label="Aniversário"><input className={inputCls} type="date" value={birth} onChange={(e) => setBirth(e.target.value)} /></Field>
      </div>
      <Field label="E-mail"><input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@email.com" /></Field>
      <Field label="Etiquetas" hint="Separe por vírgula. Ex.: VIP, Gestante, Prefere manhã"><input className={inputCls} value={tags} onChange={(e) => setTags(e.target.value)} /></Field>
      <Field label="Observações"><textarea className={inputCls} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Preferências, cuidados, alergias..." /></Field>
      <label className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3">
        <input type="checkbox" className="mt-0.5" checked={lgpd} onChange={(e) => setLgpd(e.target.checked)} />
        <span>O cliente autorizou o uso dos seus dados para atendimento e contato (LGPD).</span>
      </label>
      <ErrorBox message={error} />
      <div className="flex items-center justify-between pt-1">
        {initial && canDelete ? <button type="button" onClick={remove} disabled={busy} className="text-xs text-red-600 hover:underline">Excluir cadastro</button> : <span />}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={ghostBtn}>Cancelar</button>
          <button type="submit" disabled={busy} className={primaryBtn}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}{initial ? 'Salvar alterações' : 'Cadastrar cliente'}</button>
        </div>
      </div>
    </form>
  );
}

export default function ClientsPage() {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const { hasPermission } = useRBAC();
  const canWrite = hasPermission('clients:write');
  const canDelete = hasPermission('clients:delete');
  const crud = useCrud<Client>('clients', currentCompany.id, INITIAL_CLIENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<Client | 'new' | null>(null);

  const clients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const qd = onlyDigits(searchTerm);
    return crud.items
      .filter((c) => !q || c.name.toLowerCase().includes(q) || (qd && onlyDigits(c.phone).includes(qd)) || c.tags.some((tg) => tg.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [crud.items, searchTerm]);

  const newBtn = canWrite && (
    <button onClick={() => setEditing('new')} className={primaryBtn}><Plus className="w-4 h-4" /> Novo Cliente</button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">{currentCompany.name} · CRM</div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-700" />{t('nav.clients')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Quem passa pela sua casa, com contato, preferências e consentimento LGPD</p>
        </div>
        {newBtn}
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} aria-label="Buscar cliente"
                 placeholder="Buscar por nome, telefone ou etiqueta..."
                 className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 focus:border-teal-600 focus:bg-white rounded-lg text-xs text-slate-800 outline-hidden" />
        </div>
      </div>

      {crud.isLoading && <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Buscando seus clientes...</div>}
      {crud.loadError && <ErrorBox message="Não consegui carregar os clientes agora. Atualize a página e tente de novo." />}

      {!crud.isLoading && !crud.loadError && crud.items.length === 0 && (
        <EmptyState icon={<Users className="w-5 h-5" />} title="Nenhum cliente por aqui ainda"
                    text="Cadastre seu primeiro cliente ou deixe que eles se cadastrem sozinhos ao agendar pelo seu link público." action={newBtn || undefined} />
      )}

      {clients.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Cliente</th><th className="py-3 px-4">Contato</th>
                <th className="py-3 px-4">Etiquetas</th><th className="py-3 px-4">LGPD</th><th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((cli) => (
                <tr key={cli.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{cli.name}</div>
                    {cli.notes && <div className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate">{cli.notes}</div>}
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-teal-700" /><span>{formatPhone(cli.phone)}</span></div>
                    {cli.email && <div className="flex items-center gap-1.5 text-slate-400 mt-0.5"><Mail className="w-3.5 h-3.5" /><span>{cli.email}</span></div>}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {cli.tags.map((tag) => <span key={tag} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">{tag}</span>)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {cli.lgpd_consent
                      ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"><ShieldCheck className="w-3.5 h-3.5" /> Consentido</span>
                      : <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"><ShieldAlert className="w-3.5 h-3.5" /> Pendente</span>}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button onClick={() => setEditing(cli)} className="text-teal-700 hover:text-teal-900 font-semibold text-xs">{canWrite ? 'Abrir ficha' : 'Ver ficha'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {crud.items.length > 0 && clients.length === 0 && <p className="text-sm text-slate-500 text-center">Nenhum cliente encontrado para “{searchTerm}”.</p>}

      {editing && (
        <Modal title={editing === 'new' ? 'Novo cliente' : canWrite ? 'Ficha do cliente' : 'Ficha (somente leitura)'} onClose={() => setEditing(null)}>
          {canWrite || editing === 'new'
            ? <ClientForm initial={editing === 'new' ? undefined : editing} crud={crud} canDelete={canDelete} onClose={() => setEditing(null)} />
            : <div className="text-sm text-slate-700 space-y-1"><p><b>{editing.name}</b></p><p>{formatPhone(editing.phone)}</p>{editing.email && <p>{editing.email}</p>}{editing.notes && <p className="text-slate-500">{editing.notes}</p>}</div>}
        </Modal>
      )}
    </div>
  );
}
