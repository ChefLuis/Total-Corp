import { CommissionRule, CommissionEntry, CashAdvance, PayrollPeriodSummary } from './types';
import { INITIAL_PROFESSIONALS } from '../mockData';

export const INITIAL_COMMISSION_RULES: CommissionRule[] = [
  {
    professional_id: 'prof_camila_01',
    service_percentage: 45,
    product_percentage: 10,
    deduct_card_fee: true,
    deduct_supply_kit: true,
  },
  {
    professional_id: 'prof_juliana_02',
    service_percentage: 50,
    product_percentage: 10,
    deduct_card_fee: true,
    deduct_supply_kit: false,
  },
  {
    professional_id: 'prof_roberto_03',
    service_percentage: 40,
    product_percentage: 10,
    deduct_card_fee: false,
    deduct_supply_kit: true,
  },
];

export const INITIAL_COMMISSION_ENTRIES: CommissionEntry[] = [
  {
    id: 'comm_001',
    company_id: 'comp_naturo_spa_01',
    professional_id: 'prof_camila_01',
    client_name: 'Helena Ribeiro',
    service_name: 'Massagem Relaxante com Aromaterapia',
    service_value_cents: 22000,
    gross_commission_cents: 9900, // 45% de 220,00
    card_fee_deduction_cents: 240, // 2.4% sobre comissão
    supply_kit_deduction_cents: 1500, // Kit aromaterapia
    net_commission_cents: 8160, // R$ 81,60
    date: '2026-10-19',
    status: 'closed',
  },
  {
    id: 'comm_002',
    company_id: 'comp_naturo_spa_01',
    professional_id: 'prof_camila_01',
    client_name: 'Carlos Mendes',
    service_name: 'Ritual Florescer (120 min)',
    service_value_cents: 38000,
    gross_commission_cents: 17100, // 45% de 380,00
    card_fee_deduction_cents: 410,
    supply_kit_deduction_cents: 2500, // Kit argila e pedras
    net_commission_cents: 14190, // R$ 141,90
    date: '2026-10-18',
    status: 'closed',
  },
  {
    id: 'comm_003',
    company_id: 'comp_naturo_spa_01',
    professional_id: 'prof_juliana_02',
    client_name: 'Fernanda Lima',
    service_name: 'Drenagem Linfática Método Renata França',
    service_value_cents: 26000,
    gross_commission_cents: 13000, // 50% de 260,00
    card_fee_deduction_cents: 310,
    supply_kit_deduction_cents: 0,
    net_commission_cents: 12690, // R$ 126,90
    date: '2026-10-19',
    status: 'closed',
  },
  {
    id: 'comm_004',
    company_id: 'comp_naturo_spa_01',
    professional_id: 'prof_juliana_02',
    client_name: 'Julio Cesar',
    service_name: 'Massagem Desportiva Deep Tissue',
    service_value_cents: 24000,
    gross_commission_cents: 12000, // 50% de 240,00
    card_fee_deduction_cents: 290,
    supply_kit_deduction_cents: 0,
    net_commission_cents: 11710, // R$ 117,10
    date: '2026-10-17',
    status: 'closed',
  },
  {
    id: 'comm_005',
    company_id: 'comp_naturo_spa_01',
    professional_id: 'prof_roberto_03',
    client_name: 'Marcos Vinicius',
    service_name: 'Shiatsu Tradicional Japonês',
    service_value_cents: 21000,
    gross_commission_cents: 8400, // 40% de 210,00
    card_fee_deduction_cents: 0,
    supply_kit_deduction_cents: 1000,
    net_commission_cents: 7400, // R$ 74,00
    date: '2026-10-18',
    status: 'closed',
  },
];

export const INITIAL_ADVANCES: CashAdvance[] = [
  {
    id: 'adv_001',
    company_id: 'comp_naturo_spa_01',
    professional_id: 'prof_camila_01',
    amount_cents: 20000, // R$ 200,00 adiantamento
    date: '2026-10-10',
    reason: 'Adiantamento emergencial de combustível',
    status: 'deducted',
  },
];

class CommissionsEngine {
  private rules: CommissionRule[] = [...INITIAL_COMMISSION_RULES];
  private entries: CommissionEntry[] = [...INITIAL_COMMISSION_ENTRIES];
  private advances: CashAdvance[] = [...INITIAL_ADVANCES];

  public getRules(companyId: string): CommissionRule[] {
    return this.rules;
  }

  public getEntries(companyId: string, profId?: string): CommissionEntry[] {
    return this.entries.filter(e => {
      if (e.company_id !== companyId) return false;
      if (profId && profId !== 'all' && e.professional_id !== profId) return false;
      return true;
    });
  }

  public getAdvances(companyId: string, profId?: string): CashAdvance[] {
    return this.advances.filter(a => {
      if (a.company_id !== companyId) return false;
      if (profId && profId !== 'all' && a.professional_id !== profId) return false;
      return true;
    });
  }

  public addAdvance(advance: Omit<CashAdvance, 'id'>): CashAdvance {
    const newAdv: CashAdvance = {
      ...advance,
      id: `adv_${Date.now()}`,
    };
    this.advances.unshift(newAdv);
    return newAdv;
  }

  public updateRule(profId: string, ruleData: Partial<CommissionRule>): void {
    const idx = this.rules.findIndex(r => r.professional_id === profId);
    if (idx >= 0) {
      this.rules[idx] = { ...this.rules[idx], ...ruleData };
    } else {
      this.rules.push({
        professional_id: profId,
        service_percentage: ruleData.service_percentage || 40,
        product_percentage: ruleData.product_percentage || 10,
        deduct_card_fee: !!ruleData.deduct_card_fee,
        deduct_supply_kit: !!ruleData.deduct_supply_kit,
      });
    }
  }

  public calculatePayrollSummaries(companyId: string): PayrollPeriodSummary[] {
    const profs = INITIAL_PROFESSIONALS.filter(p => p.company_id === companyId);

    return profs.map(prof => {
      const profEntries = this.entries.filter(e => e.company_id === companyId && e.professional_id === prof.id);
      const profAdvances = this.advances.filter(a => a.company_id === companyId && a.professional_id === prof.id && a.status === 'pending_deduction');

      const totalAttendances = profEntries.length;
      const grossRev = profEntries.reduce((sum, e) => sum + e.service_value_cents, 0);
      const grossComm = profEntries.reduce((sum, e) => sum + e.gross_commission_cents, 0);
      const totalDeductions = profEntries.reduce((sum, e) => sum + e.card_fee_deduction_cents + e.supply_kit_deduction_cents, 0);
      const advancesSum = profAdvances.reduce((sum, a) => sum + a.amount_cents, 0);
      const netPayable = Math.max(0, grossComm - totalDeductions - advancesSum);

      return {
        professional_id: prof.id,
        professional_name: prof.name,
        role_title: prof.role_title || 'Terapeuta Corporal',
        pix_key: prof.pix_key || `${prof.id}@pix.naturospa.com.br`,
        total_attendances: totalAttendances,
        gross_revenue_generated_cents: grossRev,
        gross_commission_cents: grossComm,
        total_deductions_cents: totalDeductions,
        advances_deducted_cents: advancesSum,
        net_payable_cents: netPayable,
        status: profEntries.every(e => e.status === 'paid') && totalAttendances > 0 ? 'paid' : 'open',
      };
    });
  }

  public markPayrollAsPaid(companyId: string, profId: string): boolean {
    this.entries
      .filter(e => e.company_id === companyId && e.professional_id === profId)
      .forEach(e => {
        e.status = 'paid';
      });

    this.advances
      .filter(a => a.company_id === companyId && a.professional_id === profId)
      .forEach(a => {
        a.status = 'deducted';
      });

    return true;
  }
}

export const commissionsEngine = new CommissionsEngine();
