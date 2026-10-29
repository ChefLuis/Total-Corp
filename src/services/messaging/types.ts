export type MessageChannel = 'whatsapp' | 'email' | 'sms';

export type TriggerEvent =
  | 'appointment_created'
  | 'reminder_24h'
  | 'reminder_2h'
  | 'post_service_review'
  | 'birthday_greeting'
  | 'client_reactivation'
  | 'payment_reminder';

export type MessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'opted_out';

export interface MessageTemplate {
  id: string;
  company_id: string;
  name: string;
  event: TriggerEvent;
  channel: MessageChannel;
  content: string; // Suporta variáveis: {{nome}}, {{servico}}, {{data}}, {{hora}}, {{profissional}}, {{link_remarcar}}, {{link_avaliar}}
  is_active: boolean;
  meta_template_status?: 'APPROVED' | 'PENDING' | 'REJECTED';
}

export interface MessageQueueItem {
  id: string;
  company_id: string;
  recipient_phone: string;
  recipient_name: string;
  template_id: string;
  compiled_text: string;
  event: TriggerEvent;
  scheduled_for: string; // ISO String
  attempts: number;
  max_attempts: number;
  status: MessageStatus;
  error_message?: string;
  created_at: string;
}

export interface MessageLogItem {
  id: string;
  company_id: string;
  recipient_phone: string;
  recipient_name: string;
  event: TriggerEvent;
  body: string;
  status: MessageStatus;
  sent_at: string;
  read_at?: string;
  provider_message_id?: string;
}

export interface IncomingChatMessage {
  id: string;
  company_id: string;
  client_phone: string;
  client_name: string;
  text: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  is_automated_response?: boolean;
  appointment_id?: string;
}

export interface WhatsAppProviderAdapter {
  name: string;
  sendMessage(toPhone: string, text: string): Promise<{ success: boolean; provider_id?: string; error?: string }>;
  checkStatus?(providerId: string): Promise<MessageStatus>;
}
