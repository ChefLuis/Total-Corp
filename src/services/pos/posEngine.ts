import { Tab, TabItem, TabPayment, TabStatus, PaymentMethod, CashRegister, CashMovement } from './types';
import { INITIAL_COMPANIES, INITIAL_CLIENTS, INITIAL_SERVICES, INITIAL_PROFESSIONALS } from '../mockData';
import { calendarEngine } from '../calendarEngine';
import { formatCurrency } from '../../utils/currency';

class PosEngineStore {
  private tabs: Tab[] = [];
  private cashRegisters: CashRegister[] = [];
  private cashMovements: CashMovement[] = [];

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window !== 'undefined') {
      const savedTabs = localStorage.getItem('totalcorp_tabs');
      this.tabs = savedTabs ? JSON.parse(savedTabs) : [
        {
          id: 'tab_001',
          company_id: 'comp_naturo_spa_01',
          unit_id: 'unit_the_five_01',
          client_id: 'cli_helena_01',
          client_name: 'Helena Ribeiro Castro',
          client_phone: '(41) 99123-4567',
          appointment_id: 'apt_001',
          status: 'open',
          items: [
            {
              id: 'item_01',
              type: 'service',
              item_id: 'srv_toque_integrativo_01',
              name: 'Toque Integrativo Corporal (Massagem Autoral)',
              professional_id: 'prof_beatriz_01',
              quantity: 1,
              unit_price_cents: 42000,
              discount_cents: 0,
              total_cents: 42000,
            },
            {
              id: 'item_02',
              type: 'product',
              item_id: 'prod_oleo_lavanda',
              name: 'Óleo Essencial Puro de Lavanda Francesa (10ml)',
              professional_id: 'prof_beatriz_01',
              quantity: 1,
              unit_price_cents: 8500,
              discount_cents: 0,
              total_cents: 8500,
            },
          ],
          subtotal_cents: 50500,
          discount_cents: 0,
          tip_cents: 3000, // R$ 30,00 de gorjeta para a Beatriz
          total_cents: 53500,
          paid_cents: 0,
          payments: [],
          notes: 'Cliente solicitou inclusão do óleo de lavanda para uso domiciliar.',
          cashier_id: 'usr_recep_01',
          cashier_name: 'Mariana Duarte (Recepção)',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ];

      const savedRegisters = localStorage.getItem('totalcorp_cash_registers');
      this.cashRegisters = savedRegisters ? JSON.parse(savedRegisters) : [
        {
          id: 'reg_today_01',
          company_id: 'comp_naturo_spa_01',
          unit_id: 'unit_the_five_01',
          opened_by: 'Mariana Duarte (Recepção)',
          opening_balance_cents: 30000, // R$ 300,00 de fundo de troco
          status: 'open',
          opened_at: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
        },
      ];

      const savedMovements = localStorage.getItem('totalcorp_cash_movements');
      this.cashMovements = savedMovements ? JSON.parse(savedMovements) : [
        {
          id: 'mov_01',
          cash_register_id: 'reg_today_01',
          company_id: 'comp_naturo_spa_01',
          unit_id: 'unit_the_five_01',
          type: 'opening',
          amount_cents: 30000,
          reason: 'Fundo inicial de troco da gaveta',
          created_by: 'Mariana Duarte',
          created_at: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
        },
      ];
    } else {
      this.tabs = [];
      this.cashRegisters = [];
    }
  }

  private persist() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('totalcorp_tabs', JSON.stringify(this.tabs));
      localStorage.setItem('totalcorp_cash_registers', JSON.stringify(this.cashRegisters));
      localStorage.setItem('totalcorp_cash_movements', JSON.stringify(this.cashMovements));
    }
  }

  public getTabs(companyId: string, status?: TabStatus): Tab[] {
    return this.tabs.filter((t) => {
      if (t.company_id !== companyId) return false;
      if (status && t.status !== status) return false;
      return true;
    });
  }

  public getTabById(id: string): Tab | undefined {
    return this.tabs.find((t) => t.id === id);
  }

  public getActiveCashRegister(companyId: string, unitId: string): CashRegister | undefined {
    return this.cashRegisters.find(
      (r) => r.company_id === companyId && r.unit_id === unitId && r.status === 'open'
    );
  }

  public getCashMovements(cashRegisterId: string): CashMovement[] {
    return this.cashMovements.filter((m) => m.cash_register_id === cashRegisterId);
  }

  // Open a new Tab
  public openTab(params: {
    company_id: string;
    unit_id: string;
    client_id: string;
    client_name: string;
    client_phone: string;
    appointment_id?: string;
    cashier_id: string;
    cashier_name: string;
    initial_items?: TabItem[];
    notes?: string;
  }): Tab {
    const items = params.initial_items || [];
    const subtotal = items.reduce((acc, curr) => acc + curr.total_cents, 0);

    const newTab: Tab = {
      id: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      company_id: params.company_id,
      unit_id: params.unit_id,
      client_id: params.client_id,
      client_name: params.client_name,
      client_phone: params.client_phone,
      appointment_id: params.appointment_id,
      status: 'open',
      items: items,
      subtotal_cents: subtotal,
      discount_cents: 0,
      tip_cents: 0,
      total_cents: subtotal,
      paid_cents: 0,
      payments: [],
      notes: params.notes,
      cashier_id: params.cashier_id,
      cashier_name: params.cashier_name,
      created_at: new Date().toISOString(),
    };

    this.tabs.unshift(newTab);
    this.persist();
    return newTab;
  }

  // Add Item to Tab
  public addItemToTab(tabId: string, item: Omit<TabItem, 'id' | 'total_cents'>): Tab | null {
    const tab = this.tabs.find((t) => t.id === tabId);
    if (!tab || tab.status !== 'open') return null;

    const totalCents = item.quantity * item.unit_price_cents - (item.discount_cents || 0);
    const newItem: TabItem = {
      id: `item_${Date.now()}`,
      ...item,
      total_cents: Math.max(0, totalCents),
    };

    tab.items.push(newItem);
    this.recalculateTab(tab);
    this.persist();
    return tab;
  }

  // Remove Item from Tab
  public removeItemFromTab(tabId: string, itemId: string): Tab | null {
    const tab = this.tabs.find((t) => t.id === tabId);
    if (!tab || tab.status !== 'open') return null;

    tab.items = tab.items.filter((i) => i.id !== itemId);
    this.recalculateTab(tab);
    this.persist();
    return tab;
  }

  // Apply Discount and Tip
  public updateAdjustments(tabId: string, discountCents: number, tipCents: number): Tab | null {
    const tab = this.tabs.find((t) => t.id === tabId);
    if (!tab || tab.status !== 'open') return null;

    tab.discount_cents = Math.max(0, discountCents);
    tab.tip_cents = Math.max(0, tipCents);
    this.recalculateTab(tab);
    this.persist();
    return tab;
  }

  private recalculateTab(tab: Tab) {
    tab.subtotal_cents = tab.items.reduce((acc, curr) => acc + curr.total_cents, 0);
    tab.total_cents = Math.max(0, tab.subtotal_cents - tab.discount_cents + tab.tip_cents);
  }

  // Close Tab with Mixed Payments
  public closeTab(params: {
    tab_id: string;
    payments: Omit<TabPayment, 'id' | 'tab_id' | 'created_at' | 'status'>[];
    cashier_name: string;
  }): { success: boolean; tab?: Tab; error?: string } {
    const tab = this.tabs.find((t) => t.id === params.tab_id);
    if (!tab) return { success: false, error: 'Comanda não encontrada.' };
    if (tab.status === 'closed') return { success: false, error: 'Esta comanda já foi encerrada.' };

    const totalPaid = params.payments.reduce((acc, curr) => acc + curr.amount_cents, 0);

    // Exact amount verification
    if (totalPaid < tab.total_cents) {
      return {
        success: false,
        error: `Valor insuficiente. Total: ${formatCurrency(tab.total_cents)}, Informado: ${formatCurrency(totalPaid)}.`,
      };
    }

    const completedPayments: TabPayment[] = params.payments.map((p) => {
      let change = 0;
      if (p.method === 'cash' && p.received_cents && p.received_cents > p.amount_cents) {
        change = p.received_cents - p.amount_cents;
      }
      return {
        id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        tab_id: tab.id,
        ...p,
        change_cents: change,
        status: 'completed',
        created_at: new Date().toISOString(),
      };
    });

    tab.payments = completedPayments;
    tab.paid_cents = totalPaid;
    tab.status = 'closed';
    tab.closed_at = new Date().toISOString();

    // If linked to an appointment, mark appointment as completed automatically!
    if (tab.appointment_id) {
      calendarEngine.updateStatus(tab.appointment_id, 'completed', `Fechamento de Comanda por ${params.cashier_name}`);
    }

    // Record cash movement if paid in cash
    const cashPayment = completedPayments.find((p) => p.method === 'cash');
    if (cashPayment) {
      const activeRegister = this.getActiveCashRegister(tab.company_id, tab.unit_id);
      if (activeRegister) {
        this.cashMovements.push({
          id: `mov_${Date.now()}`,
          cash_register_id: activeRegister.id,
          company_id: tab.company_id,
          unit_id: tab.unit_id,
          type: 'tab_payment',
          amount_cents: cashPayment.amount_cents,
          method: 'cash',
          reason: `Pagamento em dinheiro da Comanda #${tab.id.slice(-4)} (${tab.client_name})`,
          created_by: params.cashier_name,
          created_at: new Date().toISOString(),
        });
      }
    }

    this.persist();
    return { success: true, tab };
  }

  // Open Cash Register
  public openCashRegister(params: {
    company_id: string;
    unit_id: string;
    opened_by: string;
    opening_balance_cents: number;
  }): { success: boolean; register?: CashRegister; error?: string } {
    const existing = this.getActiveCashRegister(params.company_id, params.unit_id);
    if (existing) {
      return { success: false, error: 'Já existe um caixa aberto para esta unidade.' };
    }

    const newRegister: CashRegister = {
      id: `reg_${Date.now()}`,
      company_id: params.company_id,
      unit_id: params.unit_id,
      opened_by: params.opened_by,
      opening_balance_cents: params.opening_balance_cents,
      status: 'open',
      opened_at: new Date().toISOString(),
    };

    this.cashRegisters.push(newRegister);

    this.cashMovements.push({
      id: `mov_${Date.now()}`,
      cash_register_id: newRegister.id,
      company_id: params.company_id,
      unit_id: params.unit_id,
      type: 'opening',
      amount_cents: params.opening_balance_cents,
      reason: 'Fundo inicial de troco',
      created_by: params.opened_by,
      created_at: new Date().toISOString(),
    });

    this.persist();
    return { success: true, register: newRegister };
  }

  // Record Cash Supply (Suprimento) or Bleed (Sangria)
  public recordCashMovement(params: {
    cash_register_id: string;
    type: 'supply' | 'bleed';
    amount_cents: number;
    reason: string;
    created_by: string;
  }): { success: boolean; movement?: CashMovement; error?: string } {
    const register = this.cashRegisters.find((r) => r.id === params.cash_register_id);
    if (!register || register.status !== 'open') {
      return { success: false, error: 'Caixa fechado ou inexistente.' };
    }

    const newMov: CashMovement = {
      id: `mov_${Date.now()}`,
      cash_register_id: register.id,
      company_id: register.company_id,
      unit_id: register.unit_id,
      type: params.type,
      amount_cents: params.amount_cents,
      reason: params.reason,
      created_by: params.created_by,
      created_at: new Date().toISOString(),
    };

    this.cashMovements.push(newMov);
    this.persist();
    return { success: true, movement: newMov };
  }

  // Close Cash Register with Reconciliation
  public closeCashRegister(params: {
    cash_register_id: string;
    counted_cash_cents: number;
    closed_by: string;
  }): { success: boolean; register?: CashRegister; error?: string } {
    const register = this.cashRegisters.find((r) => r.id === params.cash_register_id);
    if (!register || register.status !== 'open') {
      return { success: false, error: 'Caixa já encerrado.' };
    }

    const movements = this.getCashMovements(register.id);
    let calculated = register.opening_balance_cents;

    for (const m of movements) {
      if (m.type === 'supply' || m.type === 'tab_payment') {
        calculated += m.amount_cents;
      } else if (m.type === 'bleed') {
        calculated -= m.amount_cents;
      }
    }

    register.calculated_balance_cents = calculated;
    register.closing_balance_cents = params.counted_cash_cents;
    register.difference_cents = params.counted_cash_cents - calculated;
    register.status = 'closed';
    register.closed_at = new Date().toISOString();

    this.persist();
    return { success: true, register };
  }

  // Generate Digital Printable & WhatsApp Receipt text
  public generateReceipt(tab: Tab): { text: string; pixPayload?: string } {
    const company = INITIAL_COMPANIES.find((c) => c.id === tab.company_id) || INITIAL_COMPANIES[0];
    const itemsLines = tab.items
      .map((i) => `· ${i.quantity}x ${i.name} — ${formatCurrency(i.total_cents)}`)
      .join('\n');

    const paymentLines = tab.payments
      .map((p) => `· ${p.method.toUpperCase()}: ${formatCurrency(p.amount_cents)}${p.change_cents ? ` (Troco: ${formatCurrency(p.change_cents)})` : ''}`)
      .join('\n');

    const text = `
🌿 *${company.trade_name.toUpperCase()}*
Rua Nunes Machado, 68 - The Five · Curitiba/PR
CNPJ: ${company.document}
----------------------------------------
*COMPROVANTE DE ATENDIMENTO & PAGAMENTO*
Comanda #${tab.id.slice(-6)} · Data: ${new Date(tab.closed_at || tab.created_at).toLocaleString('pt-BR')}
Cliente: ${tab.client_name}
Operador: ${tab.cashier_name}
----------------------------------------
*ITENS:*
${itemsLines}
----------------------------------------
Subtotal: ${formatCurrency(tab.subtotal_cents)}
${tab.discount_cents > 0 ? `Desconto: -${formatCurrency(tab.discount_cents)}\n` : ''}${tab.tip_cents > 0 ? `Gorjeta: +${formatCurrency(tab.tip_cents)}\n` : ''}*TOTAL PAGO: ${formatCurrency(tab.total_cents)}*
----------------------------------------
*FORMAS DE PAGAMENTO:*
${paymentLines}
----------------------------------------
Agradecemos sua visita ao Naturo SPA! ✨
`.trim();

    return {
      text,
      pixPayload: `00020126580014br.gov.bcb.pix0136naturospa@pix.com.br520400005303986540${tab.total_cents / 100}5802BR5925NATURO SPA CURITIBA6008CURITIBA62070503***6304E8A2`,
    };
  }
}

export const posEngine = new PosEngineStore();
