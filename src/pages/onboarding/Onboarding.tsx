import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { BusinessSegment } from '../../types';
import {
  Compass,
  CheckCircle2,
  Building2,
  Clock,
  Scissors,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SEGMENTS: { id: BusinessSegment; labelKey: string; icon: string; desc: string }[] = [
  { id: 'spa_wellness', labelKey: 'onboarding.segment_spa', icon: '🌿', desc: 'Massagens terapêuticas, banhos, aromaterapia e bem-estar' },
  { id: 'salon', labelKey: 'onboarding.segment_salon', icon: '✂️', desc: 'Cabelo, manicure, maquiagem e visagismo' },
  { id: 'barbershop', labelKey: 'onboarding.segment_barbershop', icon: '💈', desc: 'Corte masculino, barba na toalha quente e cuidados' },
  { id: 'aesthetics', labelKey: 'onboarding.segment_aesthetics', icon: '✨', desc: 'Procedimentos faciais, corporais, laser e peelings' },
  { id: 'clinic', labelKey: 'onboarding.segment_clinic', icon: '🩺', desc: 'Fisioterapia, nutrição, dermatologia e consultas' },
];

export default function OnboardingPage() {
  const { t } = useTranslation();
  const { currentCompany, updateCompany } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    name: currentCompany.name,
    trade_name: currentCompany.trade_name,
    document: currentCompany.document,
    segment: currentCompany.segment,
    slug: currentCompany.slug,
    phone: currentCompany.phone,
    theme_color: currentCompany.theme_color,
  });

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${formData.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCompany = () => {
    updateCompany({
      name: formData.name,
      trade_name: formData.trade_name,
      document: formData.document,
      segment: formData.segment,
      slug: formData.slug,
      phone: formData.phone,
      theme_color: formData.theme_color,
    });
    setStep(step + 1);
  };

  const stepsHeader = [
    { num: 1, title: t('onboarding.step_company') },
    { num: 2, title: t('onboarding.step_units') },
    { num: 3, title: t('onboarding.step_services') },
    { num: 4, title: t('onboarding.step_team') },
    { num: 5, title: t('onboarding.step_ready') },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider">
          <span>Configuração Guiada</span>
          <span aria-hidden="true">·</span>
          <span>Etapa 1 de Fundação</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2.5">
          <Compass className="w-6 h-6 text-teal-700" />
          {t('onboarding.title')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('onboarding.subtitle')}
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {stepsHeader.map((s) => {
          const isDone = s.num < step;
          const isCurrent = s.num === step;
          return (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                isCurrent
                  ? 'border-teal-700 bg-teal-50/70 font-semibold text-teal-950 shadow-2xs'
                  : isDone
                  ? 'border-slate-200 bg-emerald-50/40 text-emerald-900'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isCurrent ? 'bg-teal-700 text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>
                    {s.num}
                  </span>
                )}
                <span className="truncate">{s.title.split('. ')[1]}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Content Container */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        {/* Step 1: Company Profile & Segment */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900">
              {t('onboarding.step_company')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('onboarding.company_name')}
                </label>
                <input
                  type="text"
                  value={formData.trade_name}
                  onChange={(e) => setFormData({ ...formData, trade_name: e.target.value, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-teal-600 focus:outline-hidden"
                  placeholder="Ex: Naturo SPA & Terapias"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('onboarding.document')}
                </label>
                <input
                  type="text"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-teal-600 focus:outline-hidden"
                  placeholder="00.000.000/0001-00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slug do Link Público (URL amigável)
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-slate-400 bg-slate-100 px-3 py-2 border border-r-0 border-slate-200 rounded-l-lg">
                    totalcorp.app/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-r-lg focus:border-teal-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('onboarding.theme_color')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.theme_color}
                    onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                    className="w-10 h-8 rounded border border-slate-200 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-600 uppercase">{formData.theme_color}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                {t('onboarding.segment')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SEGMENTS.map((seg) => (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, segment: seg.id })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.segment === seg.id
                        ? 'border-teal-700 bg-teal-50/70 text-teal-950 font-semibold ring-1 ring-teal-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-lg mb-1">{seg.icon}</div>
                    <div className="text-xs font-bold">{t(seg.labelKey)}</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">{seg.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveCompany}
                className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
              >
                <span>Avançar para Unidades</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Units & Hours */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900">
              {t('onboarding.step_units')}
            </h2>
            <p className="text-xs text-slate-600">
              Configure as filiais físicas da sua empresa. Cada unidade possui horários de funcionamento, feriados locais e fuso horário próprio.
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-teal-200 bg-teal-50/30 flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-700" />
                    <span>Unidade Jardins (Matriz)</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Ativa</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Alameda Lorena, 1420 · Jardins, São Paulo - SP
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Fuso: America/Sao_Paulo · Seg a Sáb das 08h às 21h
                  </div>
                </div>
                <button className="text-xs font-semibold text-teal-700 hover:underline">Editar Horários</button>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-white flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-700" />
                    <span>Unidade Moema (Filial 2)</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Ativa</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Avenida Ibirapuera, 2840 · Moema, São Paulo - SP
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Fuso: America/Sao_Paulo · Ter a Dom das 09h às 20h
                  </div>
                </div>
                <button className="text-xs font-semibold text-teal-700 hover:underline">Editar Horários</button>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
              >
                <span>Avançar para Catálogo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Services */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900">
              {t('onboarding.step_services')}
            </h2>
            <p className="text-xs text-slate-600">
              Catálogo de serviços pré-carregado com os melhores protocolos para <strong>{SEGMENTS.find(s => s.id === formData.segment)?.labelKey ? t(SEGMENTS.find(s => s.id === formData.segment)!.labelKey) : 'Spa'}</strong>:
            </p>

            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">Massagem Relaxante com Aromaterapia</div>
                  <div className="text-[11px] text-slate-500">60 min · 15 min buffer · R$ 220,00</div>
                </div>
                <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Online</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">Terapia das Pedras Quentes Vulcânicas</div>
                  <div className="text-[11px] text-slate-500">80 min · 15 min buffer · R$ 290,00 · Exige sinal R$ 50</div>
                </div>
                <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Online</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">Limpeza de Pele Profunda com Fotobiomodulação</div>
                  <div className="text-[11px] text-slate-500">75 min · 15 min buffer · R$ 260,00</div>
                </div>
                <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Online</span>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
              >
                <span>Avançar para Equipe</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Team */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900">
              {t('onboarding.step_team')}
            </h2>
            <p className="text-xs text-slate-600">
              Profissionais habilitados para atendimento e percentuais de comissão configurados:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white text-xs">
                <div className="font-bold text-slate-900">Beatriz Lins</div>
                <div className="text-[11px] text-teal-700 font-medium">Terapeuta Corporal</div>
                <div className="text-[11px] text-slate-500 mt-1">Comissão: 40% · Unidades Jardins e Moema</div>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white text-xs">
                <div className="font-bold text-slate-900">Lucas Nogueira</div>
                <div className="text-[11px] text-teal-700 font-medium">Terapeuta Holístico</div>
                <div className="text-[11px] text-slate-500 mt-1">Comissão: 35% · Unidade Jardins</div>
              </div>
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
                type="button"
                onClick={() => setStep(5)}
                className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
              >
                <span>{t('onboarding.finish_cta')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Ready & Public Page */}
        {step === 5 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Parabéns! Sua empresa está configurada no Total Corp.
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                {t('onboarding.public_link_ready')}
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono">
                <span className="text-teal-800 truncate font-semibold">
                  {window.location.origin}/{formData.slug}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 text-slate-600 hover:text-teal-800 font-sans font-medium text-xs ml-2 shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copiado!' : t('onboarding.copy_link')}</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <Link
                  to={`/${formData.slug}`}
                  target="_blank"
                  className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{t('onboarding.open_public_page')}</span>
                </Link>

                <button
                  onClick={() => alert(`QR Code gerado para o link público da empresa: ${window.location.origin}/${formData.slug}`)}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <QrCode className="w-4 h-4 text-teal-700" />
                  <span>Gerar QR Code</span>
                </button>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-xs font-semibold text-teal-800 hover:text-teal-950 underline"
              >
                <span>Ir para o Painel de Controle Principal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
