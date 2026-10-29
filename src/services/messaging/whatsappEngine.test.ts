import { describe, it, expect, beforeEach } from 'vitest';
import { whatsappEngine } from './whatsappEngine';
import { calendarEngine } from '../calendarEngine';

describe('WhatsApp Messaging Engine & Webhook Rules', () => {
  const companyId = 'comp_naturo_spa_01';
  const testPhone = '(41) 98888-7777';

  beforeEach(() => {
    whatsappEngine.setOptOut(testPhone, false);
  });

  it('1. Deve compilar variáveis dinâmicas nos templates corretamente', () => {
    const rawTemplate = 'Olá, {{nome}}! Seu agendamento de {{servico}} está marcado para {{data}} às {{hora}} com {{profissional}}.';
    const compiled = whatsappEngine.compileText(rawTemplate, {
      nome: 'Helena',
      servico: 'Toque Integrativo',
      data: '25/10/2026',
      hora: '14:00',
      profissional: 'Beatriz Lins',
    });

    expect(compiled).toBe('Olá, Helena! Seu agendamento de Toque Integrativo está marcado para 25/10/2026 às 14:00 com Beatriz Lins.');
  });

  it('2. Deve respeitar opt-out LGPD e bloquear envios automáticos para clientes descadastrados', async () => {
    // Registrar opt-out do telefone de teste
    whatsappEngine.setOptOut(testPhone, true);
    expect(whatsappEngine.isOptedOut(testPhone)).toBe(true);

    const result = await whatsappEngine.dispatchTrigger({
      company_id: companyId,
      event: 'reminder_24h',
      recipient_phone: testPhone,
      recipient_name: 'Cliente Teste',
      vars: { nome: 'Cliente Teste' },
      forceImmediate: true,
    });

    expect(result.success).toBe(false);
    expect(result.reason).toContain('opt-out (LGPD)');
  });

  it('3. Processamento de Webhook com resposta "1" deve confirmar o agendamento automaticamente', () => {
    // Criar um agendamento prévio
    const aptResult = calendarEngine.createAppointmentWithLock({
      company_id: companyId,
      unit_id: 'unit_the_five_01',
      client_id: 'cli_helena_01',
      professional_id: 'prof_beatriz_01',
      service_id: 'srv_toque_integrativo_01',
      start_time: '2026-10-27T10:00:00Z',
      end_time: '2026-10-27T11:10:00Z',
    });

    expect(aptResult.success).toBe(true);
    const appointmentId = aptResult.appointment!.id;

    // Simular que o cliente respondeu "1" no WhatsApp
    const webhookResult = whatsappEngine.handleIncomingWebhook({
      company_id: companyId,
      client_phone: testPhone,
      client_name: 'Helena Ribeiro',
      text: '1',
      linked_appointment_id: appointmentId,
    });

    expect(webhookResult.action_taken).toContain('confirmado');
    expect(webhookResult.reply).toContain('confirmada com sucesso');

    // Verificar se o status do agendamento mudou para 'confirmed'
    const updatedApt = calendarEngine.getAppointments(companyId).find((a) => a.id === appointmentId);
    expect(updatedApt?.status).toBe('confirmed');
  });

  it('4. Resposta "PARAR" deve registrar opt-out LGPD automaticamente', () => {
    const webhookResult = whatsappEngine.handleIncomingWebhook({
      company_id: companyId,
      client_phone: testPhone,
      client_name: 'Cliente Teste',
      text: 'PARAR',
    });

    expect(webhookResult.action_taken).toContain('Opt-out registrado');
    expect(whatsappEngine.isOptedOut(testPhone)).toBe(true);
  });
});
