import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { INITIAL_COMPANIES, INITIAL_MENU_ITEMS, MenuItemExtra } from '../../services/mockData';
import { formatCurrency } from '../../utils/currency';
import {
  Sparkles,
  Clock,
  Building2,
  Phone,
  Search,
  ShoppingBag,
  Check,
  ChevronRight,
  ArrowRight,
  X,
  Coffee,
  Heart,
  Share2
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', labelKey: 'Todos os Tratamentos' },
  { id: 'massages', labelKey: 'Massagens Autorais' },
  { id: 'rituals', labelKey: 'Rituais & Day Spa' },
  { id: 'focal', labelKey: 'Terapias Focais' },
  { id: 'amenities', labelKey: 'Bebidas & Amenities' },
];

export default function DigitalMenuPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  // Use Naturo Spa as default or slug
  const company = INITIAL_COMPANIES.find((c) => c.slug === slug) || INITIAL_COMPANIES[0];
  const menuItems = INITIAL_MENU_ITEMS.filter((item) => item.company_id === company.id);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<{ item: MenuItemExtra; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  const filteredItems = menuItems.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (item: MenuItemExtra) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.item.id !== id));
  };

  const totalCartCents = cart.reduce((acc, curr) => acc + curr.item.price_cents * curr.quantity, 0);

  const handleBookNow = (serviceName: string) => {
    // Navigate directly to public booking flow
    navigate(`/${company.slug}`);
  };

  const handleSendOrder = () => {
    setOrderSent(true);
    setTimeout(() => {
      setCart([]);
      setIsCartOpen(false);
      setOrderSent(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header / Brand Bar */}
      <header
        className="py-10 px-4 text-white shadow-md relative"
        style={{ backgroundColor: company.theme_color }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold opacity-90">
                <span>Cardápio Digital de Pedidos & Experiências</span>
                <span>·</span>
                <span>menu.naturospa.com.br</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mt-1 tracking-tight">
                {company.trade_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs opacity-90 mt-2.5">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>The Five (NH Curitiba) · 2º Andar</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{company.phone}</span>
                </span>
                <span>·</span>
                <span className="text-teal-100 font-medium">Seg a Sáb: 10h às 21h</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link do cardápio copiado!');
                }}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white text-xs font-semibold px-3 py-2 rounded-lg border border-white/20 transition-colors"
                title="Compartilhar cardápio"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 bg-white text-teal-900 text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-teal-50 transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-teal-700" />
                <span>Bolsa ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
                {cart.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-1 -right-1 ring-2 ring-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Sticky Filter & Search Control */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por massagem, ritual (Florescer, Pedras, Shiatsu) ou bebida..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:border-teal-600 focus:outline-hidden"
              />
            </div>

            {/* Language switch */}
            <div className="flex items-center justify-end gap-1 shrink-0">
              <span className="text-xs text-slate-400 font-medium mr-1 hidden sm:inline">Idioma:</span>
              <button
                onClick={() => i18n.changeLanguage('pt-BR')}
                className={`text-xs px-2 py-1 rounded font-medium ${i18n.language === 'pt-BR' ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200' : 'text-slate-600'}`}
              >
                🇧🇷 PT
              </button>
              <button
                onClick={() => i18n.changeLanguage('en')}
                className={`text-xs px-2 py-1 rounded font-medium ${i18n.language === 'en' ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200' : 'text-slate-600'}`}
              >
                🇺🇸 EN
              </button>
              <button
                onClick={() => i18n.changeLanguage('es')}
                className={`text-xs px-2 py-1 rounded font-medium ${i18n.language === 'es' ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200' : 'text-slate-600'}`}
              >
                🇪🇸 ES
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.labelKey}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>Mostrando {filteredItems.length} opções de atendimento & pedidos</span>
            <Link to={`/${company.slug}`} className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1">
              <span>Agendar Horário Online Direto</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-teal-600/60 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {item.tag && (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md mb-1.5">
                          {item.tag}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-xs font-medium text-teal-800/90 mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
                        {formatCurrency(item.price_cents, i18n.language)}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed pt-1">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 text-xs">
                  {item.duration_minutes ? (
                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-teal-700" />
                      <span>{item.duration_minutes} minutos</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                      <Coffee className="w-3.5 h-3.5" />
                      <span>Bebida / Amenity</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {item.category === 'amenities' ? (
                      <button
                        onClick={() => addToCart(item)}
                        className="flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-semibold py-1.5 px-3 rounded-lg border border-teal-200 transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-teal-700" />
                        <span>Pedir</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBookNow(item.name)}
                        className="flex items-center gap-1 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-2xs transition-colors"
                      >
                        <span>Reservar</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-xs text-slate-500 space-y-2 border-t border-slate-200 pt-6">
          <p>
            <strong>Naturo SPA & Terapias Integrativas</strong> · Complexo The Five (NH Curitiba The Five)
          </p>
          <p className="text-[11px]">
            Rua Nunes Machado, 68 - 2º Andar · Centro / Batel · Curitiba - PR · Telefone/WhatsApp: (41) 3018-0055
          </p>
          <div className="pt-2 flex justify-center gap-4 text-teal-800 font-medium">
            <Link to="/dashboard" className="hover:underline">Painel de Gestão Total Corp</Link>
            <span>·</span>
            <Link to={`/${company.slug}`} className="hover:underline">Agendamento Online Completo</Link>
          </div>
        </div>
      </main>

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col p-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-bold text-slate-900">Bolsa de Pedidos do Spa</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 divide-y divide-slate-100">
              {cart.length > 0 ? (
                cart.map(({ item, quantity }) => (
                  <div key={item.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {quantity}x {formatCurrency(item.price_cents, i18n.language)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(item.price_cents * quantity, i18n.language)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Sua bolsa de pedidos está vazia.
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                  <span>Total do Pedido:</span>
                  <span className="font-mono text-teal-900 tabular-nums">
                    {formatCurrency(totalCartCents, i18n.language)}
                  </span>
                </div>

                {orderSent ? (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-center text-xs font-semibold flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Pedido enviado com sucesso para a recepção do Spa!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSendOrder}
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Confirmar Pedido com a Recepção</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
