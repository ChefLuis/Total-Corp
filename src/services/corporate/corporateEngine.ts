import { PartnerCompany, CorporateBeneficiary, CorporateUsage, CorporateInvoice } from './types';

export const INITIAL_PARTNER_COMPANIES: PartnerCompany[] = [
  {
    id: 'partner_nh_hotel',
    company_id: 'comp_naturo_spa_01',
    name: 'Hotel NH Curitiba The Five Hotéis S.A.',
    trade_name: 'NH Curitiba The Five',
    cnpj: '24.819.018/0001-44',
    contact_person: 'Mariana Zandoná (Gerência Geral)',
    contact_email: 'gerencia.nhcuritiba@nh-hotels.com',
    contact_phone: '(41) 3434-9400',
    agreement_type: 'full_monthly_invoice',
    subsidy_percentage: 100,
    active: true,
  },
  {
    id: 'partner_the_five_condo',
    company_id: 'comp_naturo_spa_01',
    name: 'Condomínio Edifício The Five Batel Residencial',
    trade_name: 'Condomínio The Five',
    cnpj: '29.384.192/0001-10',
    contact_person: 'Síndico Profissional / Concierge',
    contact_email: 'concierge@thefivecuritiba.com.br',
    contact_phone: '(41) 3018-0000',
    agreement_type: 'subsidy_percentage',
    subsidy_percentage: 30, // Condomínio subsidia 30% como benefício de bem-estar
    active: true,
  },
  {
    id: 'partner_vanguarda_tech',
    company_id: 'comp_naturo_spa_01',
    name: 'Vanguarda Tecnologia & Softwares Ltda',
    trade_name: 'Vanguarda Tech',
    cnpj: '31.902.418/0001-90',
    contact_person: 'Lucas Silveira (Head de People & Culture)',
    contact_email: 'rh@vanguardatech.com.br',
    contact_phone: '(41) 98822-1029',
    agreement_type: 'subsidy_percentage',
    subsidy_percentage: 50,
    monthly_cap_per_employee_cents: 30000, // Limite de R$ 300/mês por dev
    active: true,
  },
];

export const INITIAL_BENEFICIARIES: CorporateBeneficiary[] = [
  {
    id: 'ben_001',
    partner_id: 'partner_nh_hotel',
    name: 'Dr. Arthur Prado',
    identifier: 'Quarto 1402 (Hóspede Suíte Executiva)',
    email: 'arthur.prado@advocacia.com.br',
    phone: '(11) 99881-2200',
    active: true,
  },
  {
    id: 'ben_002',
    partner_id: 'partner_the_five_condo',
    name: 'Helena Ribeiro',
    identifier: 'Apto 804 - Torre Residencial',
    email: 'helena.ribeiro@email.com',
    phone: '(41) 99123-4567',
    active: true,
  },
  {
    id: 'ben_003',
    partner_id: 'partner_vanguarda_tech',
    name: 'Gabriel Costa',
    identifier: 'Matrícula VT-482 (Engenheiro de Software)',
    email: 'gabriel.costa@vanguardatech.com.br',
    phone: '(41) 98877-6655',
    active: true,
  },
];

export const INITIAL_CORPORATE_USAGES: CorporateUsage[] = [
  {
    id: 'use_001',
    partner_id: 'partner_nh_hotel',
    partner_name: 'NH Curitiba The Five',
    beneficiary_name: 'Dr. Arthur Prado (Quarto 1402)',
    service_name: 'Massagem Relaxante com Aromaterapia (60min)',
    date: '2026-10-18',
    total_value_cents: 22000,
    subsidy_cents: 22000,
    copay_cents: 0,
  },
  {
    id: 'use_002',
    partner_id: 'partner_the_five_condo',
    partner_name: 'Condomínio The Five',
    beneficiary_name: 'Helena Ribeiro (Apto 804)',
    service_name: 'Ritual Florescer Day Spa (120min)',
    date: '2026-10-17',
    total_value_cents: 38000,
    subsidy_cents: 11400, // 30% do condomínio
    copay_cents: 26600, // 70% pago pela moradora
  },
  {
    id: 'use_003',
    partner_id: 'partner_vanguarda_tech',
    partner_name: 'Vanguarda Tech',
    beneficiary_name: 'Gabriel Costa (VT-482)',
    service_name: 'Quick Massage Antiestresse (30min)',
    date: '2026-10-16',
    total_value_cents: 12000,
    subsidy_cents: 6000, // 50%
    copay_cents: 6000, // 50%
  },
];

export const INITIAL_CORPORATE_INVOICES: CorporateInvoice[] = [
  {
    id: 'inv_corp_1026_01',
    partner_id: 'partner_nh_hotel',
    partner_name: 'Hotel NH Curitiba The Five',
    month_reference: '10/2026',
    total_cents: 420000, // R$ 4.200,00
    usages_count: 19,
    status: 'invoiced',
    due_date: '2026-10-25',
    boleto_barcode: '34191.79001 01043.510047 91020.150008 3 9820000420000',
  },
  {
    id: 'inv_corp_1026_02',
    partner_id: 'partner_vanguarda_tech',
    partner_name: 'Vanguarda Tech',
    month_reference: '10/2026',
    total_cents: 185000, // R$ 1.850,00
    usages_count: 14,
    status: 'open',
    due_date: '2026-10-30',
  },
];

class CorporateEngine {
  private partners: PartnerCompany[] = [...INITIAL_PARTNER_COMPANIES];
  private beneficiaries: CorporateBeneficiary[] = [...INITIAL_BENEFICIARIES];
  private usages: CorporateUsage[] = [...INITIAL_CORPORATE_USAGES];
  private invoices: CorporateInvoice[] = [...INITIAL_CORPORATE_INVOICES];

  public getPartners(companyId: string): PartnerCompany[] {
    return this.partners.filter(p => p.company_id === companyId);
  }

  public getBeneficiaries(partnerId?: string): CorporateBeneficiary[] {
    if (partnerId && partnerId !== 'all') {
      return this.beneficiaries.filter(b => b.partner_id === partnerId);
    }
    return this.beneficiaries;
  }

  public getUsages(partnerId?: string): CorporateUsage[] {
    if (partnerId && partnerId !== 'all') {
      return this.usages.filter(u => u.partner_id === partnerId);
    }
    return this.usages;
  }

  public getInvoices(partnerId?: string): CorporateInvoice[] {
    if (partnerId && partnerId !== 'all') {
      return this.invoices.filter(i => i.partner_id === partnerId);
    }
    return this.invoices;
  }

  public addPartner(partner: Omit<PartnerCompany, 'id'>): PartnerCompany {
    const newPartner: PartnerCompany = {
      ...partner,
      id: `partner_${Date.now()}`,
    };
    this.partners.push(newPartner);
    return newPartner;
  }

  public addBeneficiary(ben: Omit<CorporateBeneficiary, 'id'>): CorporateBeneficiary {
    const newBen: CorporateBeneficiary = {
      ...ben,
      id: `ben_${Date.now()}`,
    };
    this.beneficiaries.push(newBen);
    return newBen;
  }

  public markInvoiceAsPaid(invoiceId: string): boolean {
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (!inv) return false;
    inv.status = 'paid';
    return true;
  }
}

export const corporateEngine = new CorporateEngine();
