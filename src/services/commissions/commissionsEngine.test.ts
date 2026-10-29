import { describe, it, expect } from 'vitest';
import { commissionsEngine } from './commissionsEngine';

describe('CommissionsEngine', () => {
  it('calculates payroll summaries correctly with deductions', () => {
    const summaries = commissionsEngine.calculatePayrollSummaries('comp_naturo_spa_01');
    expect(summaries.length).toBeGreaterThan(0);

    const first = summaries[0];
    expect(first.professional_name).toBeDefined();
    expect(first.gross_commission_cents).toBeGreaterThanOrEqual(first.net_payable_cents);
  });

  it('records cash advances and marks payroll as paid', () => {
    const adv = commissionsEngine.addAdvance({
      company_id: 'comp_naturo_spa_01',
      professional_id: 'prof_camila_01',
      amount_cents: 5000,
      date: '2026-10-19',
      reason: 'Adiantamento transporte',
      status: 'pending_deduction',
    });

    expect(adv.id).toBeDefined();
    expect(adv.status).toBe('pending_deduction');

    commissionsEngine.markPayrollAsPaid('comp_naturo_spa_01', 'prof_camila_01');
    const updatedAdv = commissionsEngine.getAdvances('comp_naturo_spa_01', 'prof_camila_01').find(a => a.id === adv.id);
    expect(updatedAdv?.status).toBe('deducted');
  });
});
