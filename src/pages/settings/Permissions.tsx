import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { AppRole, Resource, Action, DEFAULT_ROLE_PERMISSIONS } from '../../types/rbac';
import { Shield, Check, X, Info, Sparkles, Building, Lock } from 'lucide-react';

const RESOURCES: { id: Resource; label: string; description: string }[] = [
  { id: 'dashboard', label: 'Painel Inicial', description: 'Visualização de métricas e alertas da empresa' },
  { id: 'appointments', label: 'Agenda & Agendamentos', description: 'Visualização, criação, reagendamento e cancelamento de horários' },
  { id: 'clients', label: 'Gestão de Clientes (CRM)', description: 'Ficha completa, histórico, anamnese, tags e consentimentos LGPD' },
  { id: 'services', label: 'Catálogo de Serviços', description: 'Durações, preços, categorias e profissionais habilitados' },
  { id: 'team', label: 'Equipe & Profissionais', description: 'Escalas de trabalho, horários, folgas e especialidades' },
  { id: 'financial', label: 'Financeiro & Caixa', description: 'Lançamentos, contas a pagar/receber, fechamento de caixa e DRE' },
  { id: 'commissions', label: 'Comissões', description: 'Regras de comissão, extrato individual e fechamento mensal' },
  { id: 'inventory', label: 'Estoque & Compras', description: 'Entradas/saídas de produtos, alertas de mínimo e fornecedores' },
  { id: 'marketing', label: 'Marketing & Fidelidade', description: 'Cupons, programa de pontos, campanhas e disparos WhatsApp' },
  { id: 'subscriptions', label: 'Assinaturas & Pacotes', description: 'Clubes recorrentes, pacotes de sessões e cobrança corporativa B2B' },
  { id: 'settings', label: 'Configurações da Empresa', description: 'Unidades, dados fiscais, usuários e integrações com gateways' },
];

const ROLES_LIST: { id: AppRole; nameKey: string; color: string }[] = [
  { id: 'owner', nameKey: 'roles.owner', color: 'bg-teal-700 text-white' },
  { id: 'manager', nameKey: 'roles.manager', color: 'bg-cyan-700 text-white' },
  { id: 'receptionist', nameKey: 'roles.receptionist', color: 'bg-emerald-700 text-white' },
  { id: 'professional', nameKey: 'roles.professional', color: 'bg-violet-700 text-white' },
  { id: 'financial', nameKey: 'roles.financial', color: 'bg-amber-700 text-white' },
  { id: 'super_admin', nameKey: 'roles.super_admin', color: 'bg-slate-900 text-white' },
];

export default function PermissionsPage() {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const { role, hasPermission } = useRBAC();
  const { setActiveRole } = useAuth();

  const checkRoleResourceAccess = (r: AppRole, resource: Resource): { read: boolean; write: boolean; full: boolean } => {
    const permissions = DEFAULT_ROLE_PERMISSIONS[r] || [];
    const isSuper = permissions.includes('super_admin:*' as any) || permissions.includes('*' as any);
    if (isSuper) return { read: true, write: true, full: true };

    const hasResAll = permissions.includes(`${resource}:*` as any);
    if (hasResAll) return { read: true, write: true, full: true };

    const hasRead = permissions.includes(`${resource}:read` as any) || permissions.includes(`${resource}:view_own` as any);
    const hasWrite = permissions.includes(`${resource}:write` as any);

    return { read: hasRead, write: hasWrite, full: false };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider">
          <span>{currentCompany.name}</span>
          <span aria-hidden="true">·</span>
          <span>Segurança & Conformidade</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2.5">
          <Shield className="w-6 h-6 text-teal-700" />
          {t('permissions_matrix.title')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('permissions_matrix.subtitle')}
        </p>
      </div>

      {/* Role Selector Tabs for Quick Audit */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-teal-700" />
          <span>Auditar e Simular Papel Ativo:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ROLES_LIST.map((item) => {
            const isSelected = role === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveRole(item.id)}
                className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                  isSelected
                    ? 'border-teal-700 bg-teal-50/70 text-teal-950 ring-1 ring-teal-700 font-semibold shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{t(item.nameKey)}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Security Architecture Explainer Note */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 flex items-start gap-3">
        <Lock className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-900">
            Isolamento Criptográfico e Row Level Security (RLS)
          </div>
          <p className="text-slate-600 leading-relaxed">
            Todas as tabelas de negócio possuem a coluna <code>company_id</code> indexada. O token JWT do usuário injeta o identificador da empresa na sessão do PostgreSQL via <code>app.current_company_id</code>. Consultas de um tenant jamais alcançam registros de outro, mesmo em caso de requisição forjada no cliente.
          </p>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Matriz de Acesso: {t(`roles.${role}`)}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Módulo / Recurso</th>
                <th className="py-3 px-4">Descrição de Acesso</th>
                <th className="py-3 px-4 text-center">Visualizar (Read)</th>
                <th className="py-3 px-4 text-center">Modificar (Write)</th>
                <th className="py-3 px-4 text-center">Controle Total (*)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RESOURCES.map((res) => {
                const access = checkRoleResourceAccess(role, res.id);
                return (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {res.label}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {res.description}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {access.read ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3 h-3" /> Permitido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <X className="w-3 h-3" /> Bloqueado
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {access.write || access.full ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3 h-3" /> Permitido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <X className="w-3 h-3" /> Bloqueado
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {access.full ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          <Check className="w-3 h-3" /> Total
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
