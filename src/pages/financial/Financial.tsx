import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { financialEngine } from '../../services/financial/financialEngine';
import { FinancialEntry, TransactionType, FinancialCategory } from '../../services/financial/types';
import { formatCurrency } from '../../utils/currency';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  CreditCard,
  QrCode,
  FileText,
  Calendar,
  X,
  Check,
  Download,
  Copy
} from 'lucide-react';

const CATEGORY_LABELS: Record<FinancialCategory, string> = {
  services_revenue: 'Receita de Serviços',
  products_revenue: 'Venda de Produtos',
  subscriptions_revenue: 'Clubes & Assinaturas',
  rent_condo: 'Aluguel & Condomínio',
  supplies_cost: 'Insumos & Suprimentos',
  commissions_payout: 'Repasse de Comissões',
  card_fees: 'Taxas de Maquininhas',
  marketing_ads: 'Marketing & Tráfego',
  utilities: 'Contas de Consumo (Luz/Água)',
  software_systems: 'Softwares & TI',
  taxes: 'Impostos (Simples Nacional)',
  other: 'Outros Lançamentos',
};

export default function FinancialPage() {
  const { t, i18n } = useTranslation();
  const { currentCompany, activeUnit } = useAuth();
  const { canAccess } = useRBAC();

  const [activeTab, setActiveTab] = useState<'overview' | 'payables' | 'receivables' | 'accounts'>('overview');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // New Transaction Modal
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [newType, setNewType] = useState<TransactionType>('expense');
  const [newCategory, setNewCategory] = useState<FinancialCategory>('supplies_cost');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('150.00');
  const [newDueDate, setNewDueDate] = useState('2026-10-25');
  const [newEntity, setNewEntity] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<FinancialEntry['payment_method']>('pix');

  // Liquidate / Pay modal
  const [entryToPay, setEntryToPay] = useState<FinancialEntry | null>(null);
  const [payMethod, setPayMethod] = useState<FinancialEntry['payment_method']>('pix');
  const [payBankId, setPayBankId] = useState<string>('bank_itau_01');

  // Pix Modal
  const [pixModalEntry, setPixModalEntry] = useState<FinancialEntry | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  const dre = financialEngine.calculateDRE(currentCompany.id);
  const bankAccounts = financialEngine.getBankAccounts(currentCompany.id);
  const payables = financialEngine.getEntries(currentCompany.id, { type: 'expense', status: statusFilter });
  const receivables = financialEngine.getEntries(currentCompany.id, { type: 'revenue', status: statusFilter });

  const totalPayablesPendingCents = financialEngine
    .getEntries(currentCompany.id, { type: 'expense', status: 'pending' })
    .reduce((sum, e) => sum + e.amount_cents, 0);

  const totalReceivablesPendingCents = financialEngine
    .getEntries(currentCompany.id, { type: 'revenue', status: 'pending' })
    .reduce((sum, e) => sum + e.amount_cents, 0);

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(newAmount || '0') * 100);
    if (!newDescription.trim() || amountCents <= 0) {
      alert('Preencha a descrição e um valor válido.');
      return;
    }

    financialEngine.addEntry({
      company_id: currentCompany.id,
      unit_id: activeUnit ? activeUnit.id : undefined,
      type: newType,
      category: newCategory,
      description: newDescription,
      amount_cents: amountCents,
      due_date: newDueDate,
      status: 'pending',
      entity_name: newEntity.trim() || (newType === 'expense' ? 'Fornecedor' : 'Cliente'),
      payment_method: newPaymentMethod,
    });

    setIsNewEntryModalOpen(false);
    setNewDescription('');
    setNewEntity('');
    setNewAmount('150.00');
    setRefreshKey(k => k + 1);
  };

  const handleConfirmPayment = () => {
    if (!entryToPay) return;
    financialEngine.markAsPaid(entryToPay.id, payMethod, payBankId);
    setEntryToPay(null);
    setRefreshKey(k => k + 1);
  };

  const openPixModal = (entry: FinancialEntry) => {
    setPixModalEntry(entry);
    setCopiedPix(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            {currentCompany.name} · Módulo Financeiro
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-teal-700" />
            <span>Gestão Financeira & DRE</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Contas a pagar e receber, fluxo de caixa, conciliação bancária e demonstrativo do resultado
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewEntryModalOpen(true)}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Receita Bruta (Mês)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums">
            {formatCurrency(dre.total_gross_revenue_cents, i18n.language)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Serviços, produtos e clubes</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Despesas & Custos</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 tabular-nums">
            {formatCurrency(dre.commissions_cost_cents + dre.supplies_cost_cents + dre.fixed_expenses_cents, i18n.language)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Comissões, insumos e custos fixos</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">EBITDA (Resultado)</span>
            <TrendingUp className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-teal-800 tabular-nums">
            {formatCurrency(dre.ebitda_cents, i18n.language)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Margem EBITDA de {dre.total_gross_revenue_cents > 0 ? Math.round((dre.ebitda_cents / dre.total_gross_revenue_cents) * 100) : 0}%
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Saldo em Bancos</span>
            <Building2 className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(bankAccounts.reduce((acc, b) => acc + b.balance_cents, 0), i18n.language)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {bankAccounts.length} contas ativas conciliadas
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          DRE Gerencial Detalhada
        </button>
        <button
          onClick={() => setActiveTab('payables')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'payables' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Contas a Pagar</span>
          <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full">
            {payables.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('receivables')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'receivables' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Contas a Receber</span>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
            {receivables.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'accounts' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Contas Bancárias & Conciliação
        </button>
      </div>

      {/* TAB 1: DRE GERENCIAL */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Demonstração do Resultado do Exercício (DRE) — {dre.period}
              </h2>
              <p className="text-xs text-slate-500">
                Valores calculados em tempo real com base no faturamento de serviços, produtos e clubes
              </p>
            </div>
            <div className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
              Regime de Competência & Caixa
            </div>
          </div>

          <div className="p-6 divide-y divide-slate-100 text-xs">
            {/* 1. Receita Bruta */}
            <div className="py-3 flex items-center justify-between font-bold text-slate-900">
              <span className="text-sm">(+) RECEITA BRUTA TOTAL</span>
              <span className="text-sm font-mono text-emerald-700 tabular-nums">
                {formatCurrency(dre.total_gross_revenue_cents, i18n.language)}
              </span>
            </div>
            <div className="py-2 pl-6 flex items-center justify-between text-slate-600">
              <span>Receita de Serviços & Terapias (Comandas)</span>
              <span className="font-mono tabular-nums">{formatCurrency(dre.gross_revenue_services_cents, i18n.language)}</span>
            </div>
            <div className="py-2 pl-6 flex items-center justify-between text-slate-600">
              <span>Venda de Produtos & Home Care no Balcão</span>
              <span className="font-mono tabular-nums">{formatCurrency(dre.gross_revenue_products_cents, i18n.language)}</span>
            </div>
            <div className="py-2 pl-6 flex items-center justify-between text-slate-600">
              <span>Receita Recorrente de Clubes de Assinatura</span>
              <span className="font-mono tabular-nums">{formatCurrency(dre.gross_revenue_subscriptions_cents, i18n.language)}</span>
            </div>

            {/* 2. Deduções */}
            <div className="py-3 flex items-center justify-between font-semibold text-rose-700 pt-4">
              <span>(-) DEDUÇÕES DA RECEITA BRUTA</span>
              <span className="font-mono tabular-nums">-{formatCurrency(dre.card_fees_cents + dre.taxes_cents, i18n.language)}</span>
            </div>
            <div className="py-2 pl-6 flex items-center justify-between text-slate-500">
              <span>Taxas de Intermediação de Cartão de Crédito/Débito (~2.4%)</span>
              <span className="font-mono tabular-nums">-{formatCurrency(dre.card_fees_cents, i18n.language)}</span>
            </div>
            <div className="py-2 pl-6 flex items-center justify-between text-slate-500">
              <span>Impostos sobre Serviços e Vendas (Simples Nacional ~6%)</span>
              <span className="font-mono tabular-nums">-{formatCurrency(dre.taxes_cents, i18n.language)}</span>
            </div>

            {/* 3. Receita Líquida */}
            <div className="py-3 flex items-center justify-between font-bold text-slate-900 bg-slate-50/70 px-4 rounded-lg my-2">
              <span>(=) RECEITA OPERACIONAL LÍQUIDA</span>
              <span className="font-mono text-teal-900 text-sm tabular-nums">
                {formatCurrency(dre.net_revenue_cents, i18n.language)}
              </span>
            </div>

            {/* 4. Custos Variáveis */}
            <div className="py-3 flex items-center justify-between font-semibold text-rose-700 pt-3">
              <span>(-) CUSTOS VARIÁVEIS DIRETOS</span>
              <span className="font-mono tabular-nums">-{formatCurrency(dre.commissions_cost_cents + dre.supplies_cost_cents, i18n.language)}</span>
            </div>
            <div className="py-2 pl-6 flex items-center justify-between text-slate-600">
              <span>Repasse de Comissões aos Terapeutas & Profissionais</span>
              <span className="font-mono tabular-nums">-{formatCurrency(dre.commissions_cost_cents, i18n.language)}</span>
            </div>
            <div className="py-2 pl-6 flex items-center justify-between text-slate-600">
              <span>Consumo de Insumos & Produtos por Ficha Técnica</span>
              <span className="font-mono tabular-nums">-{formatCurrency(dre.supplies_cost_cents, i18n.language)}</span>
            </div>

            {/* 5. Margem de Contribuição */}
            <div className="py-3 flex items-center justify-between font-bold text-slate-900 bg-teal-50/50 px-4 rounded-lg my-2 border border-teal-100">
              <span>(=) MARGEM DE CONTRIBUIÇÃO</span>
              <span className="font-mono text-teal-800 text-sm tabular-nums">
                {formatCurrency(dre.contribution_margin_cents, i18n.language)}
              </span>
            </div>

            {/* 6. Despesas Fixas */}
            <div className="py-3 flex items-center justify-between font-semibold text-rose-700 pt-3">
              <span>(-) DESPESAS OPERACIONAIS FIXAS</span>
              <span className="font-mono tabular-nums">-{formatCurrency(dre.fixed_expenses_cents, i18n.language)}</span>
            </div>
            <div className="py-2 pl-6 flex items-center justify-between text-slate-500">
              <span>Aluguel, Condomínio The Five e IPTU</span>
              <span className="font-mono tabular-nums">-R$ 5.200,00</span>
            </div>
            <div className="py-2 pl-6 flex items-center justify-between text-slate-500">
              <span>Energia Elétrica, Água e Internet</span>
              <span className="font-mono tabular-nums">-R$ 480,00</span>
            </div>
            <div className="py-2 pl-6 flex items-center justify-between text-slate-500">
              <span>Softwares, Licença Total Corp Pro e Telefonia</span>
              <span className="font-mono tabular-nums">-R$ 249,00</span>
            </div>

            {/* 7. EBITDA / Lucro Líquido */}
            <div className="py-4 flex items-center justify-between font-extrabold text-slate-900 bg-emerald-50 px-4 rounded-xl mt-4 border border-emerald-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
                <span className="text-sm text-emerald-950">(=) LUCRO OPERACIONAL / EBITDA</span>
              </div>
              <span className="font-mono text-emerald-800 text-base tabular-nums">
                {formatCurrency(dre.ebitda_cents, i18n.language)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTAS A PAGAR */}
      {activeTab === 'payables' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Filtrar por Status:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusFilter === 'all' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusFilter === 'paid' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Pagos
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Pendente a pagar: <strong className="text-rose-700 font-mono">{formatCurrency(totalPayablesPendingCents, i18n.language)}</strong>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Descrição & Categoria</th>
                  <th className="py-3 px-4">Fornecedor / Beneficiário</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payables.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.description}</div>
                      <div className="text-[11px] text-teal-800 font-medium">{CATEGORY_LABELS[item.category]}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{item.entity_name}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{item.due_date}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(item.amount_cents, i18n.language)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pago</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pendente</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.status === 'pending' ? (
                        <button
                          onClick={() => setEntryToPay(item)}
                          className="px-2.5 py-1 text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md transition-colors"
                        >
                          Liquidar / Pagar
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Liquidado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONTAS A RECEBER */}
      {activeTab === 'receivables' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Filtrar por Status:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusFilter === 'all' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusFilter === 'paid' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Recebidos
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Pendente a receber: <strong className="text-emerald-700 font-mono">{formatCurrency(totalReceivablesPendingCents, i18n.language)}</strong>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Descrição & Categoria</th>
                  <th className="py-3 px-4">Pagador / Cliente / Empresa</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Cobrança</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receivables.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.description}</div>
                      <div className="text-[11px] text-teal-800 font-medium">{CATEGORY_LABELS[item.category]}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{item.entity_name}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{item.due_date}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      {formatCurrency(item.amount_cents, i18n.language)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Recebido</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>A Receber</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openPixModal(item)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Pix</span>
                        </button>
                        {item.status === 'pending' && (
                          <button
                            onClick={() => {
                              financialEngine.markAsPaid(item.id, 'pix', 'bank_itau_01');
                              setRefreshKey(k => k + 1);
                            }}
                            className="px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                            title="Confirmar recebimento manual"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CONTAS BANCÁRIAS & CONCILIAÇÃO */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bankAccounts.map((account) => (
            <div key={account.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-sm border border-teal-200">
                    <Building2 className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{account.bank_name}</h2>
                    <div className="text-xs text-slate-500 font-mono">
                      Agência: {account.agency} · Conta: {account.account_number}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Conciliada
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-500">Saldo Disponível:</div>
                <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                  {formatCurrency(account.balance_cents, i18n.language)}
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Chave Pix Cadastrada:</span>
                  <span className="font-mono font-medium text-slate-800">{account.pix_key}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(account.pix_key);
                    alert('Chave Pix copiada com sucesso!');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600"
                  title="Copiar Chave Pix"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: NOVO LANÇAMENTO */}
      {isNewEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Novo Lançamento Financeiro</h2>
              <button onClick={() => setIsNewEntryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewType('expense')}
                  className={`py-2 rounded-lg font-bold border transition-all ${
                    newType === 'expense'
                      ? 'bg-rose-50 border-rose-300 text-rose-800 ring-1 ring-rose-400'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Despesa (A Pagar)
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('revenue')}
                  className={`py-2 rounded-lg font-bold border transition-all ${
                    newType === 'revenue'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-400'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Receita (A Receber)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição:</label>
                <input
                  type="text"
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ex: Compra de Óleos Essenciais, Aluguel, etc."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-teal-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as FinancialCategory)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-teal-600 focus:outline-hidden"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:border-teal-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {newType === 'expense' ? 'Fornecedor:' : 'Cliente / Pagador:'}
                  </label>
                  <input
                    type="text"
                    value={newEntity}
                    onChange={(e) => setNewEntity(e.target.value)}
                    placeholder="Nome da empresa ou pessoa"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-teal-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data de Vencimento:</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-teal-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewEntryModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LIQUIDAR / PAGAR CONTA */}
      {entryToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Confirmar Pagamento</h2>
              <button onClick={() => setEntryToPay(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500">{entryToPay.description}</div>
                <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                  {formatCurrency(entryToPay.amount_cents, i18n.language)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Beneficiário: {entryToPay.entity_name}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Método Utilizado:</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="pix">Pix Instantâneo</option>
                  <option value="bank_transfer">Transferência Bancária (TED)</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="credit_card">Cartão de Crédito Corporativo</option>
                  <option value="cash">Dinheiro em Espécie (Caixa Recepção)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Debitar de Qual Conta:</label>
                <select
                  value={payBankId}
                  onChange={(e) => setPayBankId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bank_name} — Saldo: {formatCurrency(b.balance_cents, i18n.language)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setEntryToPay(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Liquidação</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COBRANÇA PIX */}
      {pixModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center animate-in zoom-in-95 duration-150">
            <div className="flex justify-end">
              <button onClick={() => setPixModalEntry(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-200">
              <QrCode className="w-6 h-6" />
            </div>

            <h2 className="text-base font-bold text-slate-900">Cobrança Pix Instantâneo</h2>
            <p className="text-xs text-slate-500 mt-0.5">{pixModalEntry.description}</p>

            <div className="text-2xl font-bold text-emerald-800 font-mono my-3">
              {formatCurrency(pixModalEntry.amount_cents, i18n.language)}
            </div>

            {/* Simulated QR Code Visual */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 p-4 rounded-xl mx-auto w-48 h-48 flex flex-col items-center justify-center gap-2">
              <QrCode className="w-32 h-32 text-slate-800" />
              <span className="text-[10px] text-slate-400 font-mono">Chave: financeiro@naturospa.com.br</span>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  const pixData = financialEngine.generatePixPaymentString(pixModalEntry.amount_cents, pixModalEntry.description);
                  navigator.clipboard.writeText(pixData.pixCode);
                  setCopiedPix(true);
                  setTimeout(() => setCopiedPix(false), 2500);
                }}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-2.5 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                {copiedPix ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copia e Cola Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Código Pix Copia e Cola</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setPixModalEntry(null)}
                className="w-full text-xs text-slate-500 hover:text-slate-700 py-1.5"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
