import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { inventoryEngine } from '../../services/inventory/inventoryEngine';
import { InventoryItem, ServiceTechnicalRecipe, StockMovement, UnitMeasure } from '../../services/inventory/types';
import { formatCurrency } from '../../utils/currency';
import {
  Package,
  Plus,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  ClipboardList,
  History,
  CheckCircle2,
  Tag,
  ShoppingBag,
  TrendingUp,
  X,
  Check,
  Search
} from 'lucide-react';

export default function InventoryPage() {
  const { t, i18n } = useTranslation();
  const { currentCompany } = useAuth();
  const { canAccess } = useRBAC();

  const [activeTab, setActiveTab] = useState<'all' | 'supplies' | 'retail' | 'recipes' | 'movements'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState<InventoryItem | null>(null);

  // New item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'retail' | 'supply'>('supply');
  const [newItemMeasure, setNewItemMeasure] = useState<UnitMeasure>('un');
  const [newItemStock, setNewItemStock] = useState('50');
  const [newItemMinStock, setNewItemMinStock] = useState('20');
  const [newItemCost, setNewItemCost] = useState('15.00');
  const [newItemSalePrice, setNewItemSalePrice] = useState('45.00');
  const [newItemSupplier, setNewItemSupplier] = useState('');

  // Purchase entry form
  const [purchaseQty, setPurchaseQty] = useState('20');
  const [purchaseCost, setPurchaseCost] = useState('15.00');
  const [purchaseInvoice, setPurchaseInvoice] = useState('');

  const allItems = inventoryEngine.getItems(currentCompany.id);
  const lowStockAlerts = inventoryEngine.getLowStockAlerts(currentCompany.id);
  const recipes = inventoryEngine.getTechnicalRecipes();
  const movements = inventoryEngine.getMovements(currentCompany.id);

  const filteredItems = allItems.filter(item => {
    if (activeTab === 'supplies' && item.category !== 'supply') return false;
    if (activeTab === 'retail' && item.category !== 'retail') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
    }
    return true;
  });

  const totalStockValueCents = allItems.reduce((acc, i) => acc + (i.current_stock * i.cost_price_cents), 0);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    inventoryEngine.addItem({
      company_id: currentCompany.id,
      name: newItemName.trim(),
      sku: newItemSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      category: newItemCategory,
      unit_measure: newItemMeasure,
      current_stock: Number(newItemStock) || 0,
      min_stock: Number(newItemMinStock) || 10,
      reorder_point: (Number(newItemMinStock) || 10) * 1.5,
      cost_price_cents: Math.round(parseFloat(newItemCost || '0') * 100),
      sale_price_cents: newItemCategory === 'retail' ? Math.round(parseFloat(newItemSalePrice || '0') * 100) : undefined,
      supplier_name: newItemSupplier.trim() || 'Fornecedor Padrão',
    });

    setIsNewItemModalOpen(false);
    setNewItemName('');
    setNewItemSku('');
    setRefreshKey(k => k + 1);
  };

  const handleConfirmPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForPurchase) return;

    inventoryEngine.recordPurchaseEntry({
      company_id: currentCompany.id,
      item_id: selectedItemForPurchase.id,
      quantity: Number(purchaseQty) || 1,
      unit_cost_cents: Math.round(parseFloat(purchaseCost || '0') * 100),
      invoice_number: purchaseInvoice.trim() || undefined,
    });

    setIsPurchaseModalOpen(false);
    setSelectedItemForPurchase(null);
    setRefreshKey(k => k + 1);
  };

  const handleSimulateServiceDeduction = (serviceId: string) => {
    inventoryEngine.recordServiceDeduction(currentCompany.id, serviceId);
    alert('Consumo de insumos da ficha técnica baixado do estoque com sucesso!');
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            {currentCompany.name} · Controle de Estoque & Suprimentos
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-teal-700" />
            <span>Estoque & Fichas Técnicas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Baixa automática por consumo de serviço, produtos de revenda, ponto de reposição e controle de compras
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewItemModalOpen(true)}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Produto / Insumo</span>
          </button>
        </div>
      </div>

      {/* Low Stock Banner Alert */}
      {lowStockAlerts.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-amber-900">
              Alerta de Estoque Mínimo ({lowStockAlerts.length} itens precisam de reposição):
            </div>
            <div className="text-amber-800 mt-1 flex flex-wrap gap-2">
              {lowStockAlerts.map(item => (
                <span key={item.id} className="bg-white/80 border border-amber-300 px-2 py-0.5 rounded font-medium">
                  {item.name}: <strong>{item.current_stock} {item.unit_measure}</strong> (Mín: {item.min_stock})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Valor Total em Estoque (Custo)</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalStockValueCents, i18n.language)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Capital imobilizado em insumos e revenda</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Itens Cadastrados</div>
          <div className="text-2xl font-bold text-teal-800 font-mono tabular-nums">
            {allItems.length} SKUs
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">
            {allItems.filter(i => i.category === 'supply').length} insumos de uso interno · {allItems.filter(i => i.category === 'retail').length} revenda
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Fichas Técnicas Integradas</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {recipes.length} Serviços
          </div>
          <div className="text-[11px] text-emerald-800 font-medium mt-1">
            Baixa automática conectada ao fechamento de comandas
          </div>
        </div>
      </div>

      {/* Subtabs Switcher */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todos os Itens ({allItems.length})
        </button>
        <button
          onClick={() => setActiveTab('supplies')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'supplies' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Insumos de Uso Interno ({allItems.filter(i => i.category === 'supply').length})
        </button>
        <button
          onClick={() => setActiveTab('retail')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'retail' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Produtos de Revenda ({allItems.filter(i => i.category === 'retail').length})
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'recipes' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Fichas Técnicas ({recipes.length})
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'movements' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Extrato de Movimentações ({movements.length})
        </button>
      </div>

      {/* ITEMS LIST (ALL, SUPPLIES, RETAIL) */}
      {['all', 'supplies', 'retail'].includes(activeTab) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome do item ou código SKU..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-teal-600 focus:outline-hidden"
              />
            </div>
            <div className="text-xs text-slate-500">
              Mostrando <strong>{filteredItems.length}</strong> itens
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-center">Estoque Atual</th>
                  <th className="py-3 px-4 text-center">Mínimo</th>
                  <th className="py-3 px-4 text-right">Custo Unitário</th>
                  {activeTab !== 'supplies' && <th className="py-3 px-4 text-right">Preço Venda</th>}
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isLow = item.current_stock <= item.min_stock;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          SKU: {item.sku} · Fornecedor: {item.supplier_name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {item.category === 'retail' ? (
                          <span className="inline-block text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            Revenda
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Insumo Interno
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 tabular-nums">
                        {item.current_stock} <span className="text-[11px] font-normal text-slate-500">{item.unit_measure}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500 tabular-nums">
                        {item.min_stock} {item.unit_measure}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {formatCurrency(item.cost_price_cents, i18n.language)}
                      </td>
                      {activeTab !== 'supplies' && (
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 tabular-nums">
                          {item.sale_price_cents ? formatCurrency(item.sale_price_cents, i18n.language) : '—'}
                        </td>
                      )}
                      <td className="py-3 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Repor Estoque</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Estoque OK</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedItemForPurchase(item);
                            setPurchaseCost((item.cost_price_cents / 100).toFixed(2));
                            setIsPurchaseModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md transition-colors"
                        >
                          + Entrada Compra
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FICHAS TÉCNICAS */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
            <div>
              <strong>Como funcionam as Fichas Técnicas no Total Corp:</strong> Ao concluir um atendimento na Agenda ou fechar uma Comanda no Caixa, o sistema desconta automaticamente cada miligrama, mililitro ou unidade de descartável configurado aqui.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map(recipe => (
              <div key={recipe.service_id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-teal-700" />
                    <h3 className="text-sm font-bold text-slate-900">{recipe.service_name}</h3>
                  </div>
                  <button
                    onClick={() => handleSimulateServiceDeduction(recipe.service_id)}
                    className="text-[11px] font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 px-2 py-1 rounded transition-colors"
                    title="Simular execução de atendimento e baixa"
                  >
                    Simular Baixa
                  </button>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  {recipe.supplies.map((sup, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-600 bg-slate-50 p-2 rounded-lg">
                      <span>{sup.item_name}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {sup.quantity} {sup.unit_measure}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXTRATO DE MOVIMENTAÇÕES */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Histórico de Entradas, Baixas e Vendas
            </h3>
            <span className="text-xs text-slate-500 font-mono">{movements.length} movimentações</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Tipo de Movimentação</th>
                <th className="py-3 px-4 text-center">Quantidade</th>
                <th className="py-3 px-4">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((mov) => (
                <tr key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{mov.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{mov.item_name}</td>
                  <td className="py-3 px-4">
                    {mov.type === 'purchase_entry' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Entrada de Compra</span>
                      </span>
                    )}
                    {mov.type === 'service_usage' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                        <span>Consumo por Serviço</span>
                      </span>
                    )}
                    {mov.type === 'retail_sale' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                        <span>Venda Balcão</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                    <span className={mov.quantity > 0 ? 'text-emerald-700' : 'text-slate-700'}>
                      {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{mov.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: NOVO PRODUTO / INSUMO */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Novo Produto ou Insumo</h3>
              <button onClick={() => setIsNewItemModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewItemCategory('supply')}
                  className={`py-2 rounded-lg font-bold border transition-all ${
                    newItemCategory === 'supply'
                      ? 'bg-slate-100 border-slate-400 text-slate-900 ring-1 ring-slate-400'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Insumo de Uso Interno
                </button>
                <button
                  type="button"
                  onClick={() => setNewItemCategory('retail')}
                  className={`py-2 rounded-lg font-bold border transition-all ${
                    newItemCategory === 'retail'
                      ? 'bg-teal-50 border-teal-300 text-teal-800 ring-1 ring-teal-400'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Produto de Revenda (Home Care)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Item:</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Ex: Óleo de Amêndoas Doces, Toalha Algodão Egípcio..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código SKU / Referência:</label>
                  <input
                    type="text"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    placeholder="Ex: INS-OLEO-02"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unidade de Medida:</label>
                  <select
                    value={newItemMeasure}
                    onChange={(e) => setNewItemMeasure(e.target.value as UnitMeasure)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="g">Gramas (g)</option>
                    <option value="kit">Kit</option>
                    <option value="par">Par</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estoque Inicial:</label>
                  <input
                    type="number"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estoque Mínimo (Alerta):</label>
                  <input
                    type="number"
                    value={newItemMinStock}
                    onChange={(e) => setNewItemMinStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Custo de Compra (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                {newItemCategory === 'retail' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Preço de Venda Balcão (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItemSalePrice}
                      onChange={(e) => setNewItemSalePrice(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fornecedor Habitual:</label>
                <input
                  type="text"
                  value={newItemSupplier}
                  onChange={(e) => setNewItemSupplier(e.target.value)}
                  placeholder="Ex: BioAroma Cosméticos Naturais Ltda"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENTRADA DE COMPRA */}
      {isPurchaseModalOpen && selectedItemForPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Registrar Entrada de Estoque</h3>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPurchase} className="space-y-4 pt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{selectedItemForPurchase.name}</div>
                <div className="text-[11px] text-slate-500">
                  Estoque Atual: {selectedItemForPurchase.current_stock} {selectedItemForPurchase.unit_measure} · Fornecedor: {selectedItemForPurchase.supplier_name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Quantidade Adicionada ({selectedItemForPurchase.unit_measure}):
                  </label>
                  <input
                    type="number"
                    required
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Custo Unitário (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Número da Nota Fiscal (NF-e):</label>
                <input
                  type="text"
                  value={purchaseInvoice}
                  onChange={(e) => setPurchaseInvoice(e.target.value)}
                  placeholder="Ex: NF-e 49103"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Entrada</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
