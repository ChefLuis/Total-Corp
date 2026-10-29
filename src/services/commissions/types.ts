export interface CommissionRule {
  professional_id: string;
  service_percentage: number; // e.g. 45%
  product_percentage: number; // e.g. 10%
  deduct_card_fee: boolean; // deduct 2.4% card machine fee
  deduct_supply_kit: boolean; // deduct kit cost if applicable
}

export interface CommissionEntry {
  id: string;
  company_id: string;
  professional_id: string;
  client_name: string;
  service_name: string;
  service_value_cents: number;
  gross_commission_cents: number;
  card_fee_deduction_cents: number;
  supply_kit_deduction_cents: number;
  net_commission_cents: number;
  date: string;
  tab_id?: string;
  status: 'pending' | 'closed' | 'paid';
}

export interface CashAdvance {
  id: string;
  company_id: string;
  professional_id: string;
  amount_cents: number;
  date: string;
  reason: string;
  status: 'pending_deduction' | 'deducted';
}

export interface PayrollPeriodSummary {
  professional_id: string;
  professional_name: string;
  role_title: string;
  pix_key: string;
  total_attendances: number;
  gross_revenue_generated_cents: number;
  gross_commission_cents: number;
  total_deductions_cents: number;
  advances_deducted_cents: number;
  net_payable_cents: number;
  status: 'open' | 'closed' | 'paid';
}
