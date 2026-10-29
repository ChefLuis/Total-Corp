import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Settings as SettingsIcon, Building2, Shield, Bell, Palette, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            {currentCompany.name} · Sistema
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-teal-700" />
            {t('nav.settings')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dados cadastrais, unidades, permissões RBAC, integrações e personalização visual
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/onboarding"
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-600 shadow-2xs space-y-2 transition-colors"
        >
          <Building2 className="w-5 h-5 text-teal-700" />
          <h3 className="text-xs font-bold text-slate-900">Dados da Empresa & Unidades</h3>
          <p className="text-[11px] text-slate-500">Razão social, CNPJ, fuso horário e filiais ativas.</p>
        </Link>

        <Link
          to="/settings/permissions"
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-600 shadow-2xs space-y-2 transition-colors"
        >
          <Shield className="w-5 h-5 text-teal-700" />
          <h3 className="text-xs font-bold text-slate-900">Matriz de Permissões (RBAC)</h3>
          <p className="text-[11px] text-slate-500">Visualizar e auditar acessos dos 6 papéis da empresa.</p>
        </Link>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <Palette className="w-5 h-5 text-teal-700" />
          <h3 className="text-xs font-bold text-slate-900">Identidade Visual & Tema</h3>
          <p className="text-[11px] text-slate-500">Cor primária ({currentCompany.theme_color}), logotipo e banner.</p>
        </div>
      </div>
    </div>
  );
}
