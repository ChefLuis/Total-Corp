import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { corporateEngine } from '../../services/corporate/corporateEngine';
import { PartnerCompany, CorporateBeneficiary, CorporateUsage, CorporateInvoice, CorporateAgreementType } from '../../services/corporate/types';
import { formatCurrency } from '../../utils/currency';
import {
  Building,
  Plus,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  Mail,
  Phone,
  UserCheck,
  Download,
  Users,
  Sparkles,
  X,
  Check,
  ExternalLink
} from 'lucide-react';

export default function CorporatePage() {
  const { t, i18n } = useTranslation();
  const { currentCompany } = useAuth();
  const { canAccess } = useRBAC();

  const [activeTab, setActiveTab] = useState<'partners' | 'invoices' | 'beneficiaries' | 'usages' | 'events'>('partners');
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [isNewPartnerModalOpen, setIsNewPartnerModalOpen] = useState(false);
  const [isNewBenModalOpen, setIsNewBenModalOpen] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<CorporateInvoice | null>(null);

  // New partner form
  const [pTradeName, setPTradeName] = useState('');
  const [pLegalName, setPLegalName] = useState('');
  const [pCnpj, setPCnpj] = useState('');
  const [pContactPerson, setPContactPerson] = useState('');
  const [pContactEmail, setPContactEmail] = useState('');
  const [pContactPhone, setPContactPhone] = useState('');
  const [pAgreementType, setPAgreementType] = useState<CorporateAgreementType>('subsidy_percentage');
  const [pSubsidy, setPSubsidy] = useState('50');

  // New beneficiary form
  const [benName, setBenName] = useState('');
  const [benPartnerId, setBenPartnerId] = useState('');
  const [benIdentifier, setBenIdentifier] = useState('');
  const [benEmail, setBenEmail] = useState('');
  const [benPhone, setBenPhone] = useState('');

  const partners = corporateEngine.getPartners(currentCompany.id);
  const invoices = corporateEngine.getInvoices(selectedPartnerFilter);
  const beneficiaries = corporateEngine.getBeneficiaries(selectedPartnerFilter);
  const usages = corporateEngine.getUsages(selectedPartnerFilter);

  const totalInvoicedCents = invoices.reduce((acc, i) => acc + i.total_cents, 0);

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTradeName.trim() || !pCnpj.trim()) return;

    corporateEngine.addPartner({
      company_id: currentCompany.id,
      name: pLegalName.trim() || pTradeName.trim(),
      trade_name: pTradeName.trim(),
      cnpj: pCnpj.trim(),
      contact_person: pContactPerson.trim(),
      contact_email: pContactEmail.trim(),
      contact_phone: pContactPhone.trim(),
      agreement_type: pAgreementType,
      subsidy_percentage: Number(pSubsidy) || 0,
      active: true,
    });

    setIsNewPartnerModalOpen(false);
    setPTradeName('');
    setPCnpj('');
    setRefreshKey(k => k + 1);
  };

  const handleCreateBeneficiary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!benName.trim() || !benPartnerId) return;

    corporateEngine.addBeneficiary({
      partner_id: benPartnerId,
      name: benName.trim(),
      identifier: benIdentifier.trim() || 'Matrícula Pendente',
      email: benEmail.trim(),
      phone: benPhone.trim(),
      active: true,
    });

    setIsNewBenModalOpen(false);
    setBenName('');
    setBenIdentifier('');
    setRefreshKey(k => k + 1);
  };

  const handleMarkInvoicePaid = (invId: string) => {
    corporateEngine.markInvoiceAsPaid(invId);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            {currentCompany.name} · Módulo Corporativo (B2B)
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            <Building className="w-6 h-6 text-teal-700" />
            <span>Gestão de Convênios & Contratos B2B</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Empresas conveniadas, subsídios corporativos, controle de colaboradores/hóspedes e faturamento mensal consolidado
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (partners.length > 0) setBenPartnerId(partners[0].id);
              setIsNewBenModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <UserCheck className="w-4 h-4 text-teal-700" />
            <span>+ Novo Beneficiário</span>
          </button>

          <button
            onClick={() => setIsNewPartnerModalOpen(true)}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Convênio Corporativo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Empresas Parceiras Ativas</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {partners.length} Contratos
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">
            Hotel NH The Five, Condomínio The Five e empresas vizinhas
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Faturamento B2B em Aberto / Faturado</div>
          <div className="text-2xl font-bold text-teal-800 font-mono tabular-nums">
            {formatCurrency(totalInvoicedCents, i18n.language)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Faturas consolidadas do mês de Outubro</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Beneficiários Habilitados</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {beneficiaries.length} Cadastrados
          </div>
          <div className="text-[11px] text-emerald-800 font-medium mt-1">
            Hóspedes, moradores e colaboradores credenciados
          </div>
        </div>
      </div>

      {/* Subtabs Switcher */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('partners')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'partners' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Empresas Conveniadas ({partners.length})
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'invoices' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Faturas Mensais B2B</span>
          <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-full">
            {invoices.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('beneficiaries')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'beneficiaries' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Beneficiários Elegíveis</span>
          <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full">
            {beneficiaries.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('usages')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'usages' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Utilizações & Atendimentos</span>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
            {usages.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'events' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Quick Massage In-Company
        </button>
      </div>

      {/* TAB 1: EMPRESAS CONVENIADAS */}
      {activeTab === 'partners' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {partners.map((partner) => (
            <div key={partner.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-sm border border-teal-200">
                    <Building className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{partner.trade_name}</h3>
                    <div className="text-[11px] font-mono text-slate-500">CNPJ: {partner.cnpj}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Ativo
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="font-semibold text-slate-700">Modelo de Benefício / Convênio:</div>
                <div className="text-teal-900 font-bold">
                  {partner.agreement_type === 'full_monthly_invoice' && '100% Faturado no Fim do Mês'}
                  {partner.agreement_type === 'subsidy_percentage' && `Subsídio Corporativo de ${partner.subsidy_percentage}%`}
                  {partner.agreement_type === 'exclusive_discount' && 'Desconto Fixo em Folha'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {partner.agreement_type === 'subsidy_percentage' && 'O colaborador paga apenas a coparticipação no atendimento'}
                  {partner.agreement_type === 'full_monthly_invoice' && 'Cobrança unificada contra o CNPJ com demonstrativo discriminado'}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{partner.contact_person}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{partner.contact_email}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{partner.contact_phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: FATURAS MENSAIS B2B */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Faturamento Mensal Unificado para Empresas Conveniadas
              </h2>
              <p className="text-xs text-slate-500">
                Faturas consolidadas de atendimentos para emissão de boleto e envio ao financeiro da contratante
              </p>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Empresa Conveniada</th>
                <th className="py-3 px-4">Mês Referência</th>
                <th className="py-3 px-4 text-center">Sessões Realizadas</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4 text-right">Valor Total Faturado</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{inv.partner_name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{inv.month_reference}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700">{inv.usages_count}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{inv.due_date}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-teal-900 text-sm tabular-nums">
                    {formatCurrency(inv.total_cents, i18n.language)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {inv.status === 'paid' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pago</span>
                      </span>
                    )}
                    {inv.status === 'invoiced' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Boleto Emitido</span>
                      </span>
                    )}
                    {inv.status === 'open' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Em Aberto</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedInvoiceForView(inv)}
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md transition-colors"
                      >
                        Ver Detalhes
                      </button>
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => handleMarkInvoicePaid(inv.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                        >
                          Liquidar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: BENEFICIÁRIOS ELEGÍVEIS */}
      {activeTab === 'beneficiaries' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Colaboradores, Hóspedes e Moradores Credenciados
            </h3>
            <span className="text-xs text-slate-500 font-mono">{beneficiaries.length} cadastros</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Nome do Beneficiário</th>
                <th className="py-3 px-4">Empresa / Residencial</th>
                <th className="py-3 px-4">Identificador (Quarto / Matrícula / CPF)</th>
                <th className="py-3 px-4">Contato</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {beneficiaries.map((ben) => {
                const partner = partners.find(p => p.id === ben.partner_id);
                return (
                  <tr key={ben.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{ben.name}</td>
                    <td className="py-3 px-4 text-slate-700">{partner?.trade_name}</td>
                    <td className="py-3 px-4 font-mono text-teal-800">{ben.identifier}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {ben.phone} · {ben.email}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Apto a Utilizar</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: EXTRATO DE UTILIZAÇÕES CORPORATIVAS */}
      {activeTab === 'usages' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Histórico de Atendimentos Vinculados a Convênios
            </h3>
            <span className="text-xs text-slate-500 font-mono">{usages.length} sessões</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Empresa Conveniada</th>
                <th className="py-3 px-4">Beneficiário</th>
                <th className="py-3 px-4">Serviço Realizado</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-right">Subsídio Empresa</th>
                <th className="py-3 px-4 text-right">Coparticipação Colaborador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usages.map((use) => (
                <tr key={use.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500">{use.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{use.partner_name}</td>
                  <td className="py-3 px-4 text-slate-700">{use.beneficiary_name}</td>
                  <td className="py-3 px-4 text-teal-900">{use.service_name}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {formatCurrency(use.total_value_cents, i18n.language)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-teal-800">
                    {formatCurrency(use.subsidy_cents, i18n.language)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                    {formatCurrency(use.copay_cents, i18n.language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: QUICK MASSAGE IN-COMPANY */}
      {activeTab === 'events' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6 max-w-2xl mx-auto">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-700" />
              Visitas In-Company & Quick Massage Corporativa
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Desloque terapeutas da equipe do Spa até a sede de clientes corporativos (Vanguarda Tech, escritórios do Batel, eventos de convenção) para sessões rápidas de 15 a 30 minutos em cadeira ergonômica.
            </p>
          </div>

          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2 text-xs text-teal-950">
            <div className="font-bold">Próxima Visita Agendada:</div>
            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-teal-200">
              <div>
                <div className="font-bold text-slate-900">Vanguarda Tech Soluções</div>
                <div className="text-[11px] text-slate-500">
                  Data: 24/10/2026 · 14h às 18h (Carga de 4 horas)
                </div>
                <div className="text-[11px] text-teal-800 font-medium mt-0.5">
                  Terapeutas Escalados: Camila Santos e Roberto Alves
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-teal-900">
                R$ 1.600,00 faturado
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Contratos in-company são faturados automaticamente na Fatura B2B da empresa ao final do mês, e a comissão dos terapeutas escalados é integrada à folha quinzenal.
          </div>
        </div>
      )}

      {/* MODAL: NOVO CONVÊNIO */}
      {isNewPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Novo Convênio Corporativo</h2>
              <button onClick={() => setIsNewPartnerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome Fantasia:</label>
                  <input
                    type="text"
                    required
                    value={pTradeName}
                    onChange={(e) => setPTradeName(e.target.value)}
                    placeholder="Ex: Condomínio Batel Prime"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CNPJ:</label>
                  <input
                    type="text"
                    required
                    value={pCnpj}
                    onChange={(e) => setPCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Razão Social:</label>
                <input
                  type="text"
                  value={pLegalName}
                  onChange={(e) => setPLegalName(e.target.value)}
                  placeholder="Nome empresarial completo"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Convênio:</label>
                  <select
                    value={pAgreementType}
                    onChange={(e) => setPAgreementType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="subsidy_percentage">Subsídio Parcial (% pago pela empresa)</option>
                    <option value="full_monthly_invoice">100% Faturado no Fim do Mês</option>
                    <option value="exclusive_discount">Desconto Exclusivo em Folha</option>
                  </select>
                </div>
                {pAgreementType === 'subsidy_percentage' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">% Subsídio da Empresa:</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={pSubsidy}
                      onChange={(e) => setPSubsidy(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pessoa de Contato / RH:</label>
                  <input
                    type="text"
                    value={pContactPerson}
                    onChange={(e) => setPContactPerson(e.target.value)}
                    placeholder="Nome do gestor ou concierge"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-mail para Faturamento:</label>
                  <input
                    type="email"
                    value={pContactEmail}
                    onChange={(e) => setPContactEmail(e.target.value)}
                    placeholder="financeiro@empresa.com.br"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPartnerModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Salvar Convênio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO BENEFICIÁRIO */}
      {isNewBenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Novo Beneficiário Elegível</h2>
              <button onClick={() => setIsNewBenModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBeneficiary} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Empresa / Residencial:</label>
                <select
                  value={benPartnerId}
                  onChange={(e) => setBenPartnerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.trade_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo:</label>
                <input
                  type="text"
                  required
                  value={benName}
                  onChange={(e) => setBenName(e.target.value)}
                  placeholder="Nome do colaborador ou hóspede"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Identificador (Quarto / Matrícula / CPF):</label>
                <input
                  type="text"
                  required
                  value={benIdentifier}
                  onChange={(e) => setBenIdentifier(e.target.value)}
                  placeholder="Ex: Quarto 1204, Matrícula VT-901 ou CPF"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone WhatsApp:</label>
                  <input
                    type="text"
                    value={benPhone}
                    onChange={(e) => setBenPhone(e.target.value)}
                    placeholder="(41) 99999-0000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-mail Corporativo:</label>
                  <input
                    type="email"
                    value={benEmail}
                    onChange={(e) => setBenEmail(e.target.value)}
                    placeholder="colaborador@empresa.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewBenModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Cadastrar Beneficiário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXTRATO DA FATURA B2B */}
      {selectedInvoiceForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-700" />
                <h2 className="text-base font-bold text-slate-900">Extrato Consolidado da Fatura B2B</h2>
              </div>
              <button onClick={() => setSelectedInvoiceForView(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{selectedInvoiceForView.partner_name}</div>
                  <div className="text-[11px] text-slate-500">Mês Referência: {selectedInvoiceForView.month_reference}</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-teal-900">
                    {formatCurrency(selectedInvoiceForView.total_cents, i18n.language)}
                  </span>
                  <div className="text-[11px] text-slate-500">{selectedInvoiceForView.usages_count} sessões incluídas</div>
                </div>
              </div>

              {selectedInvoiceForView.boleto_barcode && (
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Linha Digitável do Boleto Bancário:</span>
                  <div className="font-mono text-slate-800 text-[11px] break-all select-all">
                    {selectedInvoiceForView.boleto_barcode}
                  </div>
                </div>
              )}

              <div className="text-slate-500 text-[11px]">
                Esta fatura inclui a discriminação completa de cada hóspede / colaborador atendido no Naturo SPA durante o período contratado, pronta para aprovação e liquidação pelo departamento financeiro da empresa conveniada.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Imprimir Fatura</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForView(null)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
