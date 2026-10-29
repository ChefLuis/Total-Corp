import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { posEngine } from '../../services/pos/posEngine';
import { Tab, TabItem, TabPayment, PaymentMethod, CashRegister, CashMovement } from '../../services/pos/types';
import { INITIAL_CLIENTS, INITIAL_SERVICES, INITIAL_PROFESSIONALS } from '../../services/mockData';
import { formatCurrency } from '../../utils/currency';
import {
  Receipt,
  Plus,
  DollarSign,
  CreditCard,
  QrCode,
  Wallet,
  ShoppingBag,
  Printer,
  Share2,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Lock,
  User,
  Scissors,
  Coffee,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function TabsPage() {
  const { t, i18n } = useTranslation();
  const { currentCompany, activeUnit, currentUser } = useAuth();
  const { canAccess } = useRBAC();

  const [activeTabSubnav, setActiveTabSubnav] = useState<'open_tabs' | 'closed_tabs' | 'cash_register'>('open_tabs');
  const [refreshKey, setRefreshKey] = useState(0);

  // Selected tab for payment modal
  const [selectedTabForPayment, setSelectedTabForPayment] = useState<Tab | null>(null);
  const [receiptModalTab, setReceiptModalTab] = useState<Tab | null>(null);

  // New tab modal state
  const [isNewTabModalOpen, setIsNewTabModalOpen] = useState(false);
  const [newTabClientId, setNewTabClientId] = useState(INITIAL_CLIENTS[0].id);

  // Add Item to tab modal state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [targetTabId, setTargetTabId] = useState<string | null>(null);
  const [newItemServiceId, setNewItemServiceId] = useState(INITIAL_SERVICES[0].id);
  const [newItemProfId, setNewItemProfId] = useState(INITIAL_PROFESSIONALS[0].id);

  // Cash movement modal state
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  const [cashMovementType, setCashMovementType] = useState<'supply' | 'bleed'>('supply');
  const [cashMovementAmount, setCashMovementAmount] = useState<string>('50.00');
  const [cashMovementReason, setCashMovementReason] = useState<string>('');

  // Close cash register modal state
  const [isCloseRegisterModalOpen, setIsCloseRegisterModalOpen] = useState(false);
  const [countedCash, setCountedCash] = useState<string>('300.00');

  // Multi-payment form state
  const [paymentsList, setPaymentsList] = useState<{
    method: PaymentMethod;
    amount_cents: number;
    received_cents?: number;
    installments?: number;
  }[]>([]);

  const openTabs = posEngine.getTabs(currentCompany.id, 'open');
  const closedTabs = posEngine.getTabs(currentCompany.id, 'closed');
  const activeRegister = posEngine.getActiveCashRegister(currentCompany.id, activeUnit ? activeUnit.id : 'unit_the_five_01');
  const cashMovements = activeRegister ? posEngine.getCashMovements(activeRegister.id) : [];

  // Initialize payment modal
  const handleOpenPaymentModal = (tab: Tab) => {
    setSelectedTabForPayment(tab);
    // Pre-populate with Pix as default for full amount
    setPaymentsList([
      { method: 'pix', amount_cents: tab.total_cents },
    ]);
  };

  const handleAddPaymentMethod = () => {
    if (!selectedTabForPayment) return;
    const currentAllocated = paymentsList.reduce((acc, curr) => acc + curr.amount_cents, 0);
    const remaining = Math.max(0, selectedTabForPayment.total_cents - currentAllocated);

    setPaymentsList([...paymentsList, { method: 'credit_card', amount_cents: remaining, installments: 1 }]);
  };

  const handleRemovePaymentMethod = (index: number) => {
    setPaymentsList(paymentsList.filter((_, i) => i !== index));
  };

  const handleCloseTabSubmit = () => {
    if (!selectedTabForPayment) return;

    const result = posEngine.closeTab({
      tab_id: selectedTabForPayment.id,
      cashier_name: currentUser.full_name,
      payments: paymentsList,
    });

    if (result.success && result.tab) {
      setReceiptModalTab(result.tab);
      setSelectedTabForPayment(null);
      setRefreshKey(k => k + 1);
    } else {
      alert(result.error || 'Erro ao fechar comanda.');
    }
  };

  const handleOpenNewTab = (e: React.FormEvent) => {
    e.preventDefault();
    const client = INITIAL_CLIENTS.find(c => c.id === newTabClientId) || INITIAL_CLIENTS[0];

    posEngine.openTab({
      company_id: currentCompany.id,
      unit_id: activeUnit ? activeUnit.id : 'unit_the_five_01',
      client_id: client.id,
      client_name: client.name,
      client_phone: client.phone,
      cashier_id: currentUser.id,
      cashier_name: currentUser.full_name,
      notes: 'Comanda avulsa aberta no balcão',
    });

    setIsNewTabModalOpen(false);
    setRefreshKey(k => k + 1);
  };

  const handleAddItemToTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTabId) return;
    const service = INITIAL_SERVICES.find(s => s.id === newItemServiceId);
    if (!service) return;

    posEngine.addItemToTab(targetTabId, {
      type: 'service',
      item_id: service.id,
      name: service.name,
      professional_id: newItemProfId,
      quantity: 1,
      unit_price_cents: service.price_cents,
      discount_cents: 0,
    });

    setIsAddItemModalOpen(false);
    setRefreshKey(k => k + 1);
  };

  const handleRecordCashMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRegister) return;

    const cents = Math.round(parseFloat(cashMovementAmount) * 100);
    posEngine.recordCashMovement({
      cash_register_id: activeRegister.id,
      type: cashMovementType,
      amount_cents: cents,
      reason: cashMovementReason || (cashMovementType === 'supply' ? 'Suprimento de troco' : 'Sangria de cofre'),
      created_by: currentUser.full_name,
    });

    setIsCashMovementModalOpen(false);
    setCashMovementReason('');
    setRefreshKey(k => k + 1);
  };

  const handleCloseRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRegister) return;

    const countedCents = Math.round(parseFloat(countedCash) * 100);
    const result = posEngine.closeCashRegister({
      cash_register_id: activeRegister.id,
      counted_cash_cents: countedCents,
      closed_by: currentUser.full_name,
    });

    if (result.success) {
      alert(`Caixa fechado com sucesso! Diferença apurada: ${formatCurrency(result.register?.difference_cents || 0)}`);
      setIsCloseRegisterModalOpen(false);
      setRefreshKey(k => k + 1);
    }
  };

  const calculatedTotalAllocated = paymentsList.reduce((acc, curr) => acc + curr.amount_cents, 0);
  const remainingToPay = selectedTabForPayment ? Math.max(0, selectedTabForPayment.total_cents - calculatedTotalAllocated) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            {currentCompany.name} · Ponto de Venda & Frente de Caixa
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-700" />
            Comandas & Caixa (PDV)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pagamentos mistos (Pix, Cartão, Dinheiro), sangria, suprimento e comprovantes instantâneos
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewTabModalOpen(true)}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Abrir Nova Comanda</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
        <button
          onClick={() => setActiveTabSubnav('open_tabs')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
            activeTabSubnav === 'open_tabs' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Comandas Abertas</span>
          <span className="text-[10px] bg-teal-700 text-white px-1.5 py-0.2 rounded-full font-bold">
            {openTabs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSubnav('cash_register')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
            activeTabSubnav === 'cash_register' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-teal-700" />
          <span>Gestão do Caixa</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded font-semibold">
            {activeRegister ? 'Aberto' : 'Fechado'}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSubnav('closed_tabs')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTabSubnav === 'closed_tabs' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Histórico de Comandas Fechadas ({closedTabs.length})
        </button>
      </div>

      {/* SUB-TAB 1: OPEN TABS */}
      {activeTabSubnav === 'open_tabs' && (
        <div className="space-y-4">
          {openTabs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {openTabs.map((tab) => (
                <div
                  key={tab.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            Comanda #{tab.id.slice(-4)}
                          </span>
                          <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            Em Atendimento
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-teal-700" />
                          <span>{tab.client_name}</span>
                        </h3>
                        <div className="text-[11px] font-mono text-slate-500">{tab.client_phone}</div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Total a Pagar</span>
                        <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                          {formatCurrency(tab.total_cents, i18n.language)}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg p-2 bg-slate-50/40 text-xs">
                      {tab.items.map((item) => {
                        const prof = INITIAL_PROFESSIONALS.find(p => p.id === item.professional_id);
                        return (
                          <div key={item.id} className="py-1.5 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-slate-900">{item.name}</div>
                              <div className="text-[10px] text-slate-500">
                                {prof ? `Profissional: ${prof.name}` : 'Sem profissional'}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-slate-900 tabular-nums">
                                {formatCurrency(item.total_cents, i18n.language)}
                              </span>
                              <button
                                onClick={() => {
                                  posEngine.removeItemFromTab(tab.id, item.id);
                                  setRefreshKey(k => k + 1);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-0.5"
                                title="Remover item"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {tab.items.length === 0 && (
                        <div className="py-4 text-center text-slate-400 text-[11px]">
                          Nenhum serviço ou produto adicionado.
                        </div>
                      )}
                    </div>

                    {/* Adjustments row */}
                    <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                      <span>Subtotal: {formatCurrency(tab.subtotal_cents, i18n.language)}</span>
                      {tab.tip_cents > 0 && (
                        <span className="text-emerald-700 font-medium">
                          + Gorjeta: {formatCurrency(tab.tip_cents, i18n.language)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    <button
                      onClick={() => {
                        setTargetTabId(tab.id);
                        setIsAddItemModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-lg border border-teal-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Item</span>
                    </button>

                    <button
                      onClick={() => handleOpenPaymentModal(tab)}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded-lg shadow-xs transition-colors"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Fechar Comanda</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <Receipt className="w-12 h-12 text-teal-700 mx-auto opacity-40" />
              <h3 className="text-base font-bold text-slate-900">Nenhuma comanda aberta no momento</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Abra uma comanda avulsa ou inicie um atendimento a partir da agenda para registrar serviços e produtos.
              </p>
              <button
                onClick={() => setIsNewTabModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Abrir Nova Comanda</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: CASH DRAWER & REGISTER */}
      {activeTabSubnav === 'cash_register' && (
        <div className="space-y-6">
          {activeRegister ? (
            <>
              {/* Cash Register Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs font-medium text-slate-500">Fundo de Abertura (Troco)</span>
                  <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                    {formatCurrency(activeRegister.opening_balance_cents, i18n.language)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Aberto por {activeRegister.opened_by}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs font-medium text-slate-500">Saldo Atual em Dinheiro</span>
                  <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
                    {formatCurrency(
                      cashMovements.reduce((acc, curr) => {
                        if (curr.type === 'supply' || curr.type === 'tab_payment' || curr.type === 'opening') {
                          return acc + curr.amount_cents;
                        } else if (curr.type === 'bleed') {
                          return acc - curr.amount_cents;
                        }
                        return acc;
                      }, 0),
                      i18n.language
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-1">
                    Gaveta física conferida
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500">Ações Rápidas de Caixa</span>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => {
                          setCashMovementType('supply');
                          setIsCashMovementModalOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-xs py-2 px-2.5 rounded-lg border border-emerald-200 transition-colors"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Suprimento</span>
                      </button>

                      <button
                        onClick={() => {
                          setCashMovementType('bleed');
                          setIsCashMovementModalOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-900 font-semibold text-xs py-2 px-2.5 rounded-lg border border-rose-200 transition-colors"
                      >
                        <TrendingDown className="w-3.5 h-3.5 text-rose-700" />
                        <span>Sangria</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsCloseRegisterModalOpen(true)}
                    className="w-full mt-3 bg-slate-900 hover:bg-black text-white text-xs font-bold py-2 rounded-lg shadow-xs transition-colors"
                  >
                    Encerrar e Fechar Caixa do Dia
                  </button>
                </div>
              </div>

              {/* Movements Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Movimentações da Gaveta de Caixa
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">{cashMovements.length} movimentos</span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Motivo / Descrição</th>
                      <th className="py-3 px-4">Responsável</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4 text-right">Horário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cashMovements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              mov.type === 'supply' || mov.type === 'opening'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : mov.type === 'bleed'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            {mov.type === 'supply' ? 'Suprimento' : mov.type === 'bleed' ? 'Sangria' : mov.type === 'opening' ? 'Abertura' : 'Pagamento'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium">{mov.reason}</td>
                        <td className="py-3 px-4 text-slate-500">{mov.created_by}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatCurrency(mov.amount_cents, i18n.language)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500">
                          {new Date(mov.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
              <Lock className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">O Caixa desta unidade está fechado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Informe o saldo inicial de abertura (fundo de troco da gaveta) para iniciar as operações do dia.
              </p>
              <button
                onClick={() => {
                  posEngine.openCashRegister({
                    company_id: currentCompany.id,
                    unit_id: activeUnit ? activeUnit.id : 'unit_the_five_01',
                    opened_by: currentUser.full_name,
                    opening_balance_cents: 30000,
                  });
                  setRefreshKey(k => k + 1);
                }}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-xs transition-colors"
              >
                Abrir Caixa com R$ 300,00 de Troco
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: CLOSED TABS & RECEIPTS */}
      {activeTabSubnav === 'closed_tabs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Comandas Liquidadas Recentemente
            </h3>
            <span className="text-xs text-slate-500 font-mono">{closedTabs.length} fechadas</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Comanda</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Formas de Pagamento</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {closedTabs.map((tab) => (
                <tr key={tab.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    #{tab.id.slice(-6)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{tab.client_name}</div>
                    <div className="text-[11px] text-slate-500">{tab.client_phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {tab.payments.map((p) => (
                        <span
                          key={p.id}
                          className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                        >
                          {p.method}: {formatCurrency(p.amount_cents, i18n.language)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrency(tab.total_cents, i18n.language)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setReceiptModalTab(tab)}
                      className="text-teal-700 hover:text-teal-900 font-bold text-xs"
                    >
                      Ver Comprovante
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: FECHAMENTO DE COMANDA COM PAGAMENTO MISTO */}
      {selectedTabForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Fechar Comanda #{selectedTabForPayment.id.slice(-4)}
                </h3>
              </div>
              <button onClick={() => setSelectedTabForPayment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Balance Ribbon */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Total a Pagar</span>
                <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                  {formatCurrency(selectedTabForPayment.total_cents, i18n.language)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Restante a Alocar</span>
                <span className={`text-base font-bold font-mono tabular-nums ${remainingToPay === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {formatCurrency(remainingToPay, i18n.language)}
                </span>
              </div>
            </div>

            {/* Multi-Payment Methods Splitter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Formas de Pagamento (Misto):</span>
                <button
                  type="button"
                  onClick={handleAddPaymentMethod}
                  className="text-teal-700 hover:text-teal-800 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Dividir em Outra Forma</span>
                </button>
              </div>

              {paymentsList.map((p, index) => (
                <div key={index} className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={p.method}
                      onChange={(e) => {
                        const newMethod = e.target.value as PaymentMethod;
                        const copy = [...paymentsList];
                        copy[index].method = newMethod;
                        setPaymentsList(copy);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-800 bg-slate-50"
                    >
                      <option value="pix">Pix (QR Code Dinâmico)</option>
                      <option value="credit_card">Cartão de Crédito</option>
                      <option value="debit_card">Cartão de Débito</option>
                      <option value="cash">Dinheiro em Espécie</option>
                      <option value="client_credit">Saldo do Cliente</option>
                    </select>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-mono">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={(p.amount_cents / 100).toFixed(2)}
                        onChange={(e) => {
                          const cents = Math.round(parseFloat(e.target.value || '0') * 100);
                          const copy = [...paymentsList];
                          copy[index].amount_cents = cents;
                          setPaymentsList(copy);
                        }}
                        className="w-24 px-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded-lg text-right"
                      />

                      {paymentsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePaymentMethod(index)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cash Change Calculator */}
                  {p.method === 'cash' && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <span>Valor Entregue: R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Valor"
                          onChange={(e) => {
                            const recCents = Math.round(parseFloat(e.target.value || '0') * 100);
                            const copy = [...paymentsList];
                            copy[index].received_cents = recCents;
                            setPaymentsList(copy);
                          }}
                          className="w-20 px-2 py-0.5 text-xs font-mono border border-slate-200 rounded text-right"
                        />
                      </div>
                      <div className="text-emerald-700 font-bold font-mono">
                        Troco: {formatCurrency(Math.max(0, (p.received_cents || p.amount_cents) - p.amount_cents), i18n.language)}
                      </div>
                    </div>
                  )}

                  {/* Pix QR Code simulation */}
                  {p.method === 'pix' && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-teal-800 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Chave e QR Code dinâmicos gerados</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => alert('Chave Pix Copia e Cola copiada para a área de transferência!')}
                        className="font-bold underline"
                      >
                        Copiar Pix
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Closing */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTabForPayment(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCloseTabSubmit}
                disabled={remainingToPay > 0}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                Confirmar Fechamento & Emitir Recibo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPROVANTE DIGITAL (PRINT & WHATSAPP) */}
      {receiptModalTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Comprovante de Pagamento</h3>
              </div>
              <button onClick={() => setReceiptModalTab(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Slip Simulation */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 font-mono text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap shadow-inner">
              {posEngine.generateReceipt(receiptModalTab).text}
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  const receiptText = posEngine.generateReceipt(receiptModalTab).text;
                  navigator.clipboard.writeText(receiptText);
                  alert(`Comprovante enviado com sucesso para o WhatsApp ${receiptModalTab.client_phone}!`);
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 rounded-lg shadow-xs transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar Recibo por WhatsApp</span>
              </button>

              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Cupom Não-Fiscal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ABRIR NOVA COMANDA */}
      {isNewTabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Abrir Nova Comanda Avulsa</h3>
              <button onClick={() => setIsNewTabModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenNewTab} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cliente *</label>
                <select
                  value={newTabClientId}
                  onChange={(e) => setNewTabClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {INITIAL_CLIENTS.filter(c => c.company_id === currentCompany.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTabModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Criar Comanda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR ITEM NA COMANDA */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Adicionar Serviço ou Insumo à Comanda</h3>
              <button onClick={() => setIsAddItemModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItemToTab} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Serviço / Item *</label>
                <select
                  value={newItemServiceId}
                  onChange={(e) => setNewItemServiceId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {INITIAL_SERVICES.filter(s => s.company_id === currentCompany.id).map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {formatCurrency(s.price_cents, i18n.language)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Profissional Executor (para comissão) *</label>
                <select
                  value={newItemProfId}
                  onChange={(e) => setNewItemProfId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {INITIAL_PROFESSIONALS.filter(p => p.company_id === currentCompany.id).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.commission_rate}% comissão)</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Inserir na Comanda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVIMENTAÇÃO DE CAIXA (SANGRIA / SUPRIMENTO) */}
      {isCashMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {cashMovementType === 'supply' ? 'Suprimento de Caixa (Entrada)' : 'Sangria de Caixa (Retirada)'}
              </h3>
              <button onClick={() => setIsCashMovementModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordCashMovement} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={cashMovementAmount}
                  onChange={(e) => setCashMovementAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo / Justificativa *</label>
                <input
                  type="text"
                  required
                  value={cashMovementReason}
                  onChange={(e) => setCashMovementReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  placeholder={cashMovementType === 'supply' ? 'Ex: Troco inicial em moedas' : 'Ex: Recolhimento para cofre / despesa'}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCashMovementModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white font-bold text-xs rounded-lg shadow-xs ${
                    cashMovementType === 'supply' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  Registrar Movimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FECHAMENTO DE CAIXA DO DIA */}
      {isCloseRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Encerrar e Fechar Caixa</h3>
              <button onClick={() => setIsCloseRegisterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseRegisterSubmit} className="space-y-3.5 text-xs">
              <p className="text-slate-500">
                Faça a contagem física das notas e moedas na gaveta e informe o valor abaixo para apuração de diferenças:
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valor Contado em Dinheiro (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCloseRegisterModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Concluir Fechamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
