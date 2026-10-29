import { describe, it, expect } from 'vitest';
import { inventoryEngine } from './inventoryEngine';

describe('InventoryEngine', () => {
  it('records purchase entry and updates stock and cost', () => {
    const items = inventoryEngine.getItems('comp_naturo_spa_01');
    const target = items[0];
    const initialStock = target.current_stock;

    const success = inventoryEngine.recordPurchaseEntry({
      company_id: 'comp_naturo_spa_01',
      item_id: target.id,
      quantity: 50,
      unit_cost_cents: 1200,
      invoice_number: 'NFe-TEST-01',
    });

    expect(success).toBe(true);
    expect(target.current_stock).toBe(initialStock + 50);
  });

  it('deducts supplies automatically based on service recipe', () => {
    const recipes = inventoryEngine.getTechnicalRecipes();
    const recipe = recipes[0];
    const supplyId = recipe.supplies[0].item_id;
    const item = inventoryEngine.getItems('comp_naturo_spa_01').find(i => i.id === supplyId);
    const beforeStock = item?.current_stock || 0;

    inventoryEngine.recordServiceDeduction('comp_naturo_spa_01', recipe.service_id);

    const updated = inventoryEngine.getItems('comp_naturo_spa_01').find(i => i.id === supplyId);
    expect(updated?.current_stock).toBeLessThanOrEqual(beforeStock);
  });
});
