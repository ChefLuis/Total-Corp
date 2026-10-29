export type PaymentMethod =
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'cash'
  | 'client_credit'
  | 'package_session';

export type TabStatus = 'open' | 'closed' | 'canceled';

export interface TabItem {
  id: string;
  type: 'service' | 'product';
  item_id: string; // service_id or product_id
  name: string;
  professional_id: string; // Profissional que executou/vendeu (para comissão)
  quantity: number;
  unit_price_cents: number;
  discount_cents: number;
  total_cents: number;
}

export interface TabPayment {
  id: string;
  tab_id: string;
  method: PaymentMethod;
  amount_cents: number;
  installments?: number; // parcelas cartão
  received_cents?: number; // valor entregue pelo cliente (dinheiro)
  change_cents?: number;   // troco
  provider_tx_id?: string;
  status: 'pending' | 'completed' | 'refunded';
  created_at: string;
}

export interface Tab {
  id: string;
  company_id: string;
  unit_id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  appointment_id?: string;
  status: TabStatus;
  items: TabItem[];
  subtotal_cents: number;
  discount_cents: number;
  tip_cents: number;
  total_cents: number;
  paid_cents: number;
  payments: TabPayment[];
  notes?: string;
  cashier_id: string;
  cashier_name: string;
  created_at: string;
  closed_at?: string;
}

export type CashMovementType = 'opening' | 'supply' | 'bleed' | 'tab_payment' | 'closing';

export interface CashMovement {
  id: string;
  cash_register_id: string;
  company_id: string;
  unit_id: string;
  type: CashMovementType;
  amount_cents: number;
  method?: PaymentMethod;
  reason: string;
  created_by: string;
  created_at: string;
}

export interface CashRegister {
  id: string;
  company_id: string;
  unit_id: string;
  opened_by: string;
  opening_balance_cents: number; // Saldo inicial da gaveta
  closing_balance_cents?: number; // Saldo contado no fechamento
  calculated_balance_cents?: number; // Saldo esperado pelo sistema
  difference_cents?: number; // Diferença / quebra de caixa
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
}
