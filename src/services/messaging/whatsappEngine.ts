import { todayISO } from '../../utils/dates';
import {
  MessageTemplate,
  MessageQueueItem,
  MessageLogItem,
  IncomingChatMessage,
  TriggerEvent,
  MessageStatus,
  WhatsAppProviderAdapter
} from './types';
import { calendarEngine } from '../calendarEngine';

export const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tmpl_apt_created',
    company_id: 'comp_naturo_spa_01',
    name: 'Confirmação Imediata de Agendamento',
    event: 'appointment_created',
    channel: 'whatsapp',
    content: 'Olá, {{nome}}! 🌿 Seu atendimento de *{{servico}}* no Naturo SPA está pré-agendado para *{{data}} às {{hora}}* com *{{profissional}}*.\n\n📍 Endereço: {{endereco}}\n\nSe precisar reagendar ou cancelar, use o link: {{link_remarcar}}',
    is_active: true,
    meta_template_status: 'APPROVED',
  },
  {
    id: 'tmpl_reminder_24h',
    company_id: 'comp_naturo_spa_01',
    name: 'Lembrete de 24 Horas com Resposta Rápida',
    event: 'reminder_24h',
    channel: 'whatsapp',
    content: 'Olá, {{nome}}! Lembramos do seu atendimento de *{{servico}}* amanhã, *{{data}} às {{hora}}*.\n\nPor favor, responda para confirmar:\n*1* para Confirmar Presença ✅\n*2* se Precisa Remarcar 🔄\n\n_Para não receber mais mensagens, responda PARAR._',
    is_active: true,
    meta_template_status: 'APPROVED',
  },
  {
    id: 'tmpl_reminder_2h',
    company_id: 'comp_naturo_spa_01',
    name: 'Lembrete de 2 Horas e Orientações',
    event: 'reminder_2h',
    channel: 'whatsapp',
    content: 'Olá, {{nome}}! Seu momento de cuidado começa em 2 horas (*{{hora}}*) no Naturo SPA (The Five, 2º andar).\n\nRecomendamos chegar 10 minutos antes para desfrutar do nosso lounge com chá botânico de boas-vindas. Até breve!',
    is_active: true,
    meta_template_status: 'APPROVED',
  },
  {
    id: 'tmpl_review_post',
    company_id: 'comp_naturo_spa_01',
    name: 'Pesquisa de Satisfação & Avaliação Pós-Atendimento',
    event: 'post_service_review',
    channel: 'whatsapp',
    content: 'Olá, {{nome}}! Esperamos que sua experiência com o tratamento *{{servico}}* tenha sido revigorante. ✨\n\nComo foi seu atendimento com *{{profissional}}*? Sua avaliação nos ajuda a evoluir:\n{{link_avaliar}}',
    is_active: true,
    meta_template_status: 'APPROVED',
  },
  {
    id: 'tmpl_birthday',
    company_id: 'comp_naturo_spa_01',
    name: 'Aniversário com Benefício Especial',
    event: 'birthday_greeting',
    channel: 'whatsapp',
    content: 'Feliz Aniversário, {{nome}}! 🎉 O Naturo SPA deseja um novo ciclo com muita harmonia e saúde.\n\nPreparamos um presente especial: 15% de desconto em qualquer ritual de imersão ou massagem durante seu mês de aniversário com o cupom *PARABENS15*.',
    is_active: true,
    meta_template_status: 'APPROVED',
  },
];

class MockWhatsAppProvider implements WhatsAppProviderAdapter {
  name = 'Meta Cloud API (Oficial / Simulado)';

  async sendMessage(toPhone: string, text: string): Promise<{ success: boolean; provider_id?: string; error?: string }> {
    // In production, this would make an authenticated HTTPS request to graph.facebook.com/v19.0/{phone_number_id}/messages
    return {
      success: true,
      provider_id: `wamid_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    };
  }
}

class WhatsAppEngineStore {
  private templates: MessageTemplate[] = [];
  private queue: MessageQueueItem[] = [];
  private logs: MessageLogItem[] = [];
  private chats: IncomingChatMessage[] = [];
  private optOutList: Set<string> = new Set();
  private provider: WhatsAppProviderAdapter = new MockWhatsAppProvider();

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window !== 'undefined') {
      const savedTemplates = localStorage.getItem('totalcorp_msg_templates');
      this.templates = savedTemplates ? JSON.parse(savedTemplates) : [...INITIAL_TEMPLATES];

      const savedQueue = localStorage.getItem('totalcorp_msg_queue');
      this.queue = savedQueue ? JSON.parse(savedQueue) : [];

      const savedLogs = localStorage.getItem('totalcorp_msg_logs');
      this.logs = savedLogs ? JSON.parse(savedLogs) : [
        {
          id: 'log_01',
          company_id: 'comp_naturo_spa_01',
          recipient_phone: '(41) 99123-4567',
          recipient_name: 'Helena Ribeiro Castro',
          event: 'reminder_24h',
          body: 'Lembrete de 24h para Toque Integrativo enviado com sucesso.',
          status: 'read',
          sent_at: `${todayISO(-1)}T14:30:00Z`,
          read_at: `${todayISO(-1)}T14:35:00Z`,
          provider_message_id: 'wamid_sample_01',
        },
      ];

      const savedChats = localStorage.getItem('totalcorp_chats');
      this.chats = savedChats ? JSON.parse(savedChats) : [
        {
          id: 'chat_01',
          company_id: 'comp_naturo_spa_01',
          client_phone: '(41) 99123-4567',
          client_name: 'Helena Ribeiro Castro',
          text: 'Lembramos do seu atendimento de Toque Integrativo amanhã às 13:00. 1 para Confirmar, 2 para Remarcar.',
          direction: 'outbound',
          timestamp: `${todayISO(-1)}T14:30:00Z`,
        },
        {
          id: 'chat_02',
          company_id: 'comp_naturo_spa_01',
          client_phone: '(41) 99123-4567',
          client_name: 'Helena Ribeiro Castro',
          text: '1',
          direction: 'inbound',
          timestamp: `${todayISO(-1)}T14:32:00Z`,
          is_automated_response: true,
          appointment_id: 'apt_001',
        },
        {
          id: 'chat_03',
          company_id: 'comp_naturo_spa_01',
          client_phone: '(41) 99123-4567',
          client_name: 'Helena Ribeiro Castro',
          text: 'Presença confirmada automaticamente com sucesso! Te esperamos no Naturo SPA.',
          direction: 'outbound',
          timestamp: `${todayISO(-1)}T14:32:05Z`,
        },
      ];

      const savedOptOut = localStorage.getItem('totalcorp_opt_out');
      if (savedOptOut) {
        this.optOutList = new Set(JSON.parse(savedOptOut));
      }
    } else {
      this.templates = [...INITIAL_TEMPLATES];
    }
  }

  private persist() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('totalcorp_msg_templates', JSON.stringify(this.templates));
      localStorage.setItem('totalcorp_msg_queue', JSON.stringify(this.queue));
      localStorage.setItem('totalcorp_msg_logs', JSON.stringify(this.logs));
      localStorage.setItem('totalcorp_chats', JSON.stringify(this.chats));
      localStorage.setItem('totalcorp_opt_out', JSON.stringify(Array.from(this.optOutList)));
    }
  }

  public getTemplates(companyId: string): MessageTemplate[] {
    return this.templates.filter((t) => t.company_id === companyId);
  }

  public updateTemplate(id: string, updates: Partial<MessageTemplate>): void {
    this.templates = this.templates.map((t) => (t.id === id ? { ...t, ...updates } : t));
    this.persist();
  }

  public getLogs(companyId: string): MessageLogItem[] {
    return this.logs.filter((l) => l.company_id === companyId);
  }

  public getChats(companyId: string): IncomingChatMessage[] {
    return this.chats.filter((c) => c.company_id === companyId);
  }

  public isOptedOut(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    return this.optOutList.has(cleanPhone);
  }

  public setOptOut(phone: string, optOut: boolean): void {
    const cleanPhone = phone.replace(/\D/g, '');
    if (optOut) {
      this.optOutList.add(cleanPhone);
    } else {
      this.optOutList.delete(cleanPhone);
    }
    this.persist();
  }

  // Compile template replacing {{variaveis}}
  public compileText(
    templateContent: string,
    vars: {
      nome?: string;
      servico?: string;
      data?: string;
      hora?: string;
      profissional?: string;
      link_remarcar?: string;
      link_avaliar?: string;
      endereco?: string;
    }
  ): string {
    let result = templateContent;
    result = result.replace(/\{\{nome\}\}/g, vars.nome || 'Cliente');
    result = result.replace(/\{\{servico\}\}/g, vars.servico || 'Atendimento');
    result = result.replace(/\{\{data\}\}/g, vars.data || '');
    result = result.replace(/\{\{hora\}\}/g, vars.hora || '');
    result = result.replace(/\{\{profissional\}\}/g, vars.profissional || 'Especialista');
    result = result.replace(/\{\{link_remarcar\}\}/g, vars.link_remarcar || 'https://naturospa.com.br/reagendar');
    result = result.replace(/\{\{link_avaliar\}\}/g, vars.link_avaliar || 'https://naturospa.com.br/avaliar');
    result = result.replace(/\{\{endereco\}\}/g, vars.endereco || 'Rua Nunes Machado, 68 - 2º Andar, The Five, Curitiba');
    return result;
  }

  // Check if current hour is within allowed delivery window (08:00 - 20:30)
  public isWithinDeliveryWindow(date: Date = new Date()): boolean {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const totalMinutes = hour * 60 + minute;
    // 08:00 (480 min) to 20:30 (1230 min)
    return totalMinutes >= 480 && totalMinutes <= 1230;
  }

  // Dispatch an automated notification with opt-out check, window check, and provider call
  public async dispatchTrigger(params: {
    company_id: string;
    event: TriggerEvent;
    recipient_phone: string;
    recipient_name: string;
    vars: {
      nome: string;
      servico?: string;
      data?: string;
      hora?: string;
      profissional?: string;
      link_remarcar?: string;
      link_avaliar?: string;
      endereco?: string;
    };
    forceImmediate?: boolean;
  }): Promise<{ success: boolean; reason?: string }> {
    // 1. Opt-out check
    if (this.isOptedOut(params.recipient_phone)) {
      return { success: false, reason: 'Cliente solicitou opt-out (LGPD). Envio cancelado.' };
    }

    // 2. Allowed delivery window check
    if (!params.forceImmediate && !this.isWithinDeliveryWindow()) {
      return { success: false, reason: 'Fora do horário permitido para disparos (08h às 20h30). Mensagem enfileirada.' };
    }

    // 3. Find active template
    const template = this.templates.find((t) => t.company_id === params.company_id && t.event === params.event && t.is_active);
    if (!template) {
      return { success: false, reason: `Nenhum template ativo configurado para o evento "${params.event}".` };
    }

    const compiledText = this.compileText(template.content, params.vars);

    // 4. Send via Provider
    const sendResult = await this.provider.sendMessage(params.recipient_phone, compiledText);

    if (sendResult.success) {
      const nowIso = new Date().toISOString();

      // Log entry
      this.logs.unshift({
        id: `log_${Date.now()}`,
        company_id: params.company_id,
        recipient_phone: params.recipient_phone,
        recipient_name: params.recipient_name,
        event: params.event,
        body: compiledText,
        status: 'delivered',
        sent_at: nowIso,
        provider_message_id: sendResult.provider_id,
      });

      // Add to chat history
      this.chats.push({
        id: `chat_${Date.now()}`,
        company_id: params.company_id,
        client_phone: params.recipient_phone,
        client_name: params.recipient_name,
        text: compiledText,
        direction: 'outbound',
        timestamp: nowIso,
      });

      this.persist();
      return { success: true };
    } else {
      return { success: false, reason: sendResult.error || 'Falha no provedor de envio' };
    }
  }

  // Simulate Incoming Webhook from WhatsApp (e.g. client replies "1", "2", "PARAR" or a question)
  public handleIncomingWebhook(params: {
    company_id: string;
    client_phone: string;
    client_name: string;
    text: string;
    linked_appointment_id?: string;
  }): { reply: string; action_taken: string } {
    const rawText = params.text.trim();
    const cleanLower = rawText.toLowerCase();
    const nowIso = new Date().toISOString();

    // 1. Record incoming chat message
    this.chats.push({
      id: `chat_in_${Date.now()}`,
      company_id: params.company_id,
      client_phone: params.client_phone,
      client_name: params.client_name,
      text: rawText,
      direction: 'inbound',
      timestamp: nowIso,
      appointment_id: params.linked_appointment_id,
    });

    let replyText = '';
    let actionTaken = '';

    // Condition 1: LGPD Opt-out
    if (cleanLower === 'parar' || cleanLower === 'sair' || cleanLower === 'stop') {
      this.setOptOut(params.client_phone, true);
      replyText = 'Você foi descadastrado dos lembretes automáticos do Naturo SPA nos termos da LGPD. Para reativar a qualquer momento, envie QUERO.';
      actionTaken = 'Opt-out registrado com sucesso.';
    }
    // Condition 2: Opt-in reactivation
    else if (cleanLower === 'quero' || cleanLower === 'voltar') {
      this.setOptOut(params.client_phone, false);
      replyText = 'Seu número foi reativado para receber avisos e lembretes de atendimento. Seja bem-vindo de volta!';
      actionTaken = 'Opt-in reativado.';
    }
    // Condition 3: Response "1" -> Confirm appointment
    else if (rawText === '1' || cleanLower.includes('confirm') || cleanLower.includes('sim')) {
      if (params.linked_appointment_id) {
        calendarEngine.updateStatus(params.linked_appointment_id, 'confirmed', 'WhatsApp Webhook (Resposta 1 do Cliente)');
      }
      replyText = 'Perfeito, sua presença está confirmada com sucesso! ✅ Te esperamos com todo o carinho no Naturo SPA.';
      actionTaken = 'Agendamento confirmado automaticamente via WhatsApp.';
    }
    // Condition 4: Response "2" -> Needs to reschedule
    else if (rawText === '2' || cleanLower.includes('remarcar') || cleanLower.includes('reagendar')) {
      replyText = 'Entendido! Acesse o link a seguir para escolher um novo horário livre: https://naturospa.com.br/reagendar — Nossa recepção também foi avisada para te auxiliar.';
      actionTaken = 'Solicitação de remarcação registrada e aviso criado para recepção.';
    }
    // Condition 5: Human conversation / Question
    else {
      replyText = 'Recebemos sua mensagem! Nossa equipe da recepção responderá em instantes. Tenha um excelente dia! 🌿';
      actionTaken = 'Mensagem livre encaminhada para a Caixa de Entrada da Recepção.';
    }

    // Record outbound auto-reply
    this.chats.push({
      id: `chat_out_${Date.now()}`,
      company_id: params.company_id,
      client_phone: params.client_phone,
      client_name: params.client_name,
      text: replyText,
      direction: 'outbound',
      timestamp: new Date().toISOString(),
      is_automated_response: true,
    });

    this.persist();
    return { reply: replyText, action_taken: actionTaken };
  }
}

export const whatsappEngine = new WhatsAppEngineStore();
