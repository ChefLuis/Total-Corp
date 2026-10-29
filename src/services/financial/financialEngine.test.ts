import { describe, it, expect } from 'vitest';
import { financialEngine } from './financialEngine';

describe('FinancialEngine', () => {
  it('calculates DRE correctly for Naturo SPA', () => {
    const dre = financialEngine.calculateDRE('comp_naturo_spa_01');
    expect(dre.total_gross_revenue_cents).toBeGreaterThan(0);
    expect(dre.net_revenue_cents).toBeLessThan(dre.total_gross_revenue_cents);
    expect(dre.ebitda_cents).toBeDefined();
    expect(dre.contribution_margin_cents).toBeDefined();
  });

  it('adds a new expense entry and updates status', () => {
    const entry = financialEngine.addEntry({
      company_id: 'comp_naturo_spa_01',
      type: 'expense',
      category: 'supplies_cost',
      description: 'Compra de Toalhas de Rosto',
      amount_cents: 12000,
      due_date: '2026-10-30',
      status: 'pending',
      entity_name: 'Distribuidora Têxtil',
    });

    expect(entry.id).toBeDefined();
    expect(entry.status).toBe('pending');

    const paid = financialEngine.markAsPaid(entry.id, 'pix');
    expect(paid).toBe(true);

    const updated = financialEngine.getEntries('comp_naturo_spa_01').find(e => e.id === entry.id);
    expect(updated?.status).toBe('paid');
  });

  it('generates a valid Pix EMV payment string', () => {
    const pix = financialEngine.generatePixPaymentString(15000, 'Pagamento Teste');
    expect(pix.pixCode).toContain('000201');
    expect(pix.pixCode).toContain('financeiro@naturospa.com.br');
  });
});
