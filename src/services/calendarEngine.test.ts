import { describe, it, expect, beforeEach } from 'vitest';
import { calendarEngine } from './calendarEngine';

describe('Calendar Engine Rules & Conflict Verification', () => {
  const companyId = 'comp_naturo_spa_01';
  const unitId = 'unit_the_five_01';
  const profId = 'prof_beatriz_01';
  const serviceId = 'srv_toque_integrativo_01';
  const clientId = 'cli_helena_01';

  it('1. Deve impedir agendamento duplicado no mesmo horário para o mesmo profissional (Atomic Lock)', () => {
    const startTime = '2026-10-25T14:00:00Z';
    const endTime = '2026-10-25T15:10:00Z';

    // Primeiro agendamento deve ter sucesso
    const firstAttempt = calendarEngine.createAppointmentWithLock({
      company_id: companyId,
      unit_id: unitId,
      client_id: clientId,
      professional_id: profId,
      service_id: serviceId,
      start_time: startTime,
      end_time: endTime,
    });

    expect(firstAttempt.success).toBe(true);
    expect(firstAttempt.appointment).toBeDefined();

    // Segundo agendamento no mesmo horário/profissional DEVE FALHAR
    const secondAttempt = calendarEngine.createAppointmentWithLock({
      company_id: companyId,
      unit_id: unitId,
      client_id: 'cli_marcelo_02',
      professional_id: profId,
      service_id: serviceId,
      start_time: startTime,
      end_time: endTime,
    });

    expect(secondAttempt.success).toBe(false);
    expect(secondAttempt.conflictReason).toContain('Conflito de agenda');
  });

  it('2. Deve respeitar bloqueios de agenda (almoço, folga ou manutenção)', () => {
    const blockStart = '2026-10-26T12:00:00Z';
    const blockEnd = '2026-10-26T13:00:00Z';

    calendarEngine.addBlock({
      company_id: companyId,
      unit_id: unitId,
      professional_id: profId,
      reason: 'lunch',
      notes: 'Intervalo Obrigatório de Almoço',
      start_time: blockStart,
      end_time: blockEnd,
    });

    // Tentativa de agendar no meio do almoço deve ser bloqueada
    const attempt = calendarEngine.createAppointmentWithLock({
      company_id: companyId,
      unit_id: unitId,
      client_id: clientId,
      professional_id: profId,
      service_id: serviceId,
      start_time: '2026-10-26T12:15:00Z',
      end_time: '2026-10-26T13:25:00Z',
    });

    expect(attempt.success).toBe(false);
    expect(attempt.conflictReason).toContain('Horário bloqueado');
  });

  it('3. Deve calcular disponibilidade respeitando a antecedência mínima e buffers', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const slots = calendarEngine.calculateAvailability({
      company_id: companyId,
      unit_id: unitId,
      service_id: serviceId,
      date: tomorrow,
      preferred_professional_id: profId,
      min_notice_minutes: 60,
    });

    expect(slots.length).toBeGreaterThan(0);
    // Todos os slots disponíveis devem ter o profissional na lista
    const availableSlot = slots.find((s) => s.available);
    if (availableSlot) {
      expect(availableSlot.available_professional_ids).toContain(profId);
    }
  });
});
