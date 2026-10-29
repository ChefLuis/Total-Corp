import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Megaphone, Plus, Gift, MessageCircle } from 'lucide-react';

export default function MarketingPage() {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            {currentCompany.name} · Retenção
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-teal-700" />
            {t('nav.marketing')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Disparos automáticos de WhatsApp, campanhas segmentadas, cupons de desconto e programa de fidelidade
          </p>
        </div>

        <button className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors shrink-0">
          <Plus className="w-4 h-4" />
          <span>Criar Campanha</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-3">
        <Megaphone className="w-12 h-12 text-teal-700 mx-auto opacity-70" />
        <h3 className="text-sm font-bold text-slate-900">Automações de Mensagens & Fidelidade</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Lembretes de 24h e 2h antes, confirmação com resposta rápida e pesquisas NPS via WhatsApp Cloud API (Etapa 6).
        </p>
      </div>
    </div>
  );
}
