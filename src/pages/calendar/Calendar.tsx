import { todayISO } from '../../utils/dates';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { calendarEngine, TimeSlot, AgendaBlock, WaitlistEntry } from '../../services/calendarEngine';
import { INITIAL_SERVICES, INITIAL_CLIENTS, INITIAL_PROFESSIONALS, INITIAL_SERVICE_CATEGORIES } from '../../services/mockData';
import { formatCurrency } from '../../utils/currency';
import { Appointment, AppointmentStatus } from '../../types';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Sparkles,
  X,
  History,
  Phone,
  Tag
} from 'lucide-react';

type CalendarViewMode = 'day' | 'week' | 'month' | 'waitlist';

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const { currentCompany, activeUnit, units } = useAuth();
  const { canAccess, role } = useRBAC();

  // Calendar State
  const [viewMode, setViewMode] = useState<CalendarViewMode>('day');
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [selectedProfFilter, setSelectedProfFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Modals state
  const [isNewAptModalOpen, setIsNewAptModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for new appointment
  const [newAptData, setNewAptData] = useState({
    client_id: INITIAL_CLIENTS[0].id,
    service_id: INITIAL_SERVICES[0].id,
    professional_id: INITIAL_PROFESSIONALS[0].id,
    time: '10:00',
    notes: '',
  });

  // Form state for block
  const [newBlockData, setNewBlockData] = useState({
    professional_id: INITIAL_PROFESSIONALS[0].id,
    reason: 'lunch' as 'lunch' | 'time_off' | 'maintenance' | 'meeting',
    notes: 'Intervalo de Almoço',
    start_time: '12:00',
    end_time: '13:00',
  });

  // Trigger state refresh
  const [refreshKey, setRefreshKey] = useState(0);

  const appointments = useMemo(() => {
    return calendarEngine.getAppointments(currentCompany.id, activeUnit?.id);
  }, [currentCompany.id, activeUnit, refreshKey]);

  const blocks = useMemo(() => {
    return calendarEngine.getBlocks(currentCompany.id, activeUnit?.id);
  }, [currentCompany.id, activeUnit, refreshKey]);

  const waitlist = useMemo(() => {
    return calendarEngine.getWaitlist(currentCompany.id);
  }, [currentCompany.id, refreshKey]);

  const professionals = useMemo(() => {
    return INITIAL_PROFESSIONALS.filter((p) => {
      if (p.company_id !== currentCompany.id) return false;
      if (activeUnit && !p.unit_ids.includes(activeUnit.id)) return false;
      if (selectedProfFilter !== 'all' && p.id !== selectedProfFilter) return false;
      return true;
    });
  }, [currentCompany.id, activeUnit, selectedProfFilter]);

  const getClient = (id: string) => INITIAL_CLIENTS.find((c) => c.id === id);
  const getService = (id: string) => INITIAL_SERVICES.find((s) => s.id === id);
  const getProf = (id: string) => INITIAL_PROFESSIONALS.find((p) => p.id === id);

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'in_service':
        return { label: t('dashboard.status.in_service'), class: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'confirmed':
        return { label: t('dashboard.status.confirmed'), class: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'scheduled':
        return { label: t('dashboard.status.scheduled'), class: 'bg-teal-100 text-teal-800 border-teal-300' };
      case 'completed':
        return { label: t('dashboard.status.completed'), class: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'canceled':
        return { label: t('dashboard.status.canceled'), class: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'no_show':
        return { label: t('dashboard.status.no_show'), class: 'bg-amber-100 text-amber-800 border-amber-300' };
      default:
        return { label: status, class: 'bg-slate-100 text-slate-700' };
    }
  };

  // Handle new appointment submission with atomic conflict check
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const service = getService(newAptData.service_id);
    if (!service) return;

    const startIso = new Date(`${selectedDate}T${newAptData.time}:00-03:00`).toISOString();
    const endIso = new Date(new Date(startIso).getTime() + service.duration_minutes * 60 * 1000).toISOString();

    const result = calendarEngine.createAppointmentWithLock({
      company_id: currentCompany.id,
      unit_id: activeUnit ? activeUnit.id : (units[0]?.id || 'unit_the_five_01'),
      client_id: newAptData.client_id,
      professional_id: newAptData.professional_id,
      service_id: newAptData.service_id,
      start_time: startIso,
      end_time: endIso,
      notes: newAptData.notes,
      actor_name: `${role.toUpperCase()} (Total Corp)`,
    });

    if (result.success) {
      setFeedbackMessage({ type: 'success', text: 'Agendamento confirmado com verificação atômica de agenda!' });
      setIsNewAptModalOpen(false);
      setRefreshKey((k) => k + 1);
    } else {
      setFeedbackMessage({ type: 'error', text: result.conflictReason || 'Erro ao agendar horário.' });
    }
  };

  // Handle agenda block submission
  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    const startIso = new Date(`${selectedDate}T${newBlockData.start_time}:00-03:00`).toISOString();
    const endIso = new Date(`${selectedDate}T${newBlockData.end_time}:00-03:00`).toISOString();

    calendarEngine.addBlock({
      company_id: currentCompany.id,
      unit_id: activeUnit ? activeUnit.id : (units[0]?.id || 'unit_the_five_01'),
      professional_id: newBlockData.professional_id,
      reason: newBlockData.reason,
      notes: newBlockData.notes,
      start_time: startIso,
      end_time: endIso,
    });

    setFeedbackMessage({ type: 'success', text: 'Bloqueio de horário cadastrado com sucesso!' });
    setIsBlockModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  // Handle status update
  const handleUpdateStatus = (newStatus: AppointmentStatus) => {
    if (!selectedAppointment) return;
    calendarEngine.updateStatus(
      selectedAppointment.id,
      newStatus,
      `${role.toUpperCase()} (Total Corp)`
    );
    setSelectedAppointment((prev) => (prev ? { ...prev, status: newStatus } : null));
    setRefreshKey((k) => k + 1);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider">
            <span>{currentCompany.name}</span>
            <span>·</span>
            <span>{activeUnit ? activeUnit.name : t('topbar.all_units')}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-teal-700" />
            {t('nav.calendar')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bloqueio atômico de conflitos, múltiplos serviços, encaixes e lista de espera
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors shadow-2xs"
            title="Imprimir folha da agenda"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={() => setIsBlockModalOpen(true)}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-slate-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors shadow-2xs"
          >
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span>Bloquear Horário</span>
          </button>

          <button
            onClick={() => setIsNewAptModalOpen(true)}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Date Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'day' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Visão Dia
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'week' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Visão Semana
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Visão Mês
          </button>
          <button
            onClick={() => setViewMode('waitlist')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
              viewMode === 'waitlist' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Lista de Espera</span>
            {waitlist.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-teal-700 text-white text-[10px] flex items-center justify-center font-bold">
                {waitlist.length}
              </span>
            )}
          </button>
        </div>

        {/* Center: Date Picker */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold font-mono border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden"
          />

          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Professional Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Profissional:</label>
          <select
            value={selectedProfFilter}
            onChange={(e) => setSelectedProfFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden"
          >
            <option value="all">Todos os profissionais</option>
            {INITIAL_PROFESSIONALS.filter(p => p.company_id === currentCompany.id).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main View Display */}
      {viewMode === 'day' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {professionals.map((prof) => {
            const profAppointments = appointments.filter((a) => a.professional_id === prof.id);
            const profBlocks = blocks.filter((b) => b.professional_id === prof.id);

            return (
              <div key={prof.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: prof.color_tag }} />
                    <span className="text-xs font-bold text-slate-900">{prof.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {profAppointments.length} reserva(s)
                  </span>
                </div>

                {/* Column Body: Time slots and blocks */}
                <div className="p-3 space-y-2.5 flex-1 min-h-[320px] bg-slate-50/20">
                  {/* Blocks */}
                  {profBlocks.map((blk) => (
                    <div
                      key={blk.id}
                      className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                        <div>
                          <div className="font-semibold text-amber-900">{blk.notes}</div>
                          <div className="text-[10px] text-amber-700 font-mono">
                            {new Date(blk.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(blk.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          calendarEngine.removeBlock(blk.id);
                          setRefreshKey(k => k + 1);
                        }}
                        className="text-amber-700 hover:text-amber-900 text-[10px] font-semibold"
                      >
                        Desbloquear
                      </button>
                    </div>
                  ))}

                  {/* Appointments */}
                  {profAppointments.length > 0 ? (
                    profAppointments.map((apt) => {
                      const srv = getService(apt.service_id);
                      const cli = getClient(apt.client_id);
                      const badge = getStatusBadge(apt.status);

                      return (
                        <div
                          key={apt.id}
                          onClick={() => setSelectedAppointment(apt)}
                          className="p-3 rounded-xl border border-slate-200 hover:border-teal-600 bg-white hover:shadow-xs cursor-pointer transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                              {new Date(apt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              {' - '}
                              {new Date(apt.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.class}`}>
                              {badge.label}
                            </span>
                          </div>

                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-teal-700" />
                              <span>{cli?.name || 'Cliente'}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {srv?.name}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 text-slate-500">
                            <span>{cli?.phone}</span>
                            <span className="font-mono font-semibold text-slate-900">
                              {formatCurrency(apt.price_cents, i18n.language)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      <span>Nenhum atendimento</span>
                      <button
                        onClick={() => {
                          setNewAptData((prev) => ({ ...prev, professional_id: prof.id }));
                          setIsNewAptModalOpen(true);
                        }}
                        className="text-teal-700 font-semibold mt-1 hover:underline text-[11px]"
                      >
                        + Agendar Horário
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Grade Semanal de Ocupação</h3>
            <span className="text-xs text-slate-500 font-mono">19 a 25 de Outubro de 2026</span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {['Seg 19', 'Ter 20', 'Qua 21', 'Qui 22', 'Sex 23', 'Sáb 24', 'Dom 25'].map((day, idx) => (
              <div key={day} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="font-bold text-slate-900 mb-1">{day}</div>
                <div className="text-[11px] text-slate-500">
                  {idx === 0 ? `${appointments.length} reservas` : 'Livre'}
                </div>
                <div className="mt-2 text-[10px] text-teal-800 font-semibold bg-teal-50 py-1 rounded">
                  {idx < 6 ? '09h às 21h' : 'Plantão'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Visão Mensal — Outubro 2026</h3>
            <span className="text-xs text-slate-500">Taxa de ocupação estimada: 85%</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="p-2 font-bold text-slate-500 text-center uppercase text-[10px]">{d}</div>
            ))}
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <div
                key={day}
                onClick={() => {
                  setSelectedDate(`2026-10-${day.toString().padStart(2, '0')}`);
                  setViewMode('day');
                }}
                className={`p-2.5 min-h-[60px] rounded-lg border text-left cursor-pointer transition-all ${
                  day === 19
                    ? 'border-teal-700 bg-teal-50/60 font-bold text-teal-950'
                    : 'border-slate-100 hover:border-slate-300 bg-slate-50/30 text-slate-700'
                }`}
              >
                <div className="text-[11px]">{day}</div>
                {day === 19 && (
                  <div className="mt-1 text-[9px] bg-teal-700 text-white px-1 py-0.5 rounded font-bold">
                    {appointments.length} reservas
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waitlist View */}
      {viewMode === 'waitlist' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Lista de Espera & Encaixes Automáticos</h3>
              <p className="text-xs text-slate-500">
                Clientes aguardando vagas em horários lotados. Em caso de cancelamento, o sistema notifica instantaneamente.
              </p>
            </div>
            <button
              onClick={() => {
                calendarEngine.addToWaitlist({
                  company_id: currentCompany.id,
                  unit_id: activeUnit ? activeUnit.id : 'unit_the_five_01',
                  client_id: INITIAL_CLIENTS[1].id,
                  client_name: INITIAL_CLIENTS[1].name,
                  client_phone: INITIAL_CLIENTS[1].phone,
                  service_id: INITIAL_SERVICES[0].id,
                  desired_date: selectedDate,
                  preferred_period: 'afternoon',
                });
                setRefreshKey(k => k + 1);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar à Espera</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {waitlist.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-slate-900">{item.client_name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <Phone className="w-3 h-3 text-teal-700" />
                    <span>{item.client_phone}</span>
                    <span>·</span>
                    <span>Data desejada: {item.desired_date} (Tarde)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Aguardando Vaga
                  </span>
                  <button
                    onClick={() => {
                      alert(`Disparo de aviso via WhatsApp enviado para ${item.client_name}!`);
                    }}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                  >
                    Avisar Desistência
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Novo Agendamento */}
      {isNewAptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-bold text-slate-900">Novo Agendamento</h3>
              </div>
              <button onClick={() => setIsNewAptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cliente *</label>
                <select
                  value={newAptData.client_id}
                  onChange={(e) => setNewAptData({ ...newAptData, client_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {INITIAL_CLIENTS.filter(c => c.company_id === currentCompany.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Serviço *</label>
                <select
                  value={newAptData.service_id}
                  onChange={(e) => setNewAptData({ ...newAptData, service_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {INITIAL_SERVICES.filter(s => s.company_id === currentCompany.id).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes} min) — {formatCurrency(s.price_cents, i18n.language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Profissional Especialista *</label>
                <select
                  value={newAptData.professional_id}
                  onChange={(e) => setNewAptData({ ...newAptData, professional_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {INITIAL_PROFESSIONALS.filter(p => p.company_id === currentCompany.id).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.specialties.join(', ')})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horário de Início</label>
                  <input
                    type="time"
                    value={newAptData.time}
                    onChange={(e) => setNewAptData({ ...newAptData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações / Preferências</label>
                <textarea
                  rows={2}
                  value={newAptData.notes}
                  onChange={(e) => setNewAptData({ ...newAptData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  placeholder="Ex: óleo sem fragrância mineral, foco em cervical..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAptModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Gravar com Checagem Atômica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Bloqueio de Horário */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-bold text-slate-900">Bloquear Horário na Agenda</h3>
              </div>
              <button onClick={() => setIsBlockModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBlock} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Profissional *</label>
                <select
                  value={newBlockData.professional_id}
                  onChange={(e) => setNewBlockData({ ...newBlockData, professional_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {INITIAL_PROFESSIONALS.filter(p => p.company_id === currentCompany.id).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo do Bloqueio *</label>
                <select
                  value={newBlockData.reason}
                  onChange={(e) => setNewBlockData({ ...newBlockData, reason: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="lunch">Intervalo de Almoço</option>
                  <option value="time_off">Folga / Descanso Semanal</option>
                  <option value="meeting">Reunião de Equipe / Treinamento</option>
                  <option value="maintenance">Manutenção de Sala / Higienização</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Início</label>
                  <input
                    type="time"
                    value={newBlockData.start_time}
                    onChange={(e) => setNewBlockData({ ...newBlockData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Término</label>
                  <input
                    type="time"
                    value={newBlockData.end_time}
                    onChange={(e) => setNewBlockData({ ...newBlockData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição / Notas</label>
                <input
                  type="text"
                  value={newBlockData.notes}
                  onChange={(e) => setNewBlockData({ ...newBlockData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  placeholder="Ex: Treinamento protocolo Toque Integrativo"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Salvar Bloqueio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detalhes do Agendamento & Auditoria */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-bold text-slate-900">Gerenciar Atendimento</h3>
              </div>
              <button onClick={() => setSelectedAppointment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-bold text-slate-900">{getClient(selectedAppointment.client_id)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Telefone:</span>
                  <span className="font-mono text-slate-700">{getClient(selectedAppointment.client_id)?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Serviço:</span>
                  <span className="font-semibold text-slate-900">{getService(selectedAppointment.service_id)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Profissional:</span>
                  <span className="font-semibold text-slate-900">{getProf(selectedAppointment.professional_id)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Horário:</span>
                  <span className="font-mono text-slate-900">
                    {new Date(selectedAppointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedAppointment.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Valor:</span>
                  <span className="font-bold text-teal-900 tabular-nums">
                    {formatCurrency(selectedAppointment.price_cents, i18n.language)}
                  </span>
                </div>
              </div>

              {/* Status Update Buttons */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">Atualizar Status do Atendimento:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['confirmed', 'arrived', 'in_service', 'completed', 'canceled', 'no_show'] as AppointmentStatus[]).map((st) => {
                    const badge = getStatusBadge(st);
                    const isCurrent = selectedAppointment.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(st)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                          isCurrent
                            ? `${badge.class} ring-2 ring-teal-700`
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {badge.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audit History */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1.5 text-xs">
                  <History className="w-3.5 h-3.5 text-teal-700" />
                  <span>Histórico de Alterações</span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-slate-500">
                  {calendarEngine.getHistory(selectedAppointment.id).map((h) => (
                    <div key={h.id} className="p-1.5 bg-slate-50 rounded">
                      <span className="font-semibold text-slate-700">{h.actor_name}:</span> {h.details}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
