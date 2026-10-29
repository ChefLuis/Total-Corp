export type TransactionType = 'revenue' | 'expense';

export type FinancialCategory =
  | 'services_revenue'
  | 'products_revenue'
  | 'subscriptions_revenue'
  | 'rent_condo'
  | 'supplies_cost'
  | 'commissions_payout'
  | 'card_fees'
  | 'marketing_ads'
  | 'utilities'
  | 'software_systems'
  | 'taxes'
  | 'other';

export type FinancialStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface FinancialEntry {
  id: string;
  company_id: string;
  unit_id?: string;
  type: TransactionType;
  category: FinancialCategory;
  description: string;
  amount_cents: number;
  due_date: string; // YYYY-MM-DD
  payment_date?: string; // YYYY-MM-DD
  status: FinancialStatus;
  entity_name: string; // Fornecedor ou Cliente
  document_number?: string; // NF ou recibo
  payment_method?: 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'boleto' | 'cash';
  bank_account_id?: string;
}

export interface BankAccount {
  id: string;
  company_id: string;
  bank_name: string;
  agency: string;
  account_number: string;
  pix_key: string;
  balance_cents: number;
}

export interface DREStatement {
  period: string; // "Outubro / 2026"
  gross_revenue_services_cents: number;
  gross_revenue_products_cents: number;
  gross_revenue_subscriptions_cents: number;
  total_gross_revenue_cents: number;
  card_fees_cents: number;
  taxes_cents: number;
  net_revenue_cents: number;
  commissions_cost_cents: number;
  supplies_cost_cents: number;
  contribution_margin_cents: number;
  fixed_expenses_cents: number;
  ebitda_cents: number;
  net_profit_cents: number;
}
