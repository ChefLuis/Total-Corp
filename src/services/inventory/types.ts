export type InventoryCategory = 'retail' | 'supply';

export type UnitMeasure = 'un' | 'ml' | 'g' | 'kit' | 'par';

export type MovementType = 'purchase_entry' | 'service_usage' | 'retail_sale' | 'adjustment_loss';

export interface InventoryItem {
  id: string;
  company_id: string;
  name: string;
  sku: string;
  category: InventoryCategory;
  unit_measure: UnitMeasure;
  current_stock: number;
  min_stock: number;
  reorder_point: number;
  cost_price_cents: number;
  sale_price_cents?: number; // Para produtos de revenda
  supplier_name: string;
}

export interface ServiceTechnicalRecipe {
  service_id: string;
  service_name: string;
  supplies: {
    item_id: string;
    item_name: string;
    quantity: number;
    unit_measure: UnitMeasure;
  }[];
}

export interface StockMovement {
  id: string;
  company_id: string;
  item_id: string;
  item_name: string;
  type: MovementType;
  quantity: number;
  unit_cost_cents: number;
  date: string;
  notes: string;
  invoice_number?: string;
}
