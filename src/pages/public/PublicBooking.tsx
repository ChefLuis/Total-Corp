import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { INITIAL_COMPANIES, INITIAL_SERVICES, INITIAL_PROFESSIONALS } from '../../services/mockData';
import { calendarEngine, TimeSlot, HoldReservation } from '../../services/calendarEngine';
import { formatCurrency } from '../../utils/currency';
import { Service, Professional } from '../../types';
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Building2,
  Phone,
  ShieldCheck,
  Check,
  QrCode,
  Share2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Printer,
  X
} from 'lucide-react';

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const utmSource = searchParams.get('utm_source') || 'direto';

  const { t, i18n } = useTranslation();

  const company = INITIAL_COMPANIES.find((c) => c.slug === slug) || INITIAL_COMPANIES[0];
  const companyServices = INITIAL_SERVICES.filter((s) => s.company_id === company.id);
  const companyProfessionals = INITIAL_PROFESSIONALS.filter((p) => p.company_id === company.id);

  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(companyServices[0] || null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-20');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // 10-minute hold reservation state
  const [activeHold, setActiveHold] = useState<HoldReservation | null>(null);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number>(600); // 10 min

  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [bookingResult, setBookingResult] = useState<{
    confirmed: boolean;
    appointmentId?: string;
    cancelToken?: string;
  }>({ confirmed: false });

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrOrigin, setQrOrigin] = useState<'recepcao' | 'quarto_hotel' | 'instagram'>('recepcao');
  const [copiedLink, setCopiedLink] = useState(false);

  // Calculate live available slots using the mathematical engine
  const availableSlots = useMemo(() => {
    if (!selectedService) return [];
    return calendarEngine.calculateAvailability({
      company_id: company.id,
      unit_id: 'unit_the_five_01',
      service_id: selectedService.id,
      date: selectedDate,
      preferred_professional_id: selectedProfessional ? selectedProfessional.id : null,
      min_notice_minutes: 60,
    });
  }, [company.id, selectedService, selectedDate, selectedProfessional]);

  // Hold Timer countdown
  useEffect(() => {
    if (!activeHold) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(activeHold.expires_at).getTime() - Date.now()) / 1000));
      setHoldSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setActiveHold(null);
        setSelectedSlot(null);
        alert('Sua reserva temporária de 10 minutos expirou. Por favor, selecione o horário novamente.');
        setStep(3);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeHold]);

  const handleSelectSlot = (slot: TimeSlot) => {
    if (!slot.available || !selectedService) return;
    setSelectedSlot(slot);

    // Create 10-minute hold
    const hold = calendarEngine.createHold({
      service_id: selectedService.id,
      professional_id: selectedProfessional ? selectedProfessional.id : null,
      start_time: slot.start_time,
      end_time: slot.end_time,
      client_phone: clientData.phone || 'anônimo',
    });

    setActiveHold(hold);
    setHoldSecondsRemaining(600);
    setStep(4);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedSlot) return;

    // Pick professional: preferred, or first available for the slot
    const finalProfId = selectedProfessional
      ? selectedProfessional.id
      : (selectedSlot.available_professional_ids[0] || companyProfessionals[0].id);

    const result = calendarEngine.createAppointmentWithLock({
      company_id: company.id,
      unit_id: 'unit_the_five_01',
      client_id: `cli_${Date.now()}`,
      professional_id: finalProfId,
      service_id: selectedService.id,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      notes: clientData.notes,
      actor_name: `${clientData.name} (Online / ${utmSource})`,
    });

    if (result.success && result.appointment) {
      setBookingResult({
        confirmed: true,
        appointmentId: result.appointment.id,
        cancelToken: `tok_${Math.random().toString(36).substr(2, 9)}`,
      });
      setActiveHold(null);
    } else {
      alert(result.conflictReason || 'Não foi possível confirmar o agendamento.');
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const qrShareUrl = `${window.location.origin}/${company.slug}?utm_source=${qrOrigin}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Brand Hero Header */}
      <header
        className="py-8 px-4 text-white shadow-md relative overflow-hidden"
        style={{ backgroundColor: company.theme_color }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-90 font-semibold">
              <span>Agendamento Online</span>
              <span>·</span>
              <span>Total Corp</span>
              {utmSource !== 'direto' && (
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">
                  Origem: {utmSource}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1 tracking-tight">
              {company.trade_name}
            </h1>
            <div className="flex items-center gap-3 text-xs opacity-85 mt-2">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>The Five (NH Curitiba)</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                <span>{company.phone}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl border border-white/20 transition-colors shadow-xs"
              title="Gerar QR Code para impressão ou Instagram"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 -mt-4">
        {/* Active 10-minute hold banner */}
        {activeHold && !bookingResult.confirmed && (
          <div className="mb-3 bg-amber-500 text-white p-3 rounded-xl shadow-sm flex items-center justify-between text-xs font-bold animate-pulse">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Horário reservado temporariamente por 10 minutos!</span>
            </div>
            <span className="font-mono text-sm bg-black/20 px-2 py-0.5 rounded">
              {formatTimer(holdSecondsRemaining)}
            </span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Progress Tabs */}
          {!bookingResult.confirmed && (
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-medium text-slate-500">
              <span className={step >= 1 ? 'font-bold text-teal-800' : ''}>1. Tratamento</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={step >= 2 ? 'font-bold text-teal-800' : ''}>2. Especialista</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={step >= 3 ? 'font-bold text-teal-800' : ''}>3. Horário Livre</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={step >= 4 ? 'font-bold text-teal-800' : ''}>4. Confirmação</span>
            </div>
          )}

          <div className="p-6">
            {bookingResult.confirmed ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Agendamento Confirmado!
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Enviamos os detalhes do seu atendimento e o link seguro para remarcar ou cancelar para o WhatsApp <strong>{clientData.phone}</strong>.
                </p>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tratamento:</span>
                    <span className="font-semibold text-slate-900">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Profissional:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedProfessional ? selectedProfessional.name : 'Qualquer especialista livre'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data & Hora:</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {selectedDate} às {selectedSlot?.time}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Valor do Serviço:</span>
                    <span className="font-bold text-teal-800 tabular-nums">
                      {selectedService ? formatCurrency(selectedService.price_cents, i18n.language) : 'R$ 0,00'}
                    </span>
                  </div>
                </div>

                {/* Self-service reschedule/cancel link notice */}
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg max-w-md mx-auto text-xs text-teal-900 flex items-center justify-between">
                  <span>Precisa remarcar? Acesse seu link pessoal até 2h antes.</span>
                  <button
                    onClick={() => alert(`Link de reagendamento: ${window.location.origin}/${company.slug}?token=${bookingResult.cancelToken}`)}
                    className="font-bold text-teal-800 underline ml-2"
                  >
                    Ver Link
                  </button>
                </div>

                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setBookingResult({ confirmed: false });
                      setStep(1);
                    }}
                    className="text-xs font-semibold text-teal-800 hover:underline"
                  >
                    Fazer Outro Agendamento
                  </button>
                  <span className="text-slate-300">·</span>
                  <Link to="/menu" className="text-xs text-slate-500 hover:text-slate-800">
                    Ver Cardápio de Pedidos (Menu)
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Step 1: Select Service */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-900">
                        Escolha o Tratamento Desejado
                      </h2>
                      <Link to="/menu" className="text-xs text-teal-700 font-semibold hover:underline">
                        Ver Cardápio Completo
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {companyServices.map((srv) => {
                        const isSelected = selectedService?.id === srv.id;
                        return (
                          <div
                            key={srv.id}
                            onClick={() => setSelectedService(srv)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-xs font-bold text-slate-900">{srv.name}</h3>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{srv.description}</p>
                                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-600">
                                  <Clock className="w-3.5 h-3.5 text-teal-700" />
                                  <span>{srv.duration_minutes} min (+{srv.buffer_time_minutes}m preparo)</span>
                                  {srv.requires_deposit && (
                                    <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                                      Sinal antecipado de {formatCurrency(srv.deposit_amount_cents || 0, i18n.language)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs font-bold text-teal-900 tabular-nums font-mono">
                                  {formatCurrency(srv.price_cents, i18n.language)}
                                </div>
                                {isSelected && (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-700 text-white mt-2">
                                    <Check className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={() => setStep(2)}
                        disabled={!selectedService}
                        className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-xs transition-colors"
                      >
                        <span>Continuar</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Select Professional */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-base font-bold text-slate-900">
                      Escolha o Especialista
                    </h2>
                    <div className="space-y-2.5">
                      <div
                        onClick={() => setSelectedProfessional(null)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedProfessional === null
                            ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">Qualquer profissional disponível</div>
                              <div className="text-[11px] text-slate-500">Garante a maior flexibilidade de horários livres</div>
                            </div>
                          </div>
                          {selectedProfessional === null && <Check className="w-4 h-4 text-teal-700" />}
                        </div>
                      </div>

                      {companyProfessionals.map((prof) => {
                        const isSelected = selectedProfessional?.id === prof.id;
                        return (
                          <div
                            key={prof.id}
                            onClick={() => setSelectedProfessional(prof)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                                  {prof.name[0]}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-900">{prof.name}</div>
                                  <div className="text-[11px] text-slate-500">{prof.bio}</div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-teal-700" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        onClick={() => setStep(1)}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Voltar</span>
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-xs transition-colors"
                      >
                        <span>Ver Horários Livres</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Select Date & Time with Availability Engine */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h2 className="text-base font-bold text-slate-900">
                      Horários Realmente Livres (Sem Conflitos)
                    </h2>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Selecione a Data Desejada
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full sm:w-64 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-teal-600 focus:outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Selecione um Horário Livre:
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableSlots.map((slot) => {
                          const isSelected = selectedSlot?.time === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => handleSelectSlot(slot)}
                              className={`py-2 px-3 text-xs font-mono font-bold rounded-lg border text-center transition-all ${
                                !slot.available
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                  : isSelected
                                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                                  : 'bg-white text-slate-900 border-slate-200 hover:border-teal-600 hover:bg-teal-50/50'
                              }`}
                            >
                              <div>{slot.time}</div>
                              {!slot.available && (
                                <div className="text-[9px] font-sans font-normal text-slate-400">Ocupado</div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        onClick={() => setStep(2)}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Voltar</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Client Info & Final Booking */}
                {step === 4 && (
                  <form onSubmit={handleConfirmBooking} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-900">
                        Dados de Contato para Confirmação
                      </h2>
                      {activeHold && (
                        <div className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Reserva segura: {formatTimer(holdSecondsRemaining)}
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <div><strong>Tratamento:</strong> {selectedService?.name}</div>
                      <div><strong>Data:</strong> {selectedDate} às {selectedSlot?.time}</div>
                      <div><strong>Especialista:</strong> {selectedProfessional ? selectedProfessional.name : 'Qualquer profissional'}</div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={clientData.name}
                        onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-teal-600 focus:outline-hidden"
                        placeholder="Ex: Amanda Vasconcelos"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          WhatsApp com DDD (para confirmação) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={clientData.phone}
                          onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-teal-600 focus:outline-hidden font-mono"
                          placeholder="(41) 99999-8888"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          E-mail (opcional)
                        </label>
                        <input
                          type="email"
                          value={clientData.email}
                          onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-teal-600 focus:outline-hidden"
                          placeholder="seuemail@exemplo.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Observações Especiais (alergias a óleos, pressão preferida)
                      </label>
                      <textarea
                        rows={2}
                        value={clientData.notes}
                        onChange={(e) => setClientData({ ...clientData, notes: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-teal-600 focus:outline-hidden"
                        placeholder="Ex: preferência por óleo sem cheiro mineral, foco no pescoço..."
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>
                        Conformidade LGPD: Seus dados cadastrais serão utilizados estritamente para envio de confirmações e gestão do atendimento no Naturo SPA.
                      </span>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Voltar</span>
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-xs transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>Concluir Agendamento</span>
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* QR Code Modal for Printing and Campaign Tracking */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">QR Code de Agendamento</h3>
              <button onClick={() => setIsQrModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Gere variações do QR code para medir de onde vêm as reservas (UTM tracking):
            </p>

            {/* Origin switch */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setQrOrigin('recepcao')}
                className={`py-1 rounded ${qrOrigin === 'recepcao' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'}`}
              >
                Recepção
              </button>
              <button
                onClick={() => setQrOrigin('quarto_hotel')}
                className={`py-1 rounded ${qrOrigin === 'quarto_hotel' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'}`}
              >
                Quarto NH
              </button>
              <button
                onClick={() => setQrOrigin('instagram')}
                className={`py-1 rounded ${qrOrigin === 'instagram' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'}`}
              >
                Instagram
              </button>
            </div>

            {/* Simulated Vector QR Display */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl inline-block mx-auto">
              <div className="w-40 h-40 bg-white p-2 border-2 border-slate-900 rounded-lg flex flex-col items-center justify-center space-y-1">
                <QrCode className="w-32 h-32 text-slate-900" />
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-2">
                utm_source={qrOrigin}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrShareUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link com UTM'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold py-2 rounded-lg shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Display para Balcão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
