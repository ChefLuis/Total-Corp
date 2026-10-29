import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { commissionsEngine } from '../../services/commissions/commissionsEngine';
import { CommissionEntry, PayrollPeriodSummary, CommissionRule } from '../../services/commissions/types';
import { INITIAL_PROFESSIONALS } from '../../services/mockData';
import { formatCurrency } from '../../utils/currency';
import {
  Percent,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Plus,
  DollarSign,
  User,
  ShieldCheck,
  CreditCard,
  Scissors,
  Check,
  X,
  FileText
} from 'lucide-react';

export default function CommissionsPage() {
  const { t, i18n } = useTranslation();
  const { currentCompany } = useAuth();
  const { canAccess } = useRBAC();

  const [activeTab, setActiveTab] = useState<'payroll' | 'statements' | 'advances' | 'rules'>('payroll');
  const [selectedProfFilter, setSelectedProfFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [receiptSummary, setReceiptSummary] = useState<PayrollPeriodSummary | null>(null);
  const [isNewAdvanceModalOpen, setIsNewAdvanceModalOpen] = useState(false);
  const [advProfId, setAdvProfId] = useState(INITIAL_PROFESSIONALS[0].id);
  const [advAmount, setAdvAmount] = useState('100.00');
  const [advReason, setAdvReason] = useState('Adiantamento emergencial');

  // Editing Rule modal state
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);

  const summaries = commissionsEngine.calculatePayrollSummaries(currentCompany.id);
  const entries = commissionsEngine.getEntries(currentCompany.id, selectedProfFilter);
  const advances = commissionsEngine.getAdvances(currentCompany.id, selectedProfFilter);
  const rules = commissionsEngine.getRules(currentCompany.id);

  const totalPayableNetCents = summaries.reduce((acc, s) => acc + s.net_payable_cents, 0);

  const handleMarkPaid = (profId: string) => {
    commissionsEngine.markPayrollAsPaid(currentCompany.id, profId);
    setRefreshKey(k => k + 1);
  };

  const handleCreateAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(advAmount || '0') * 100);
    if (amountCents <= 0) return;

    commissionsEngine.addAdvance({
      company_id: currentCompany.id,
      professional_id: advProfId,
      amount_cents: amountCents,
      date: new Date().toISOString().split('T')[0],
      reason: advReason,
      status: 'pending_deduction',
    });

    setIsNewAdvanceModalOpen(false);
    setRefreshKey(k => k + 1);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    commissionsEngine.updateRule(editingRule.professional_id, editingRule);
    setEditingRule(null);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            {currentCompany.name} · Repasse & Comissões
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            <Percent className="w-6 h-6 text-teal-700" />
            <span>Comissões & Fechamento de Folha</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cálculo automatizado sobre comandas, descontos de taxas de maquininha, custo de insumos e adiantamentos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewAdvanceModalOpen(true)}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Vale / Adiantamento</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Folha Geral</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Total a Repassar (Quinzena Atual)</div>
          <div className="text-2xl font-bold text-teal-800 font-mono tabular-nums">
            {formatCurrency(totalPayableNetCents, i18n.language)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Valor líquido após taxas e adiantamentos</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Faturamento Gerado pela Equipe</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(summaries.reduce((a, b) => a + b.gross_revenue_generated_cents, 0), i18n.language)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            {summaries.reduce((a, b) => a + b.total_attendances, 0)} atendimentos realizados
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Economia de Taxas & Insumos</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {formatCurrency(summaries.reduce((a, b) => a + b.total_deductions_cents, 0), i18n.language)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Deduções automáticas de insumos e maquininha</div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'payroll' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Resumo do Fechamento de Folha
        </button>
        <button
          onClick={() => setActiveTab('statements')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'statements' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Extrato de Atendimentos</span>
          <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-full">
            {entries.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('advances')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'advances' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Vales & Adiantamentos</span>
          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
            {advances.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'rules' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Regras de Comissão por Profissional
        </button>
      </div>

      {/* TAB 1: FECHAMENTO DE FOLHA */}
      {activeTab === 'payroll' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Fechamento da 1ª Quinzena (01/10/2026 a 15/10/2026)
              </h2>
              <p className="text-xs text-slate-500">
                Repasses calculados com base nas comandas liquidadas e abatimentos autorizados
              </p>
            </div>
            <div className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
              Pagamento via Pix
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Profissional</th>
                <th className="py-3 px-4 text-center">Atendimentos</th>
                <th className="py-3 px-4 text-right">Faturado</th>
                <th className="py-3 px-4 text-right">Comissão Bruta</th>
                <th className="py-3 px-4 text-right">Deduções (Taxas/Insumos)</th>
                <th className="py-3 px-4 text-right">Vales</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Líquido a Pagar</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaries.map((s) => (
                <tr key={s.professional_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{s.professional_name}</div>
                    <div className="text-[11px] text-slate-500">{s.role_title}</div>
                    <div className="text-[10px] font-mono text-teal-800">Pix: {s.pix_key}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700">{s.total_attendances}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {formatCurrency(s.gross_revenue_generated_cents, i18n.language)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {formatCurrency(s.gross_commission_cents, i18n.language)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-600">
                    -{formatCurrency(s.total_deductions_cents, i18n.language)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700">
                    {s.advances_deducted_cents > 0 ? `-${formatCurrency(s.advances_deducted_cents, i18n.language)}` : 'R$ 0,00'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-teal-900 tabular-nums text-sm">
                    {formatCurrency(s.net_payable_cents, i18n.language)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {s.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pago</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Aberto</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setReceiptSummary(s)}
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md transition-colors"
                        title="Ver Recibo Detalhado"
                      >
                        Recibo
                      </button>
                      {s.status === 'open' && (
                        <button
                          onClick={() => handleMarkPaid(s.professional_id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-2xs"
                          title="Marcar como Liquidado via Pix"
                        >
                          Pagar Pix
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: EXTRATO DETALHADO DE ATENDIMENTOS */}
      {activeTab === 'statements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Filtrar por Profissional:</span>
              <select
                value={selectedProfFilter}
                onChange={(e) => setSelectedProfFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              >
                <option value="all">Todos os Profissionais</option>
                {INITIAL_PROFESSIONALS.filter(p => p.company_id === currentCompany.id).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Profissional</th>
                  <th className="py-3 px-4">Serviço / Tratamento</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4 text-right">Valor Serviço</th>
                  <th className="py-3 px-4 text-right">Comissão Bruta</th>
                  <th className="py-3 px-4 text-right">Deduções</th>
                  <th className="py-3 px-4 text-right font-bold text-teal-900">Comissão Líquida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((item) => {
                  const prof = INITIAL_PROFESSIONALS.find(p => p.id === item.professional_id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{item.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{prof?.name}</td>
                      <td className="py-3 px-4 text-slate-700">{item.service_name}</td>
                      <td className="py-3 px-4 text-slate-600">{item.client_name}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {formatCurrency(item.service_value_cents, i18n.language)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {formatCurrency(item.gross_commission_cents, i18n.language)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-600">
                        -{formatCurrency(item.card_fee_deduction_cents + item.supply_kit_deduction_cents, i18n.language)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-teal-800 tabular-nums">
                        {formatCurrency(item.net_commission_cents, i18n.language)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VALES & ADIANTAMENTOS */}
      {activeTab === 'advances' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Histórico de Vales e Adiantamentos Concedidos
            </h3>
            <span className="text-xs text-slate-500 font-mono">{advances.length} registros</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Profissional</th>
                <th className="py-3 px-4">Motivo / Descrição</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Status no Fechamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {advances.map((adv) => {
                const prof = INITIAL_PROFESSIONALS.find(p => p.id === adv.professional_id);
                return (
                  <tr key={adv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{adv.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{prof?.name}</td>
                    <td className="py-3 px-4 text-slate-600">{adv.reason}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-800 tabular-nums">
                      {formatCurrency(adv.amount_cents, i18n.language)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {adv.status === 'deducted' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Abatido na Folha</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pendente de Dedução</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: REGRAS DE COMISSÃO */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rules.map((rule) => {
            const prof = INITIAL_PROFESSIONALS.find(p => p.id === rule.professional_id);
            if (!prof) return null;
            return (
              <div key={rule.professional_id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-200">
                      {prof.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{prof.name}</h3>
                      <div className="text-[11px] text-slate-500">{prof.role_title || 'Terapeuta Corporal'}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                  >
                    Editar
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Comissão de Serviços:</span>
                    <span className="font-bold text-slate-900 font-mono">{rule.service_percentage}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Comissão de Produtos:</span>
                    <span className="font-bold text-slate-900 font-mono">{rule.product_percentage}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Descontar Taxa Cartão:</span>
                    <span className={`font-semibold ${rule.deduct_card_fee ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {rule.deduct_card_fee ? 'Sim (2.4%)' : 'Não'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Descontar Kit de Insumos:</span>
                    <span className={`font-semibold ${rule.deduct_supply_kit ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {rule.deduct_supply_kit ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: RECIBO DETALHADO DO PROFISSIONAL */}
      {receiptSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-bold text-slate-900">Extrato Individual de Repasse</h3>
              </div>
              <button onClick={() => setReceiptSummary(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{receiptSummary.professional_name}</div>
                  <div className="text-[11px] text-slate-500">{receiptSummary.role_title}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">Chave Pix de Destino:</span>
                  <span className="font-mono font-bold text-teal-800">{receiptSummary.pix_key}</span>
                </div>
              </div>

              <div className="space-y-2 divide-y divide-slate-100">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">Total de Atendimentos Realizados:</span>
                  <span className="font-bold text-slate-900">{receiptSummary.total_attendances}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">Faturamento Bruto Gerado:</span>
                  <span className="font-mono text-slate-900">{formatCurrency(receiptSummary.gross_revenue_generated_cents, i18n.language)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">Comissão Bruta Calculada:</span>
                  <span className="font-mono text-slate-900">{formatCurrency(receiptSummary.gross_commission_cents, i18n.language)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-rose-600">
                  <span>(-) Deduções de Taxas de Cartão e Kits:</span>
                  <span className="font-mono">-{formatCurrency(receiptSummary.total_deductions_cents, i18n.language)}</span>
                </div>
                {receiptSummary.advances_deducted_cents > 0 && (
                  <div className="flex justify-between py-1.5 text-amber-700">
                    <span>(-) Vales / Adiantamentos Abatidos:</span>
                    <span className="font-mono">-{formatCurrency(receiptSummary.advances_deducted_cents, i18n.language)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 font-extrabold text-sm text-slate-900 bg-teal-50 px-3 rounded-lg border border-teal-100 mt-2">
                  <span>(=) VALOR LÍQUIDO A REPASSAR:</span>
                  <span className="font-mono text-teal-900 text-base">
                    {formatCurrency(receiptSummary.net_payable_cents, i18n.language)}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 text-center pt-2">
                Documento de prestação de contas de parceria de acordo com a Lei do Salão-Parceiro (Lei 13.352/2016).
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Imprimir Recibo</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptSummary(null)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO VALE / ADIANTAMENTO */}
      {isNewAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Novo Vale / Adiantamento</h3>
              <button onClick={() => setIsNewAdvanceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdvance} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Profissional:</label>
                <select
                  value={advProfId}
                  onChange={(e) => setAdvProfId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {INITIAL_PROFESSIONALS.filter(p => p.company_id === currentCompany.id).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role_title || 'Terapeuta'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valor do Vale (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={advAmount}
                  onChange={(e) => setAdvAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo / Justificativa:</label>
                <input
                  type="text"
                  required
                  value={advReason}
                  onChange={(e) => setAdvReason(e.target.value)}
                  placeholder="Ex: Adiantamento emergencial de transporte"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAdvanceModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Salvar Vale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR REGRA DE COMISSÃO */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Editar Regras de Comissão</h3>
              <button onClick={() => setEditingRule(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">% Comissão Serviços:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingRule.service_percentage}
                    onChange={(e) => setEditingRule({ ...editingRule, service_percentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">% Comissão Produtos:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingRule.product_percentage}
                    onChange={(e) => setEditingRule({ ...editingRule, product_percentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRule.deduct_card_fee}
                    onChange={(e) => setEditingRule({ ...editingRule, deduct_card_fee: e.target.checked })}
                    className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  <span className="text-slate-700 font-medium">Descontar taxa de maquininha da comissão</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRule.deduct_supply_kit}
                    onChange={(e) => setEditingRule({ ...editingRule, deduct_supply_kit: e.target.checked })}
                    className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  <span className="text-slate-700 font-medium">Descontar custo de kit de insumos descartáveis</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Salvar Regras
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
