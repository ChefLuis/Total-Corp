import { FinancialEntry, BankAccount, DREStatement, FinancialCategory } from './types';

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank_itau_01',
    company_id: 'comp_naturo_spa_01',
    bank_name: 'Banco Itaú Empresas',
    agency: '0341',
    account_number: '28491-0',
    pix_key: 'financeiro@naturospa.com.br',
    balance_cents: 3450000, // R$ 34.500,00
  },
  {
    id: 'bank_inter_02',
    company_id: 'comp_naturo_spa_01',
    bank_name: 'Banco Inter PJ',
    agency: '0001',
    account_number: '1092837-4',
    pix_key: '14.289.401/0001-92',
    balance_cents: 1280000, // R$ 12.800,00
  },
];

export const INITIAL_FINANCIAL_ENTRIES: FinancialEntry[] = [
  // Receitas Realizadas de Serviços (fechamento de comandas)
  {
    id: 'fin_rec_001',
    company_id: 'comp_naturo_spa_01',
    unit_id: 'unit_the_five_01',
    type: 'revenue',
    category: 'services_revenue',
    description: 'Comandas Fechadas - Dia 19/10/2026',
    amount_cents: 384000,
    due_date: '2026-10-19',
    payment_date: '2026-10-19',
    status: 'paid',
    entity_name: 'Clientes do Dia (Comandas)',
    document_number: 'LOT-1910',
    payment_method: 'pix',
    bank_account_id: 'bank_itau_01',
  },
  {
    id: 'fin_rec_002',
    company_id: 'comp_naturo_spa_01',
    unit_id: 'unit_the_five_01',
    type: 'revenue',
    category: 'products_revenue',
    description: 'Venda de Óleo de Lavanda e Home Spray',
    amount_cents: 29000,
    due_date: '2026-10-18',
    payment_date: '2026-10-18',
    status: 'paid',
    entity_name: 'Helena Ribeiro',
    document_number: 'NFCe-1082',
    payment_method: 'credit_card',
    bank_account_id: 'bank_itau_01',
  },
  {
    id: 'fin_rec_003',
    company_id: 'comp_naturo_spa_01',
    unit_id: 'unit_the_five_01',
    type: 'revenue',
    category: 'subscriptions_revenue',
    description: 'Mensalidade Clube Spa Relax (Outubro)',
    amount_cents: 19900,
    due_date: '2026-10-20',
    payment_date: '2026-10-20',
    status: 'paid',
    entity_name: 'Mariana Duarte',
    document_number: 'FAT-CLUBE-091',
    payment_method: 'credit_card',
    bank_account_id: 'bank_itau_01',
  },
  {
    id: 'fin_rec_004',
    company_id: 'comp_naturo_spa_01',
    unit_id: 'unit_the_five_01',
    type: 'revenue',
    category: 'services_revenue',
    description: 'Fatura Corporativa Mensal - NH Curitiba The Five',
    amount_cents: 420000,
    due_date: '2026-10-25',
    status: 'pending',
    entity_name: 'Hotel NH Curitiba The Five',
    document_number: 'FAT-CORP-1026',
    payment_method: 'boleto',
  },

  // Despesas & Custos (Contas a Pagar)
  {
    id: 'fin_desp_001',
    company_id: 'comp_naturo_spa_01',
    unit_id: 'unit_the_five_01',
    type: 'expense',
    category: 'rent_condo',
    description: 'Aluguel & Condomínio Sala 201 - Complexo The Five',
    amount_cents: 520000,
    due_date: '2026-10-20',
    payment_date: '2026-10-19',
    status: 'paid',
    entity_name: 'Administradora The Five Batel',
    document_number: 'BOLETO-83921',
    payment_method: 'bank_transfer',
    bank_account_id: 'bank_itau_01',
  },
  {
    id: 'fin_desp_002',
    company_id: 'comp_naturo_spa_01',
    unit_id: 'unit_the_five_01',
    type: 'expense',
    category: 'supplies_cost',
    description: 'Óleos Essenciais e Lençóis Descartáveis',
    amount_cents: 85000,
    due_date: '2026-10-22',
    status: 'pending',
    entity_name: 'BioAroma Cosméticos Naturais Ltda',
    document_number: 'NF-34901',
    payment_method: 'boleto',
  },
  {
    id: 'fin_desp_003',
    company_id: 'comp_naturo_spa_01',
    unit_id: 'unit_the_five_01',
    type: 'expense',
    category: 'commissions_payout',
    description: 'Repasse Quinzenal Comissões - Equipe Terapeutas',
    amount_cents: 680000,
    due_date: '2026-10-20',
    payment_date: '2026-10-20',
    status: 'paid',
    entity_name: 'Folha de Repasse Terapeutas (Naturo)',
    document_number: 'REP-1026-1',
    payment_method: 'pix',
    bank_account_id: 'bank_itau_01',
  },
  {
    id: 'fin_desp_004',
    company_id: 'comp_naturo_spa_01',
    unit_id: 'unit_the_five_01',
    type: 'expense',
    category: 'software_systems',
    description: 'Assinatura Plataforma Total Corp Pro',
    amount_cents: 24900,
    due_date: '2026-10-28',
    status: 'pending',
    entity_name: 'Total Corp SaaS Tecnologia',
    document_number: 'NFSe-8819',
    payment_method: 'credit_card',
  },
  {
    id: 'fin_desp_005',
    company_id: 'comp_naturo_spa_01',
    unit_id: 'unit_the_five_01',
    type: 'expense',
    category: 'utilities',
    description: 'Energia Elétrica Copel - The Five',
    amount_cents: 48000,
    due_date: '2026-10-15',
    payment_date: '2026-10-14',
    status: 'paid',
    entity_name: 'Copel Distribuição S.A.',
    document_number: 'CONTA-78190',
    payment_method: 'pix',
    bank_account_id: 'bank_inter_02',
  },
  {
    id: 'fin_desp_006',
    company_id: 'comp_naturo_spa_01',
    unit_id: 'unit_the_five_01',
    type: 'expense',
    category: 'marketing_ads',
    description: 'Anúncios Google Ads & Instagram (Curitiba Batel)',
    amount_cents: 65000,
    due_date: '2026-10-25',
    status: 'pending',
    entity_name: 'Meta / Google Ads',
    document_number: 'INV-OCT-26',
    payment_method: 'credit_card',
  },
];

class FinancialEngine {
  private entries: FinancialEntry[] = [...INITIAL_FINANCIAL_ENTRIES];
  private bankAccounts: BankAccount[] = [...INITIAL_BANK_ACCOUNTS];

  public getEntries(companyId: string, filter?: { type?: 'revenue' | 'expense'; status?: string }): FinancialEntry[] {
    return this.entries.filter(e => {
      if (e.company_id !== companyId) return false;
      if (filter?.type && e.type !== filter.type) return false;
      if (filter?.status && filter.status !== 'all' && e.status !== filter.status) return false;
      return true;
    });
  }

  public addEntry(entry: Omit<FinancialEntry, 'id'>): FinancialEntry {
    const newEntry: FinancialEntry = {
      ...entry,
      id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.entries.unshift(newEntry);

    // If paid directly with bank account, adjust balance
    if (newEntry.status === 'paid' && newEntry.bank_account_id) {
      const account = this.bankAccounts.find(a => a.id === newEntry.bank_account_id);
      if (account) {
        if (newEntry.type === 'revenue') {
          account.balance_cents += newEntry.amount_cents;
        } else {
          account.balance_cents -= newEntry.amount_cents;
        }
      }
    }

    return newEntry;
  }

  public markAsPaid(entryId: string, paymentMethod: FinancialEntry['payment_method'] = 'pix', bankAccountId?: string): boolean {
    const entry = this.entries.find(e => e.id === entryId);
    if (!entry) return false;

    entry.status = 'paid';
    entry.payment_date = new Date().toISOString().split('T')[0];
    entry.payment_method = paymentMethod;
    if (bankAccountId) {
      entry.bank_account_id = bankAccountId;
      const account = this.bankAccounts.find(a => a.id === bankAccountId);
      if (account) {
        if (entry.type === 'revenue') {
          account.balance_cents += entry.amount_cents;
        } else {
          account.balance_cents -= entry.amount_cents;
        }
      }
    }
    return true;
  }

  public getBankAccounts(companyId: string): BankAccount[] {
    return this.bankAccounts.filter(a => a.company_id === companyId);
  }

  public calculateDRE(companyId: string, period = 'Outubro / 2026'): DREStatement {
    const entries = this.entries.filter(e => e.company_id === companyId && e.status === 'paid');

    const revServices = entries
      .filter(e => e.category === 'services_revenue')
      .reduce((sum, e) => sum + e.amount_cents, 0);

    const revProducts = entries
      .filter(e => e.category === 'products_revenue')
      .reduce((sum, e) => sum + e.amount_cents, 0);

    const revSubs = entries
      .filter(e => e.category === 'subscriptions_revenue')
      .reduce((sum, e) => sum + e.amount_cents, 0);

    const totalGross = revServices + revProducts + revSubs;

    // Card fees estimate (~2.5% of card transactions)
    const cardFees = Math.round(totalGross * 0.024);
    // Simples Nacional taxes (~6%)
    const taxes = Math.round(totalGross * 0.06);
    const netRevenue = totalGross - cardFees - taxes;

    const commCost = entries
      .filter(e => e.category === 'commissions_payout')
      .reduce((sum, e) => sum + e.amount_cents, 0);

    const supCost = entries
      .filter(e => e.category === 'supplies_cost')
      .reduce((sum, e) => sum + e.amount_cents, 0);

    const contributionMargin = netRevenue - commCost - supCost;

    const fixedExpenses = entries
      .filter(e => ['rent_condo', 'utilities', 'software_systems', 'marketing_ads', 'other'].includes(e.category))
      .reduce((sum, e) => sum + e.amount_cents, 0);

    const ebitda = contributionMargin - fixedExpenses;
    const netProfit = ebitda;

    return {
      period,
      gross_revenue_services_cents: revServices,
      gross_revenue_products_cents: revProducts,
      gross_revenue_subscriptions_cents: revSubs,
      total_gross_revenue_cents: totalGross,
      card_fees_cents: cardFees,
      taxes_cents: taxes,
      net_revenue_cents: netRevenue,
      commissions_cost_cents: commCost,
      supplies_cost_cents: supCost,
      contribution_margin_cents: contributionMargin,
      fixed_expenses_cents: fixedExpenses,
      ebitda_cents: ebitda,
      net_profit_cents: netProfit,
    };
  }

  public generatePixPaymentString(amountCents: number, description: string, key = 'financeiro@naturospa.com.br'): {
    qrPayload: string;
    pixCode: string;
  } {
    const valor = (amountCents / 100).toFixed(2);
    // Standard Pix EMV payload simulation
    const pixCode = `00020126580014br.gov.bcb.pix0136${key}520400005303986540${valor.length}${valor}5802BR5916NATURO SPA CURIT6008CURITIBA62070503***6304ABCD`;
    return {
      qrPayload: pixCode,
      pixCode: pixCode,
    };
  }
}

export const financialEngine = new FinancialEngine();
