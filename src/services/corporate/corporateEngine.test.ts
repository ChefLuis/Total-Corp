import { describe, it, expect } from 'vitest';
import { corporateEngine } from './corporateEngine';

describe('CorporateEngine', () => {
  it('loads partner companies with agreement settings', () => {
    const partners = corporateEngine.getPartners('comp_naturo_spa_01');
    expect(partners.length).toBeGreaterThan(0);
    expect(partners.some(p => p.trade_name.includes('NH Curitiba'))).toBe(true);
  });

  it('adds a new beneficiary to an existing partner', () => {
    const ben = corporateEngine.addBeneficiary({
      partner_id: 'partner_the_five_condo',
      name: 'Morador Teste Apto 1104',
      identifier: 'Apto 1104',
      email: 'morador1104@thefive.com',
      phone: '(41) 98888-7777',
      active: true,
    });

    expect(ben.id).toBeDefined();
    const list = corporateEngine.getBeneficiaries('partner_the_five_condo');
    expect(list.some(b => b.name === 'Morador Teste Apto 1104')).toBe(true);
  });

  it('marks a corporate monthly invoice as paid', () => {
    const invoices = corporateEngine.getInvoices();
    const inv = invoices[0];
    expect(inv).toBeDefined();

    const success = corporateEngine.markInvoiceAsPaid(inv.id);
    expect(success).toBe(true);
    expect(inv.status).toBe('paid');
  });
});
