import { InventoryItem, ServiceTechnicalRecipe, StockMovement } from './types';

export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  // Insumos de Uso Interno (supply)
  {
    id: 'inv_item_001',
    company_id: 'comp_naturo_spa_01',
    name: 'Óleo Vegetal Carreador Semente de Uva (Puro)',
    sku: 'INS-OLEO-01',
    category: 'supply',
    unit_measure: 'ml',
    current_stock: 4500, // 4.5 Litros
    min_stock: 2000,
    reorder_point: 3000,
    cost_price_cents: 8, // R$ 0,08 por ml (R$ 80/Litro)
    supplier_name: 'BioAroma Cosméticos Naturais Ltda',
  },
  {
    id: 'inv_item_002',
    company_id: 'comp_naturo_spa_01',
    name: 'Óleo Essencial Lavanda Francesa Bio',
    sku: 'INS-ESS-LAV',
    category: 'supply',
    unit_measure: 'ml',
    current_stock: 120, // 120 ml
    min_stock: 50,
    reorder_point: 80,
    cost_price_cents: 120, // R$ 1,20 por ml
    supplier_name: 'BioAroma Cosméticos Naturais Ltda',
  },
  {
    id: 'inv_item_003',
    company_id: 'comp_naturo_spa_01',
    name: 'Kit Lençol Descartável com Elástico TNT 40g',
    sku: 'INS-LENC-01',
    category: 'supply',
    unit_measure: 'un',
    current_stock: 35, // 35 unidades (alerta baixo!)
    min_stock: 50,
    reorder_point: 80,
    cost_price_cents: 450, // R$ 4,50 cada
    supplier_name: 'MedClean Hospitalar & Spa',
  },
  {
    id: 'inv_item_004',
    company_id: 'comp_naturo_spa_01',
    name: 'Argila Verde Medicinal Esterilizada',
    sku: 'INS-ARG-VD',
    category: 'supply',
    unit_measure: 'g',
    current_stock: 2800, // 2.8 kg
    min_stock: 1000,
    reorder_point: 1500,
    cost_price_cents: 4, // R$ 0,04 por g
    supplier_name: 'TerraViva Argilas Orgânicas',
  },

  // Produtos de Revenda / Home Care (retail)
  {
    id: 'inv_item_005',
    company_id: 'comp_naturo_spa_01',
    name: 'Vela Aromática Vegetal Cera de Soja & Alecrim (200g)',
    sku: 'REV-VELA-01',
    category: 'retail',
    unit_measure: 'un',
    current_stock: 18,
    min_stock: 10,
    reorder_point: 15,
    cost_price_cents: 3800, // Custo: R$ 38,00
    sale_price_cents: 8900, // Venda: R$ 89,00
    supplier_name: 'Atelier Botânico Velas',
  },
  {
    id: 'inv_item_006',
    company_id: 'comp_naturo_spa_01',
    name: 'Home Spray Aromatizador Bamboo & Chá Branco (250ml)',
    sku: 'REV-SPRAY-01',
    category: 'retail',
    unit_measure: 'un',
    current_stock: 24,
    min_stock: 10,
    reorder_point: 15,
    cost_price_cents: 4200, // Custo: R$ 42,00
    sale_price_cents: 9800, // Venda: R$ 98,00
    supplier_name: 'Atelier Botânico Velas',
  },
  {
    id: 'inv_item_007',
    company_id: 'comp_naturo_spa_01',
    name: 'Óleo Essencial Lavanda Francesa Frasco 10ml',
    sku: 'REV-OE-LAV10',
    category: 'retail',
    unit_measure: 'un',
    current_stock: 8, // Alerta baixo!
    min_stock: 10,
    reorder_point: 15,
    cost_price_cents: 2900,
    sale_price_cents: 6900,
    supplier_name: 'BioAroma Cosméticos Naturais Ltda',
  },
];

export const TECHNICAL_RECIPES: ServiceTechnicalRecipe[] = [
  {
    service_id: 'srv_relaxante_01',
    service_name: 'Massagem Relaxante com Aromaterapia (60min)',
    supplies: [
      { item_id: 'inv_item_001', item_name: 'Óleo Semente de Uva', quantity: 30, unit_measure: 'ml' },
      { item_id: 'inv_item_002', item_name: 'Óleo Essencial Lavanda', quantity: 2, unit_measure: 'ml' },
      { item_id: 'inv_item_003', item_name: 'Kit Lençol Descartável', quantity: 1, unit_measure: 'un' },
    ],
  },
  {
    service_id: 'srv_pedras_03',
    service_name: 'Terapia das Pedras Quentes Vulcânicas (90min)',
    supplies: [
      { item_id: 'inv_item_001', item_name: 'Óleo Semente de Uva', quantity: 45, unit_measure: 'ml' },
      { item_id: 'inv_item_002', item_name: 'Óleo Essencial Lavanda', quantity: 3, unit_measure: 'ml' },
      { item_id: 'inv_item_003', item_name: 'Kit Lençol Descartável', quantity: 1, unit_measure: 'un' },
    ],
  },
  {
    service_id: 'srv_florescer_04',
    service_name: 'Ritual Florescer Day Spa (120min)',
    supplies: [
      { item_id: 'inv_item_001', item_name: 'Óleo Semente de Uva', quantity: 60, unit_measure: 'ml' },
      { item_id: 'inv_item_002', item_name: 'Óleo Essencial Lavanda', quantity: 4, unit_measure: 'ml' },
      { item_id: 'inv_item_003', item_name: 'Kit Lençol Descartável', quantity: 1, unit_measure: 'un' },
      { item_id: 'inv_item_004', item_name: 'Argila Verde Esterilizada', quantity: 80, unit_measure: 'g' },
    ],
  },
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov_001',
    company_id: 'comp_naturo_spa_01',
    item_id: 'inv_item_001',
    item_name: 'Óleo Vegetal Carreador Semente de Uva',
    type: 'purchase_entry',
    quantity: 5000,
    unit_cost_cents: 8,
    date: '2026-10-14',
    notes: 'Entrada NF-e 49102 - BioAroma',
    invoice_number: 'NFe-49102',
  },
  {
    id: 'mov_002',
    company_id: 'comp_naturo_spa_01',
    item_id: 'inv_item_003',
    item_name: 'Kit Lençol Descartável TNT',
    type: 'service_usage',
    quantity: -12,
    unit_cost_cents: 450,
    date: '2026-10-18',
    notes: 'Baixa automática por atendimentos do final de semana',
  },
  {
    id: 'mov_003',
    company_id: 'comp_naturo_spa_01',
    item_id: 'inv_item_005',
    item_name: 'Vela Aromática Vegetal Cera de Soja',
    type: 'retail_sale',
    quantity: -2,
    unit_cost_cents: 3800,
    date: '2026-10-19',
    notes: 'Venda balcão vinculada à Comanda #1082',
  },
];

class InventoryEngine {
  private items: InventoryItem[] = [...INITIAL_INVENTORY_ITEMS];
  private movements: StockMovement[] = [...INITIAL_STOCK_MOVEMENTS];
  private technicalRecipes: ServiceTechnicalRecipe[] = [...TECHNICAL_RECIPES];

  public getItems(companyId: string, category?: 'retail' | 'supply'): InventoryItem[] {
    return this.items.filter(i => {
      if (i.company_id !== companyId) return false;
      if (category && i.category !== category) return false;
      return true;
    });
  }

  public getLowStockAlerts(companyId: string): InventoryItem[] {
    return this.items.filter(i => i.company_id === companyId && i.current_stock <= i.min_stock);
  }

  public getTechnicalRecipes(): ServiceTechnicalRecipe[] {
    return this.technicalRecipes;
  }

  public getMovements(companyId: string): StockMovement[] {
    return this.movements.filter(m => m.company_id === companyId);
  }

  public addItem(item: Omit<InventoryItem, 'id'>): InventoryItem {
    const newItem: InventoryItem = {
      ...item,
      id: `inv_${Date.now()}`,
    };
    this.items.push(newItem);
    return newItem;
  }

  public recordPurchaseEntry(params: {
    company_id: string;
    item_id: string;
    quantity: number;
    unit_cost_cents: number;
    invoice_number?: string;
    supplier_name?: string;
  }): boolean {
    const item = this.items.find(i => i.id === params.item_id);
    if (!item) return false;

    item.current_stock += params.quantity;
    item.cost_price_cents = params.unit_cost_cents;

    this.movements.unshift({
      id: `mov_${Date.now()}`,
      company_id: params.company_id,
      item_id: item.id,
      item_name: item.name,
      type: 'purchase_entry',
      quantity: params.quantity,
      unit_cost_cents: params.unit_cost_cents,
      date: new Date().toISOString().split('T')[0],
      notes: `Entrada de compra NF-e ${params.invoice_number || 'S/N'} (${item.supplier_name})`,
      invoice_number: params.invoice_number,
    });

    return true;
  }

  public recordServiceDeduction(companyId: string, serviceId: string): boolean {
    const recipe = this.technicalRecipes.find(r => r.service_id === serviceId);
    if (!recipe) return false;

    recipe.supplies.forEach(sup => {
      const item = this.items.find(i => i.id === sup.item_id);
      if (item) {
        item.current_stock = Math.max(0, item.current_stock - sup.quantity);
        this.movements.unshift({
          id: `mov_${Date.now()}_${sup.item_id}`,
          company_id: companyId,
          item_id: item.id,
          item_name: item.name,
          type: 'service_usage',
          quantity: -sup.quantity,
          unit_cost_cents: item.cost_price_cents,
          date: new Date().toISOString().split('T')[0],
          notes: `Consumo automático pela sessão de ${recipe.service_name}`,
        });
      }
    });

    return true;
  }
}

export const inventoryEngine = new InventoryEngine();
