import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { useCrud } from '../../data/useCrud';
import { INITIAL_SERVICES, INITIAL_SERVICE_CATEGORIES } from '../../services/mockData';
import { Service, ServiceCategory } from '../../types';
import { humanError } from '../../lib/supabase';
import { formatCurrency } from '../../utils/currency';
import { parseMoneyToCents, centsToInput } from '../../utils/money';
import { Modal, Field, ErrorBox, EmptyState, inputCls, primaryBtn, ghostBtn } from '../../components/ui/Modal';
import { Scissors, Plus, Clock, Loader2 } from 'lucide-react';

type SrvCrud = ReturnType<typeof useCrud<Service>>;
type CatCrud = ReturnType<typeof useCrud<ServiceCategory>>;

function ServiceForm({ initial, crud, cats, onClose }: { initial?: Service; crud: SrvCrud; cats: CatCrud; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [catName, setCatName] = useState(cats.items.find((c) => c.id === initial?.category_id)?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [duration, setDuration] = useState(String(initial?.duration_minutes ?? 60));
  const [buffer, setBuffer] = useState(String(initial?.buffer_time_minutes ?? 0));
  const [price, setPrice] = useState(initial ? centsToInput(initial.price_cents) : '');
  const [online, setOnline] = useState(initial?.is_online_bookable ?? true);
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const dur = parseInt(duration, 10);
    const buf = parseInt(buffer || '0', 10);
    const cents = parseMoneyToCents(price);
    if (name.trim().length < 2) return setError('Dê um nome ao serviço.');
    if (!Number.isFinite(dur) || dur < 5 || dur > 720) return setError('A duração deve ficar entre 5 e 720 minutos.');
    if (!Number.isFinite(buf) || buf < 0 || buf > 240) return setError('O tempo de preparo deve ficar entre 0 e 240 minutos.');
    if (cents === null) return setError('Informe um preço válido, por exemplo 80,00.');
    setBusy(true);
    try {
      let category_id: string | undefined;
      const wanted = catName.trim();
      if (wanted) {
        const found = cats.items.find((c) => c.name.toLowerCase() === wanted.toLowerCase());
        category_id = found ? found.id : (await cats.create.mutateAsync({ name: wanted, color: '#0F766E', sort_order: cats.items.length } as Partial<ServiceCategory>)).id;
      }
      const payload = {
        name: name.trim(), description: description.trim(), duration_minutes: dur, buffer_time_minutes: buf,
        price_cents: cents, is_online_bookable: online, is_active: active, category_id: category_id ?? null,
      } as unknown as Partial<Service>;
      if (initial) await crud.update.mutateAsync({ id: initial.id, patch: payload });
      else await crud.create.mutateAsync({ ...payload, professional_ids: [], requires_deposit: false } as Partial<Service>);
      onClose();
    } catch (err) {
      setError(humanError(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-3">
      <Field label="Nome do serviço *"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex.: Massagem Relaxante" /></Field>
      <Field label="Categoria" hint="Escolha uma existente ou digite para criar uma nova.">
        <input className={inputCls} list="cat-list" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Ex.: Massagens" />
        <datalist id="cat-list">{cats.items.map((c) => <option key={c.id} value={c.name} />)}</datalist>
      </Field>
      <Field label="Descrição"><textarea className={inputCls} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Duração (min) *"><input className={inputCls} inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} /></Field>
        <Field label="Preparo (min)"><input className={inputCls} inputMode="numeric" value={buffer} onChange={(e) => setBuffer(e.target.value)} /></Field>
        <Field label="Preço (R$) *"><input className={inputCls} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="80,00" /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} /> Pode ser agendado online pelo cliente</label>
      <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Serviço ativo (desmarque para pausar sem apagar)</label>
      <ErrorBox message={error} />
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className={ghostBtn}>Cancelar</button>
        <button type="submit" disabled={busy} className={primaryBtn}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}{initial ? 'Salvar alterações' : 'Criar serviço'}</button>
      </div>
    </form>
  );
}

export default function ServicesPage() {
  const { t, i18n } = useTranslation();
  const { currentCompany } = useAuth();
  const { hasPermission } = useRBAC();
  const canWrite = hasPermission('services:write');
  const crud = useCrud<Service>('services', currentCompany.id, INITIAL_SERVICES);
  const cats = useCrud<ServiceCategory>('service_categories', currentCompany.id, INITIAL_SERVICE_CATEGORIES, 'sort_order');
  const [editing, setEditing] = useState<Service | 'new' | null>(null);

  const newBtn = canWrite && <button onClick={() => setEditing('new')} className={primaryBtn}><Plus className="w-4 h-4" /> Novo Serviço</button>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">{currentCompany.name} · Catálogo</div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2"><Scissors className="w-6 h-6 text-teal-700" />{t('nav.services')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">O que você oferece: duração, preço e tempo de preparo de cada serviço</p>
        </div>
        {newBtn}
      </div>

      {crud.isLoading && <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando seu catálogo...</div>}
      {crud.loadError && <ErrorBox message="Não consegui carregar os serviços agora. Atualize a página e tente de novo." />}
      {!crud.isLoading && !crud.loadError && crud.items.length === 0 && (
        <EmptyState icon={<Scissors className="w-5 h-5" />} title="Seu catálogo está vazio" text="Cadastre os serviços que você oferece. Os marcados como “agendável online” aparecem na sua página pública." action={newBtn || undefined} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {crud.items.map((srv) => {
          const cat = cats.items.find((c) => c.id === srv.category_id);
          const inactive = srv.is_active === false;
          return (
            <div key={srv.id} className={`bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 ${inactive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wider">{cat?.name || 'Geral'}</span>
                  {inactive && <span className="ml-1.5 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">Pausado</span>}
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{srv.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{srv.description}</p>
                </div>
                <div className="text-right shrink-0 font-bold text-base text-slate-900 tabular-nums">{formatCurrency(srv.price_cents, i18n.language)}</div>
              </div>
              <div className="flex items-center justify-between gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-teal-700" />{srv.duration_minutes} min{srv.buffer_time_minutes > 0 && ` (+${srv.buffer_time_minutes} de preparo)`}</span>
                  <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${srv.is_online_bookable ? 'bg-emerald-500' : 'bg-slate-300'}`} />{srv.is_online_bookable ? 'Agendável online' : 'Apenas balcão'}</span>
                </div>
                {canWrite && <button onClick={() => setEditing(srv)} className="text-teal-700 hover:text-teal-900 font-semibold">Editar</button>}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Novo serviço' : 'Editar serviço'} onClose={() => setEditing(null)}>
          <ServiceForm initial={editing === 'new' ? undefined : editing} crud={crud} cats={cats} onClose={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
