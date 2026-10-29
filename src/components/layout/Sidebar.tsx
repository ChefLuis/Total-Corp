import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { Resource } from '../../types/rbac';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  UserCheck,
  Receipt,
  DollarSign,
  Percent,
  Package,
  Megaphone,
  CreditCard,
  Building,
  Settings,
  Shield,
  Compass,
  Download,
  Clock,
  Sparkles,
  Menu,
  X,
  Coffee
} from 'lucide-react';

interface NavItemConfig {
  nameKey: string;
  path: string;
  icon: React.ElementType;
  resource: Resource;
}

const NAV_ITEMS: NavItemConfig[] = [
  { nameKey: 'nav.dashboard', path: '/dashboard', icon: LayoutDashboard, resource: 'dashboard' },
  { nameKey: 'nav.calendar', path: '/calendar', icon: Calendar, resource: 'appointments' },
  { nameKey: 'nav.digital_menu', path: '/menu', icon: Coffee, resource: 'services' },
  { nameKey: 'nav.clients', path: '/clients', icon: Users, resource: 'clients' },
  { nameKey: 'nav.services', path: '/services', icon: Scissors, resource: 'services' },
  { nameKey: 'nav.team', path: '/team', icon: UserCheck, resource: 'team' },
  { nameKey: 'nav.tabs', path: '/tabs', icon: Receipt, resource: 'appointments' },
  { nameKey: 'nav.financial', path: '/financial', icon: DollarSign, resource: 'financial' },
  { nameKey: 'nav.commissions', path: '/commissions', icon: Percent, resource: 'commissions' },
  { nameKey: 'nav.inventory', path: '/inventory', icon: Package, resource: 'inventory' },
  { nameKey: 'nav.marketing', path: '/marketing', icon: Megaphone, resource: 'marketing' },
  { nameKey: 'nav.subscriptions', path: '/subscriptions', icon: CreditCard, resource: 'subscriptions' },
  { nameKey: 'nav.corporate', path: '/corporate', icon: Building, resource: 'subscriptions' },
  { nameKey: 'nav.permissions', path: '/settings/permissions', icon: Shield, resource: 'settings' },
  { nameKey: 'nav.onboarding', path: '/onboarding', icon: Compass, resource: 'settings' },
  { nameKey: 'nav.settings', path: '/settings', icon: Settings, resource: 'settings' },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const { canAccess, role } = useRBAC();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filter navigation links based on current user's role permissions
  const filteredNavItems = NAV_ITEMS.filter((item) => canAccess(item.resource, 'read'));

  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            T
          </div>
          <div>
            <div className="font-bold text-slate-900 text-base leading-none tracking-tight flex items-center gap-1.5">
              <span>Total Corp</span>
              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium truncate max-w-[150px] mt-0.5">
              {currentCompany.name}
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Trial Countdown Banner */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-teal-50 to-emerald-50/70 border-b border-teal-100/80">
        <div className="flex items-center justify-between text-xs text-teal-900 font-medium">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>Teste Grátis: <strong>7 dias</strong></span>
          </span>
          <NavLink
            to="/subscriptions"
            className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline"
          >
            Assinar
          </NavLink>
        </div>
      </div>

      {/* Navigation Links with RBAC Filtering */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Módulos
        </div>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{t(item.nameKey)}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer: PWA / Segment Indicator */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5">
            <span className="font-medium text-slate-900">Aplicativo PWA</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded">v1.0</span>
          </div>
          <button
            onClick={() => alert('Total Corp está pronto para instalação como PWA via navegador.')}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-teal-800 bg-teal-50 hover:bg-teal-100/80 font-medium py-1.5 px-2 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-teal-700" />
            <span>Instalar no Dispositivo</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="w-12 h-12 rounded-full bg-teal-700 text-white shadow-lg flex items-center justify-center hover:bg-teal-800 transition-transform active:scale-95"
          title="Abrir menu de navegação"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>
    </>
  );
}
