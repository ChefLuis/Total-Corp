import { describe, it, expect, beforeEach } from 'vitest';
import { posEngine } from './posEngine';

describe('POS & Cash Drawer Rules (Fase 4)', () => {
  const companyId = 'comp_naturo_spa_01';
  const unitId = 'unit_the_five_01';

  it('1. Deve abrir comanda, adicionar itens e fechar com pagamento misto (Pix + Cartão)', () => {
    // Abrir comanda
    const tab = posEngine.openTab({
      company_id: companyId,
      unit_id: unitId,
      client_id: 'cli_marcelo_02',
      client_name: 'Dr. Marcelo Paiva',
      client_phone: '(41) 98222-3344',
      cashier_id: 'usr_recep_01',
      cashier_name: 'Mariana Duarte',
      initial_items: [
        {
          id: 'item_tst_01',
          type: 'service',
          item_id: 'srv_terapeutica_03',
          name: 'Massagem Terapêutica Descompressiva',
          professional_id: 'prof_lucas_02',
          quantity: 1,
          unit_price_cents: 32000,
          discount_cents: 0,
          total_cents: 32000,
        },
      ],
    });

    expect(tab.total_cents).toBe(32000); // R$ 320,00

    // Fechar com pagamento misto: R$ 200,00 no Pix + R$ 120,00 no Cartão de Crédito
    const closeResult = posEngine.closeTab({
      tab_id: tab.id,
      cashier_name: 'Mariana Duarte',
      payments: [
        { method: 'pix', amount_cents: 20000 },
        { method: 'credit_card', amount_cents: 12000, installments: 1 },
      ],
    });

    expect(closeResult.success).toBe(true);
    expect(closeResult.tab?.status).toBe('closed');
    expect(closeResult.tab?.paid_cents).toBe(32000);
    expect(closeResult.tab?.payments.length).toBe(2);
  });

  it('2. Pagamento em dinheiro deve calcular o troco com exatidão', () => {
    const tab = posEngine.openTab({
      company_id: companyId,
      unit_id: unitId,
      client_id: 'cli_fernanda_03',
      client_name: 'Fernanda Costa',
      client_phone: '(41) 97444-8899',
      cashier_id: 'usr_recep_01',
      cashier_name: 'Mariana Duarte',
      initial_items: [
        {
          id: 'item_tst_02',
          type: 'service',
          item_id: 'srv_craniofacial_10',
          name: 'Craniofacial & Reflexologia Podal',
          professional_id: 'prof_camila_03',
          quantity: 1,
          unit_price_cents: 24000, // R$ 240,00
          discount_cents: 0,
          total_cents: 24000,
        },
      ],
    });

    // Cliente entregou R$ 250,00 (2 notas de 100 + 1 de 50)
    const closeResult = posEngine.closeTab({
      tab_id: tab.id,
      cashier_name: 'Mariana Duarte',
      payments: [
        {
          method: 'cash',
          amount_cents: 24000,
          received_cents: 25000,
        },
      ],
    });

    expect(closeResult.success).toBe(true);
    expect(closeResult.tab?.payments[0].change_cents).toBe(1000); // R$ 10,00 de troco
  });

  it('3. Gestão de Caixa: Fundo + Suprimento - Sangria = Saldo Calculado', () => {
    const regResult = posEngine.openCashRegister({
      company_id: 'comp_test_box',
      unit_id: 'unit_test_box',
      opened_by: 'Operador Caixa',
      opening_balance_cents: 20000, // R$ 200,00 fundo
    });

    expect(regResult.success).toBe(true);
    const regId = regResult.register!.id;

    // Registrar Suprimento de R$ 50,00
    posEngine.recordCashMovement({
      cash_register_id: regId,
      type: 'supply',
      amount_cents: 5000,
      reason: 'Troco adicional em moedas',
      created_by: 'Operador',
    });

    // Registrar Sangria de R$ 80,00
    posEngine.recordCashMovement({
      cash_register_id: regId,
      type: 'bleed',
      amount_cents: 8000,
      reason: 'Recolhimento para o cofre',
      created_by: 'Gerente',
    });

    // Fechar caixa conferindo saldo contado de R$ 170,00
    const closeResult = posEngine.closeCashRegister({
      cash_register_id: regId,
      counted_cash_cents: 17000,
      closed_by: 'Operador',
    });

    expect(closeResult.success).toBe(true);
    expect(closeResult.register?.calculated_balance_cents).toBe(17000); // 200 + 50 - 80 = 170
    expect(closeResult.register?.difference_cents).toBe(0); // Sem quebra de caixa
  });

  it('4. Deve impedir fechar uma comanda que já está encerrada (Idempotência)', () => {
    const tab = posEngine.openTab({
      company_id: companyId,
      unit_id: unitId,
      client_id: 'cli_marcelo_02',
      client_name: 'Dr. Marcelo Paiva',
      client_phone: '(41) 98222-3344',
      cashier_id: 'usr_recep_01',
      cashier_name: 'Mariana Duarte',
      initial_items: [
        {
          id: 'item_03',
          type: 'service',
          item_id: 'srv_relaxante_02',
          name: 'Massagem Relaxante',
          professional_id: 'prof_beatriz_01',
          quantity: 1,
          unit_price_cents: 27000,
          discount_cents: 0,
          total_cents: 27000,
        },
      ],
    });

    // Fechar a primeira vez
    posEngine.closeTab({
      tab_id: tab.id,
      cashier_name: 'Mariana Duarte',
      payments: [{ method: 'pix', amount_cents: 27000 }],
    });

    // Tentar fechar novamente DEVE FALHAR
    const secondClose = posEngine.closeTab({
      tab_id: tab.id,
      cashier_name: 'Mariana Duarte',
      payments: [{ method: 'pix', amount_cents: 27000 }],
    });

    expect(secondClose.success).toBe(false);
    expect(secondClose.error).toContain('já foi encerrada');
  });
});
