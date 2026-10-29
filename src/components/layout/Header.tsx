import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { AppRole } from '../../types/rbac';
import { 
  Building2, 
  Search, 
  ShieldCheck, 
  ChevronDown, 
  Sparkles, 
  Check, 
  User as UserIcon,
  HelpCircle,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ROLES: { id: AppRole; key: string; color: string }[] = [
  { id: 'owner', key: 'roles.owner', color: 'bg-teal-700 text-white' },
  { id: 'manager', key: 'roles.manager', color: 'bg-cyan-700 text-white' },
  { id: 'receptionist', key: 'roles.receptionist', color: 'bg-emerald-700 text-white' },
  { id: 'professional', key: 'roles.professional', color: 'bg-violet-700 text-white' },
  { id: 'financial', key: 'roles.financial', color: 'bg-amber-700 text-white' },
  { id: 'super_admin', key: 'roles.super_admin', color: 'bg-slate-900 text-white' },
];

const LANGUAGES = [
  { code: 'pt-BR', flag: '🇧🇷', label: 'PT' },
  { code: 'en', flag: '🇺🇸', label: 'EN' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
];

export default function Header() {
  const { t, i18n } = useTranslation();
  const { currentUser, currentCompany, units, activeUnit, setActiveUnit, setActiveRole, mode, signOut } = useAuth();
  const { role } = useRBAC();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  const currentRoleConfig = ROLES.find((r) => r.id === role) || ROLES[0];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Left: Unit Selector & Company Context */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-teal-600 bg-slate-50 text-xs font-medium text-slate-800 transition-colors"
          >
            <Building2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span className="max-w-[140px] sm:max-w-[180px] truncate">
              {activeUnit ? activeUnit.name : t('topbar.all_units')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {isUnitDropdownOpen && (
            <div className="absolute left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {t('topbar.unit')} — {currentCompany.trade_name}
              </div>
              <button
                onClick={() => {
                  setActiveUnit(null);
                  setIsUnitDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  activeUnit === null ? 'font-semibold text-teal-700 bg-teal-50/50' : 'text-slate-700'
                }`}
              >
                <span>{t('topbar.all_units')}</span>
                {activeUnit === null && <Check className="w-3.5 h-3.5 text-teal-700" />}
              </button>
              <div className="h-px bg-slate-100 my-1" />
              {units.map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => {
                    setActiveUnit(unit);
                    setIsUnitDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    activeUnit?.id === unit.id ? 'font-semibold text-teal-700 bg-teal-50/50' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{unit.name}</span>
                  {activeUnit?.id === unit.id && <Check className="w-3.5 h-3.5 text-teal-700" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Link to Public Page */}
        <Link
          to={`/${currentCompany.slug}`}
          target="_blank"
          className="hidden md:flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 font-medium px-2.5 py-1.5 rounded-md hover:bg-teal-50 transition-colors"
          title="Ver página de agendamento online do cliente"
        >
          <span>/{currentCompany.slug}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('topbar.search_placeholder')}
            className="w-full pl-9 pr-14 py-1.5 bg-slate-100/80 border border-transparent focus:border-teal-600 focus:bg-white rounded-lg text-xs text-slate-800 placeholder-slate-400 transition-all outline-hidden"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Language Switcher, Role Simulator, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Fixed Flag Language Switcher 🇧🇷 🇺🇸 🇪🇸 */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {LANGUAGES.map((lang) => {
            const isSelected = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={`Mudar idioma para ${lang.label}`}
              >
                <span className="text-sm leading-none">{lang.flag}</span>
                <span className="hidden xl:inline text-[11px]">{lang.label}</span>
              </button>
            );
          })}
        </div>

        {mode === 'demo' && import.meta.env.VITE_DEMO_MODE !== 'false' && (
          <>
        {/* Interactive Role Switcher / RBAC Simulator */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs font-medium text-slate-800 shadow-2xs transition-colors"
            title="Simular visualização de outro papel de usuário"
          >
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span className="hidden lg:inline text-slate-500 font-normal">Papel:</span>
            <span className="font-semibold text-slate-900 truncate max-w-[90px] sm:max-w-none">
              {t(currentRoleConfig.key)}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 pb-2 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  {t('topbar.role_simulation')} (RBAC)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Troque de papel para testar o isolamento de menus e permissões em tempo real.
                </p>
              </div>

              <div className="py-1">
                {ROLES.map((r) => {
                  const isCurrent = r.id === role;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setActiveRole(r.id);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isCurrent ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${r.color.split(' ')[0]}`} />
                        <span>{t(r.key)}</span>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-teal-700" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 px-3 border-t border-slate-100">
                <Link
                  to="/settings/permissions"
                  onClick={() => setIsRoleDropdownOpen(false)}
                  className="text-[11px] text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  Ver matriz completa de permissões
                </Link>
              </div>
            </div>
          )}
        </div>

          </>
        )}

        {/* User Profile Mini Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-teal-800 text-white font-semibold flex items-center justify-center text-xs shadow-xs">
            {currentUser.full_name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="hidden 2xl:block text-left text-xs leading-tight">
            <div className="font-semibold text-slate-900 truncate max-w-[110px]">{currentUser.full_name}</div>
            <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
          </div>
          {mode === 'supabase' && (
            <button onClick={signOut} title="Sair" aria-label="Sair"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
