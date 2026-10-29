import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { whatsappEngine, INITIAL_TEMPLATES } from '../../services/messaging/whatsappEngine';
import { MessageTemplate, TriggerEvent, MessageLogItem } from '../../services/messaging/types';
import {
  MessageSquare,
  Sparkles,
  Send,
  CheckCheck,
  Clock,
  ShieldCheck,
  Smartphone,
  Check,
  AlertCircle,
  Settings,
  ListFilter,
  User,
  Phone,
  RefreshCw,
  Play,
  CheckCircle2
} from 'lucide-react';

export default function MessagingCenter() {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();

  const [activeTab, setActiveTab] = useState<'templates' | 'logs' | 'inbox' | 'simulator' | 'settings'>('templates');
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => whatsappEngine.getTemplates(currentCompany.id));
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate>(templates[0] || INITIAL_TEMPLATES[0]);
  const [previewContent, setPreviewContent] = useState<string>(selectedTemplate.content);

  // Simulator state
  const [simPhone, setSimPhone] = useState<string>('(41) 99123-4567');
  const [simName, setSimName] = useState<string>('Helena Ribeiro');
  const [simMessage, setSimMessage] = useState<string>('1');
  const [simLog, setSimLog] = useState<{ reply: string; action: string } | null>(null);

  // Manual chat reply state
  const [manualReplyText, setManualReplyText] = useState<string>('');

  const [refreshKey, setRefreshKey] = useState(0);

  const logs = whatsappEngine.getLogs(currentCompany.id);
  const chats = whatsappEngine.getChats(currentCompany.id);

  const compiledPreview = whatsappEngine.compileText(previewContent, {
    nome: 'Helena Ribeiro',
    servico: 'Toque Integrativo Corporal',
    data: '25/10/2026',
    hora: '14:30',
    profissional: 'Beatriz Lins',
    link_remarcar: `${window.location.origin}/naturo-spa?action=reschedule`,
    link_avaliar: `${window.location.origin}/naturo-spa?action=review`,
    endereco: 'Rua Nunes Machado, 68 - The Five, Curitiba',
  });

  const handleSaveTemplate = () => {
    whatsappEngine.updateTemplate(selectedTemplate.id, { content: previewContent });
    setTemplates(whatsappEngine.getTemplates(currentCompany.id));
    alert('Template atualizado e salvo com sucesso!');
  };

  const handleTestDispatch = async () => {
    const res = await whatsappEngine.dispatchTrigger({
      company_id: currentCompany.id,
      event: selectedTemplate.event,
      recipient_phone: simPhone,
      recipient_name: simName,
      vars: {
        nome: simName,
        servico: 'Toque Integrativo Corporal',
        data: '25/10/2026',
        hora: '14:30',
        profissional: 'Beatriz Lins',
      },
      forceImmediate: true,
    });

    if (res.success) {
      alert(`Disparo de teste enviado com sucesso para ${simPhone}! Confira na aba Caixa de Entrada ou Logs.`);
      setRefreshKey(k => k + 1);
    } else {
      alert(`Não foi possível enviar: ${res.reason}`);
    }
  };

  const handleSimulateClientReply = (e: React.FormEvent) => {
    e.preventDefault();
    const result = whatsappEngine.handleIncomingWebhook({
      company_id: currentCompany.id,
      client_phone: simPhone,
      client_name: simName,
      text: simMessage,
      linked_appointment_id: 'apt_001',
    });

    setSimLog({
      reply: result.reply,
      action: result.action_taken,
    });
    setRefreshKey(k => k + 1);
  };

  const handleSendManualReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReplyText.trim()) return;

    whatsappEngine.dispatchTrigger({
      company_id: currentCompany.id,
      event: 'appointment_created',
      recipient_phone: simPhone,
      recipient_name: simName,
      vars: { nome: simName },
      forceImmediate: true,
    });

    setManualReplyText('');
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            {currentCompany.name} · Comunicação Automática
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-teal-700" />
            WhatsApp & Mensagens Inteligentes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lembretes 24h e 2h antes, confirmação rápida via webhook, pesquisa NPS e respeito a opt-out LGPD
          </p>
        </div>

        {/* WhatsApp Provider Status Pill */}
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Meta Cloud API: Conectada</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'templates' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Templates de Mensagem
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1 ${
            activeTab === 'inbox' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Caixa de Entrada / Chat</span>
          <span className="text-[10px] bg-teal-700 text-white px-1.5 py-0.2 rounded-full font-bold">
            {chats.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'logs' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Fila & Histórico de Disparos
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1 ${
            activeTab === 'simulator' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Play className="w-3.5 h-3.5 text-teal-700" />
          <span>Simulador de Respostas do Cliente</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'settings' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Regras & Janelas de Envio
        </button>
      </div>

      {/* TAB 1: TEMPLATES & REALISTIC PHONE PREVIEW */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Templates Selector & Editor (Col 7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selecione o Gatilho Automático:
                </label>
                <div className="space-y-1.5">
                  {templates.map((tmpl) => {
                    const isSelected = selectedTemplate.id === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => {
                          setSelectedTemplate(tmpl);
                          setPreviewContent(tmpl.content);
                        }}
                        className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-teal-700 bg-teal-50/60 font-semibold text-teal-950 ring-1 ring-teal-700'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900">{tmpl.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Gatilho: <span className="font-mono text-teal-800">{tmpl.event}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          {tmpl.meta_template_status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Conteúdo da Mensagem (com variáveis dinâmicas):
                  </label>
                  <span className="text-[10px] text-slate-400">Variáveis: {'{{nome}}, {{servico}}, {{data}}, {{hora}}, {{profissional}}'}</span>
                </div>
                <textarea
                  rows={6}
                  value={previewContent}
                  onChange={(e) => setPreviewContent(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:border-teal-600 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestDispatch}
                  className="flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Testar Disparo Agora</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>

          {/* Realistic WhatsApp Phone Mockup (Col 5) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-[310px] bg-slate-900 rounded-[38px] p-3 shadow-2xl border-4 border-slate-700">
              {/* Speaker / Camera Notch */}
              <div className="h-4 w-28 bg-slate-800 rounded-full mx-auto mb-2" />

              {/* Screen Header */}
              <div className="bg-[#075E54] text-white p-3 rounded-t-2xl flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                  N
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-bold">Naturo SPA Oficial</div>
                  <div className="text-[9px] opacity-80">Conta Comercial Verificada</div>
                </div>
              </div>

              {/* Chat Bubble Body */}
              <div className="bg-[#ECE5DD] min-h-[360px] p-3 rounded-b-2xl flex flex-col justify-end space-y-2">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-xs text-[11px] text-slate-800 max-w-[92%] leading-relaxed whitespace-pre-wrap border border-slate-200/60">
                  {compiledPreview}
                  <div className="text-right text-[9px] text-slate-400 mt-1 flex items-center justify-end gap-1 font-mono">
                    <span>14:30</span>
                    <CheckCheck className="w-3 h-3 text-[#34B7F1]" />
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-500 py-1 font-medium">
                  Criptografia de ponta a ponta
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INBOX & TWO-WAY RECEPTION CHAT */}
      {activeTab === 'inbox' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-[520px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold text-slate-900">Conversa com {simName} ({simPhone})</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Canal Oficial WhatsApp
            </span>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
            {chats.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-xl text-xs leading-relaxed shadow-2xs ${
                    msg.direction === 'outbound'
                      ? 'bg-teal-700 text-white rounded-br-none'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div className={`text-[9px] text-right mt-1 font-mono ${msg.direction === 'outbound' ? 'text-teal-200' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Reply Bar */}
          <form onSubmit={handleSendManualReply} className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input
              type="text"
              value={manualReplyText}
              onChange={(e) => setManualReplyText(e.target.value)}
              placeholder="Digite uma mensagem da recepção para o WhatsApp do cliente..."
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-teal-600 focus:outline-hidden"
            />
            <button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: LOGS & AUDIT TRAIL */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Histórico de Disparos em Tempo Real
            </h3>
            <span className="text-xs text-slate-500 font-mono">{logs.length} registros</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Destinatário</th>
                <th className="py-3 px-4">Evento</th>
                <th className="py-3 px-4">Mensagem Enviada</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{log.recipient_name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{log.recipient_phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-teal-800 text-[11px] font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {log.event}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                    {log.body}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Entregue</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500">
                    {new Date(log.sent_at).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: SIMULATOR (TEST "1", "2", "PARAR") */}
      {activeTab === 'simulator' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6 max-w-2xl mx-auto">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Play className="w-5 h-5 text-teal-700" />
              Simulador de Respostas do Cliente (Webhook WhatsApp)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Teste interativamente como o sistema reage quando o cliente envia <strong>"1"</strong> (confirma agendamento), <strong>"2"</strong> (solicita remarcação) ou <strong>"PARAR"</strong> (opt-out LGPD).
            </p>
          </div>

          <form onSubmit={handleSimulateClientReply} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Telefone do Cliente:</label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Cliente:</label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Resposta enviada pelo Cliente pelo WhatsApp:
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setSimMessage('1')}
                  className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md"
                >
                  Testar "1" (Confirmar)
                </button>
                <button
                  type="button"
                  onClick={() => setSimMessage('2')}
                  className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 rounded-md"
                >
                  Testar "2" (Remarcar)
                </button>
                <button
                  type="button"
                  onClick={() => setSimMessage('PARAR')}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 rounded-md"
                >
                  Testar "PARAR" (LGPD)
                </button>
              </div>

              <input
                type="text"
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                placeholder="Ex: 1, 2, PARAR ou uma dúvida..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-2.5 rounded-lg shadow-xs transition-colors"
            >
              Disparar Webhook & Processar Resposta
            </button>
          </form>

          {/* Feedback Output */}
          {simLog && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Resultado do Processamento Webhook:</span>
              </div>
              <div className="text-slate-700">
                <strong>Ação tomada pelo sistema:</strong> {simLog.action}
              </div>
              <div className="text-slate-700">
                <strong>Resposta enviada automaticamente pelo bot:</strong>
                <div className="mt-1 p-2.5 bg-white border border-slate-200 rounded-lg text-teal-900 font-medium">
                  {simLog.reply}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SETTINGS & COMPLIANCE RULES */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6 max-w-2xl mx-auto">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-teal-700" />
              Regras de Envio & Conformidade LGPD
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configurações para evitar bloqueios de chip, limitar frequência e respeitar horários de descanso.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">Janela de Horário Permitido:</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Início:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">08:00</span>
                </div>
                <span>até</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Término:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">20:30</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Mensagens geradas fora desse horário são enfileiradas automaticamente para o dia seguinte às 08:05.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">Limite Anti-Spam por Cliente:</div>
              <div className="text-slate-700">Máximo de <strong>2 mensagens automáticas por dia</strong> por cliente.</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Base Legal & Opt-Out (LGPD):</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Todos os templates de lembrete incluem automaticamente o sufixo <em>"Para não receber mais mensagens, responda PARAR."</em> O recebimento da palavra-chave bloqueia qualquer disparo futuro até solicitação explícita de retorno.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
