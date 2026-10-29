import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { formatCurrency } from '../../utils/currency';
import { INITIAL_APPOINTMENTS, INITIAL_METRICS, INITIAL_SERVICES, INITIAL_CLIENTS, INITIAL_PROFESSIONALS } from '../../services/mockData';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  ExternalLink,
  Shield,
  ArrowRight,
  Sparkles,
  Coffee
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { greetingByHour } from '../../utils/dates';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { currentCompany, activeUnit, currentUser } = useAuth();
  const firstName = currentUser.full_name.split(' ')[0];
  const { role, canAccess } = useRBAC();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Filter appointments by current company and optional active unit
  const appointments = INITIAL_APPOINTMENTS.filter((apt) => {
    if (apt.company_id !== currentCompany.id) return false;
    if (activeUnit && apt.unit_id !== activeUnit.id) return false;
    return true;
  });

  const getClientName = (clientId: string) =>
    INITIAL_CLIENTS.find((c) => c.id === clientId)?.name || 'Cliente';

  const getServiceName = (serviceId: string) =>
    INITIAL_SERVICES.find((s) => s.id === serviceId)?.name || 'Serviço';

  const getProfessionalName = (profId: string) =>
    INITIAL_PROFESSIONALS.find((p) => p.id === profId)?.name || 'Profissional';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_service':
        return { label: t('dashboard.status.in_service'), class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'confirmed':
        return { label: t('dashboard.status.confirmed'), class: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'scheduled':
        return { label: t('dashboard.status.scheduled'), class: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'completed':
        return { label: t('dashboard.status.completed'), class: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { label: status, class: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider">
            <span>{currentCompany.name}</span>
            <span aria-hidden="true">·</span>
            <span>{activeUnit ? activeUnit.name : t('topbar.all_units')}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
            {i18n.language.startsWith('pt') ? `${greetingByHour()}, ${firstName}! 👋` : t('dashboard.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg shrink-0">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              period === 'today'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('dashboard.period_today')}
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              period === 'week'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('dashboard.period_week')}
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              period === 'month'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('dashboard.period_month')}
          </button>
        </div>
      </div>

      {/* Role Notice Banner (RBAC Awareness) */}
      <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-teal-900">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-teal-700 shrink-0" />
          <div>
            <span>Você está navegando como <strong>{t(`roles.${role}`)}</strong>.</span>{' '}
            <span className="text-teal-700/80 hidden sm:inline">{t(`role_descriptions.${role}`)}</span>
          </div>
        </div>
        <Link
          to="/settings/permissions"
          className="text-teal-800 hover:text-teal-950 font-semibold underline shrink-0 whitespace-nowrap"
        >
          {t('permissions_matrix.title')} →
        </Link>
      </div>

      {/* Primary KPI Grid (Restricted for Financial if role lacks permission) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue (Visible to owner, manager, financial, super_admin) */}
        {canAccess('financial', 'read') ? (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">{t('dashboard.kpi_revenue')}</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(INITIAL_METRICS.revenue_today_cents, i18n.language)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14% em relação a ontem</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80 flex flex-col justify-center items-center text-center">
            <Shield className="w-6 h-6 text-slate-400 mb-1" />
            <span className="text-xs font-medium text-slate-600">Faturamento Restrito</span>
            <span className="text-[11px] text-slate-400">Papel sem acesso financeiro</span>
          </div>
        )}

        {/* KPI 2: Appointments Count */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t('dashboard.kpi_appointments')}</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {INITIAL_METRICS.appointments_count_today}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            4 concluídos · 1 em atendimento · 2 agendados
          </div>
        </div>

        {/* KPI 3: Occupancy */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t('dashboard.kpi_occupancy')}</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {INITIAL_METRICS.occupancy_rate_percent}%
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Salas e profissionais ocupados hoje
          </div>
        </div>

        {/* KPI 4: New Clients */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t('dashboard.kpi_new_clients')}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {INITIAL_METRICS.new_clients_month}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-2">
            +8 novos clientes esta semana
          </div>
        </div>
      </div>

      {/* Two Column Section: Quick Actions & Operational Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions (Col 1) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700" />
              {t('dashboard.quick_actions')}
            </h2>
            <div className="space-y-2">
              <Link
                to="/calendar"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-teal-600 hover:bg-teal-50/40 text-xs font-medium text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-700" />
                  <span>{t('dashboard.action_new_appointment')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/clients"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-teal-600 hover:bg-teal-50/40 text-xs font-medium text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-700" />
                  <span>{t('dashboard.action_new_client')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/tabs"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-teal-600 hover:bg-teal-50/40 text-xs font-medium text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-teal-700" />
                  <span>{t('dashboard.action_open_tab')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/onboarding"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-teal-600 hover:bg-teal-50/40 text-xs font-medium text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700" />
                  <span>{t('nav.onboarding')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/menu"
                target="_blank"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-teal-200 bg-teal-50/60 hover:bg-teal-50 text-xs font-semibold text-teal-950 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-teal-700" />
                  <span>Cardápio de Pedidos (menu.naturospa.com.br)</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-teal-700" />
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/menu"
              target="_blank"
              className="w-full flex items-center justify-center gap-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-xs transition-colors"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Abrir Cardápio de Pedidos (Menu)</span>
            </Link>

            <Link
              to={`/${currentCompany.slug}`}
              target="_blank"
              className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t('dashboard.action_public_booking')}</span>
            </Link>
          </div>
        </div>

        {/* Operational Alerts & Upcoming Appointments (Col 2 & 3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Alerts Strip */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>{t('dashboard.alerts_title')}</span>
            </div>
            <div className="space-y-1.5 text-xs text-amber-800">
              <div className="flex items-center justify-between">
                <span>· {t('dashboard.alert_pending_confirmations', { count: INITIAL_METRICS.pending_confirmations })}</span>
                <button className="text-[11px] font-semibold text-amber-900 hover:underline">Disparar WhatsApp</button>
              </div>
              <div className="flex items-center justify-between">
                <span>· {t('dashboard.alert_low_stock', { count: INITIAL_METRICS.low_stock_alerts })}</span>
                <Link to="/inventory" className="text-[11px] font-semibold text-amber-900 hover:underline">Ver produtos</Link>
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-700" />
                <span>{t('dashboard.recent_appointments')}</span>
              </div>
              <Link
                to="/calendar"
                className="text-xs text-teal-700 hover:text-teal-800 font-semibold"
              >
                {t('dashboard.view_full_calendar')} →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {appointments.length > 0 ? (
                appointments.map((apt) => {
                  const badge = getStatusBadge(apt.status);
                  return (
                    <div
                      key={apt.id}
                      className="p-3.5 sm:px-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-mono font-semibold text-slate-700 tabular-nums bg-slate-100 px-2 py-1 rounded">
                          {new Date(apt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900">
                            {getClientName(apt.client_id)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {getServiceName(apt.service_id)} · {getProfessionalName(apt.professional_id)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.class}`}>
                          {badge.label}
                        </span>
                        <div className="text-xs font-semibold text-slate-900 tabular-nums hidden sm:block">
                          {formatCurrency(apt.price_cents, i18n.language)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  {t('dashboard.no_appointments')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
