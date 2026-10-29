export type CorporateAgreementType =
  | 'subsidy_percentage' // Empresa paga X%, colaborador paga o restante
  | 'full_monthly_invoice' // 100% faturado contra o CNPJ da empresa no final do mês
  | 'exclusive_discount'; // Colaborador tem desconto garantido e paga 100%

export interface PartnerCompany {
  id: string;
  company_id: string;
  name: string;
  trade_name: string;
  cnpj: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  agreement_type: CorporateAgreementType;
  subsidy_percentage?: number; // e.g. 50%
  discount_percentage?: number; // e.g. 20%
  monthly_cap_per_employee_cents?: number;
  active: boolean;
}

export interface CorporateBeneficiary {
  id: string;
  partner_id: string;
  name: string;
  identifier: string; // Matrícula, Quarto Hotel NH ou CPF
  email: string;
  phone: string;
  active: boolean;
}

export interface CorporateUsage {
  id: string;
  partner_id: string;
  partner_name: string;
  beneficiary_name: string;
  service_name: string;
  date: string;
  total_value_cents: number;
  subsidy_cents: number;
  copay_cents: number;
}

export interface CorporateInvoice {
  id: string;
  partner_id: string;
  partner_name: string;
  month_reference: string; // "10/2026"
  total_cents: number;
  usages_count: number;
  status: 'open' | 'invoiced' | 'paid';
  due_date: string;
  boleto_barcode?: string;
}
