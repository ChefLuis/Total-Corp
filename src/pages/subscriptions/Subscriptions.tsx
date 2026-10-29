import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { subscriptionsEngine, SAAS_PLATFORM_DATA } from '../../services/subscriptions/subscriptionsEngine';
import { ClubPlan, ClubSubscriber } from '../../services/subscriptions/types';
import { INITIAL_CLIENTS } from '../../services/mockData';
import { formatCurrency } from '../../utils/currency';
import {
  CreditCard,
  Check,
  Shield,
  Sparkles,
  Plus,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  X,
  Ticket
} from 'lucide-react';

export default function SubscriptionsPage() {
  const { t, i18n } = useTranslation();
  const { currentCompany } = useAuth();
  const { canAccess } = useRBAC();

  const [activeTab, setActiveTab] = useState<'b2c_plans' | 'subscribers' | 'saas_plan'>('b2c_plans');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [isNewSubModalOpen, setIsNewSubModalOpen] = useState(false);

  // New Plan Form
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('199.00');
  const [planSessions, setPlanSessions] = useState('1');
  const [planDiscount, setPlanDiscount] = useState('15');
  const [planDesc, setPlanDesc] = useState('');

  // New Subscriber Form
  const [subClientId, setSubClientId] = useState(INITIAL_CLIENTS[0].id);
  const [subPlanId, setSubPlanId] = useState('');

  const plans = subscriptionsEngine.getPlans(currentCompany.id);
  const subscribers = subscriptionsEngine.getSubscribers(currentCompany.id);

  const monthlyRecurringRevenueCents = subscribers.reduce((acc, s) => acc + s.price_cents, 0);

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    subscriptionsEngine.addPlan({
      company_id: currentCompany.id,
      name: planName.trim(),
      price_cents: Math.round(parseFloat(planPrice || '0') * 100),
      sessions_per_month: Number(planSessions) || 1,
      discount_percentage: Number(planDiscount) || 10,
      description: planDesc.trim(),
      perks: [
        `${planSessions} sessão(ões) mensal(is) inclusa(s)`,
        `${planDiscount}% de desconto em serviços adicionais`,
        'Prioridade de agendamento na agenda online'
      ],
      active: true,
    });

    setIsNewPlanModalOpen(false);
    setPlanName('');
    setRefreshKey(k => k + 1);
  };

  const handleCreateSubscriber = (e: React.FormEvent) => {
    e.preventDefault();
    const client = INITIAL_CLIENTS.find(c => c.id === subClientId);
    const plan = plans.find(p => p.id === (subPlanId || plans[0]?.id));
    if (!client || !plan) return;

    subscriptionsEngine.addSubscriber({
      company_id: currentCompany.id,
      client_id: client.id,
      client_name: client.name,
      client_phone: client.phone,
      plan_id: plan.id,
      plan_name: plan.name,
      price_cents: plan.price_cents,
      start_date: new Date().toISOString().split('T')[0],
      next_billing_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      credits_remaining: plan.sessions_per_month,
      status: 'active',
      card_last4: '4112',
    });

    setIsNewSubModalOpen(false);
    setRefreshKey(k => k + 1);
  };

  const handleUseCredit = (subId: string) => {
    const success = subscriptionsEngine.useSessionCredit(subId);
    if (success) {
      alert('1 crédito de sessão do clube resgatado com sucesso! Comanda aberta na recepção.');
      setRefreshKey(k => k + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            {currentCompany.name} · Recorrência & Fidelização
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-teal-700" />
            <span>Clubes de Assinatura & Planos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Planos de assinatura mensal com créditos de sessões para clientes finais e gestão da plataforma
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (plans.length > 0) setSubPlanId(plans[0].id);
              setIsNewSubModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4 text-teal-700" />
            <span>+ Novo Assinante</span>
          </button>

          <button
            onClick={() => setIsNewPlanModalOpen(true)}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Plano do Clube</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Receita Recorrente Mensal (MRR)</div>
          <div className="text-2xl font-bold text-teal-800 font-mono tabular-nums">
            {formatCurrency(monthlyRecurringRevenueCents, i18n.language)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Faturamento garantido todo dia 1º no cartão</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Assinantes Ativos do Clube</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {subscribers.length} Membros
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            0 inadimplência registrada neste ciclo
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Planos de Clube Disponíveis</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {plans.length} Opções
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">
            Opções de relaxamento e terapias integrativas
          </div>
        </div>
      </div>

      {/* Subtabs Switcher */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('b2c_plans')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'b2c_plans' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Planos do Clube ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'subscribers' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Assinantes Ativos</span>
          <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-full">
            {subscribers.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('saas_plan')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'saas_plan' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Assinatura Total Corp Pro
        </button>
      </div>

      {/* TAB 1: PLANOS DO CLUBE B2C */}
      {activeTab === 'b2c_plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Mensal Recorrente
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">{plan.discount_percentage}% OFF extras</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mt-2">{plan.name}</h3>
                <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1">
                  {formatCurrency(plan.price_cents, i18n.language)}
                  <span className="text-xs font-normal text-slate-500 font-sans"> / mês</span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mt-2">
                  {plan.description}
                </p>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-semibold text-slate-800">Benefícios Inclusos:</div>
                  {plan.perks.map((perk, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setSubPlanId(plan.id);
                    setIsNewSubModalOpen(true);
                  }}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-2 rounded-lg shadow-2xs transition-colors"
                >
                  Matricular Cliente Neste Plano
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: ASSINANTES ATIVOS */}
      {activeTab === 'subscribers' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Clientes Assinantes do Clube Naturo SPA
            </h3>
            <span className="text-xs text-slate-500 font-mono">{subscribers.length} assinantes</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Plano do Clube</th>
                <th className="py-3 px-4 text-center">Créditos Restantes</th>
                <th className="py-3 px-4">Próxima Cobrança</th>
                <th className="py-3 px-4 text-right">Mensalidade</th>
                <th className="py-3 px-4 text-center">Cartão</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{sub.client_name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{sub.client_phone}</div>
                  </td>
                  <td className="py-3 px-4 text-teal-900 font-semibold">{sub.plan_name}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono font-bold text-sm bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full">
                      {sub.credits_remaining} sessão(ões)
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{sub.next_billing_date}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrency(sub.price_cents, i18n.language)}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-500">
                    •••• {sub.card_last4 || '4812'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {sub.credits_remaining > 0 ? (
                      <button
                        onClick={() => handleUseCredit(sub.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-2xs flex items-center gap-1 mx-auto"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Resgatar Sessão</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Créditos Esgotados</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: ASSINATURA SAAS PLATAFORMA */}
      {activeTab === 'saas_plan' && (
        <div className="bg-white p-6 rounded-xl border border-teal-200 shadow-2xs space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded">
                Plano Atual da Sua Empresa
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                {SAAS_PLATFORM_DATA.plan_name} — {formatCurrency(SAAS_PLATFORM_DATA.price_cents, i18n.language)} / mês
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                {SAAS_PLATFORM_DATA.trial_days_remaining} dias de teste grátis
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-800">Recursos Inclusos no Total Corp Pro:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {SAAS_PLATFORM_DATA.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-600">
                  <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-slate-900">Cartão de Crédito da Empresa:</div>
              <div className="text-slate-500 font-mono">Mastercard final •••• 9812</div>
            </div>
            <button className="text-teal-700 hover:text-teal-800 font-semibold">
              Alterar Cartão
            </button>
          </div>

          <button className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
            <span>Ativar Assinatura Definitiva Total Corp</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL: NOVO PLANO DO CLUBE */}
      {isNewPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Novo Plano de Clube de Assinatura</h2>
              <button onClick={() => setIsNewPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Plano:</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Ex: Clube Day Spa VIP, Clube Massagem Mensal"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mensalidade (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sessões / Mês:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={planSessions}
                    onChange={(e) => setPlanSessions(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">% Desconto em Outros Serviços:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={planDiscount}
                  onChange={(e) => setPlanDiscount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição Comercial:</label>
                <textarea
                  rows={3}
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  placeholder="Explique os benefícios deste clube para atrair seus clientes..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPlanModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Salvar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO ASSINANTE */}
      {isNewSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Cadastrar Novo Assinante</h2>
              <button onClick={() => setIsNewSubModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubscriber} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cliente:</label>
                <select
                  value={subClientId}
                  onChange={(e) => setSubClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {INITIAL_CLIENTS.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plano do Clube:</label>
                <select
                  value={subPlanId}
                  onChange={(e) => setSubPlanId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.price_cents, i18n.language)}/mês)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="font-bold text-slate-900">Cobrança Recorrente:</div>
                <div className="text-slate-600 text-[11px]">
                  Primeira mensalidade cobrada agora via cartão tokenizado ou Pix, com renovação automática a cada 30 dias.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewSubModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Confirmar Matrícula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
