import { todayISO } from '../utils/dates';
import { Appointment, Service, Professional, Unit, Client, AppointmentStatus } from '../types';
import { INITIAL_APPOINTMENTS, INITIAL_SERVICES, INITIAL_PROFESSIONALS, INITIAL_UNITS, INITIAL_CLIENTS } from './mockData';

export interface TimeSlot {
  time: string; // HH:mm
  start_time: string; // ISO
  end_time: string;   // ISO
  available: boolean;
  available_professional_ids: string[];
  reason?: string;
}

export interface AgendaBlock {
  id: string;
  company_id: string;
  unit_id: string;
  professional_id: string;
  reason: 'lunch' | 'time_off' | 'maintenance' | 'meeting';
  notes: string;
  start_time: string;
  end_time: string;
}

export interface HoldReservation {
  id: string;
  service_id: string;
  professional_id: string | null;
  start_time: string;
  end_time: string;
  client_phone: string;
  expires_at: string; // ISO (10 minutes from creation)
}

export interface WaitlistEntry {
  id: string;
  company_id: string;
  unit_id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  service_id: string;
  preferred_professional_id?: string;
  desired_date: string; // YYYY-MM-DD
  preferred_period: 'morning' | 'afternoon' | 'any';
  status: 'waiting' | 'notified' | 'scheduled' | 'expired';
  created_at: string;
}

export interface AppointmentHistoryItem {
  id: string;
  appointment_id: string;
  timestamp: string;
  actor_name: string;
  action: string;
  details: string;
}

// In-memory state with persistence for Phase 2
class CalendarEngineStore {
  private appointments: Appointment[] = [];
  private blocks: AgendaBlock[] = [];
  private holds: HoldReservation[] = [];
  private waitlist: WaitlistEntry[] = [];
  private history: AppointmentHistoryItem[] = [];

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window !== 'undefined') {
      const savedApts = localStorage.getItem('totalcorp_appointments');
      this.appointments = savedApts ? JSON.parse(savedApts) : [...INITIAL_APPOINTMENTS];

      const savedBlocks = localStorage.getItem('totalcorp_blocks');
      this.blocks = savedBlocks ? JSON.parse(savedBlocks) : [
        {
          id: 'blk_01',
          company_id: 'comp_naturo_spa_01',
          unit_id: 'unit_the_five_01',
          professional_id: 'prof_beatriz_01',
          reason: 'lunch',
          notes: 'Intervalo de Almoço',
          start_time: `${todayISO(0)}T12:00:00Z`,
          end_time: `${todayISO(0)}T13:00:00Z`,
        },
      ];

      const savedHolds = localStorage.getItem('totalcorp_holds');
      this.holds = savedHolds ? JSON.parse(savedHolds) : [];

      const savedWaitlist = localStorage.getItem('totalcorp_waitlist');
      this.waitlist = savedWaitlist ? JSON.parse(savedWaitlist) : [
        {
          id: 'wait_01',
          company_id: 'comp_naturo_spa_01',
          unit_id: 'unit_the_five_01',
          client_id: 'cli_marcelo_02',
          client_name: 'Dr. Marcelo Paiva',
          client_phone: '(41) 98222-3344',
          service_id: 'srv_toque_integrativo_01',
          desired_date: todayISO(1),
          preferred_period: 'afternoon',
          status: 'waiting',
          created_at: new Date().toISOString(),
        },
      ];

      const savedHistory = localStorage.getItem('totalcorp_history');
      this.history = savedHistory ? JSON.parse(savedHistory) : [
        {
          id: 'hist_01',
          appointment_id: 'apt_001',
          timestamp: new Date().toISOString(),
          actor_name: 'Mariana Duarte (Recepção)',
          action: 'status_change',
          details: 'Status alterado de Confirmado para Em Atendimento',
        },
      ];
    } else {
      this.appointments = [...INITIAL_APPOINTMENTS];
    }
  }

  private persist() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('totalcorp_appointments', JSON.stringify(this.appointments));
      localStorage.setItem('totalcorp_blocks', JSON.stringify(this.blocks));
      localStorage.setItem('totalcorp_holds', JSON.stringify(this.holds));
      localStorage.setItem('totalcorp_waitlist', JSON.stringify(this.waitlist));
      localStorage.setItem('totalcorp_history', JSON.stringify(this.history));
    }
  }

  public getAppointments(companyId: string, unitId?: string | null): Appointment[] {
    return this.appointments.filter((apt) => {
      if (apt.company_id !== companyId) return false;
      if (unitId && apt.unit_id !== unitId) return false;
      return true;
    });
  }

  public getBlocks(companyId: string, unitId?: string | null): AgendaBlock[] {
    return this.blocks.filter((b) => {
      if (b.company_id !== companyId) return false;
      if (unitId && b.unit_id !== unitId) return false;
      return true;
    });
  }

  public getWaitlist(companyId: string): WaitlistEntry[] {
    return this.waitlist.filter((w) => w.company_id === companyId);
  }

  public getHistory(appointmentId: string): AppointmentHistoryItem[] {
    return this.history.filter((h) => h.appointment_id === appointmentId);
  }

  // Atomically check conflicts and create an appointment
  public createAppointmentWithLock(params: {
    company_id: string;
    unit_id: string;
    client_id: string;
    professional_id: string;
    service_id: string;
    start_time: string;
    end_time: string;
    notes?: string;
    actor_name?: string;
  }): { success: boolean; appointment?: Appointment; conflictReason?: string } {
    const newStart = new Date(params.start_time).getTime();
    const newEnd = new Date(params.end_time).getTime();

    // 1. Conflict check: appointments for the same professional
    const profConflict = this.appointments.find((apt) => {
      if (apt.company_id !== params.company_id) return false;
      if (apt.professional_id !== params.professional_id) return false;
      if (apt.status === 'canceled') return false;

      const aptStart = new Date(apt.start_time).getTime();
      const aptEnd = new Date(apt.end_time).getTime();

      // Overlap formula: max(start1, start2) < min(end1, end2)
      return Math.max(newStart, aptStart) < Math.min(newEnd, aptEnd);
    });

    if (profConflict) {
      return {
        success: false,
        conflictReason: `Conflito de agenda: o profissional já possui atendimento entre ${new Date(profConflict.start_time).toLocaleTimeString()} e ${new Date(profConflict.end_time).toLocaleTimeString()}.`,
      };
    }

    // 2. Conflict check: blocks (lunch, maintenance, vacation)
    const blockConflict = this.blocks.find((blk) => {
      if (blk.company_id !== params.company_id) return false;
      if (blk.professional_id !== params.professional_id) return false;

      const blkStart = new Date(blk.start_time).getTime();
      const blkEnd = new Date(blk.end_time).getTime();

      return Math.max(newStart, blkStart) < Math.min(newEnd, blkEnd);
    });

    if (blockConflict) {
      return {
        success: false,
        conflictReason: `Horário bloqueado: o profissional possui um bloqueio (${blockConflict.notes}) neste intervalo.`,
      };
    }

    // 3. Find service for pricing
    const service = INITIAL_SERVICES.find((s) => s.id === params.service_id);
    const priceCents = service ? service.price_cents : 0;

    const newAppointment: Appointment = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      company_id: params.company_id,
      unit_id: params.unit_id,
      client_id: params.client_id,
      professional_id: params.professional_id,
      service_id: params.service_id,
      start_time: params.start_time,
      end_time: params.end_time,
      status: 'scheduled',
      notes: params.notes,
      price_cents: priceCents,
    };

    this.appointments.push(newAppointment);

    // Audit log
    this.history.push({
      id: `hist_${Date.now()}`,
      appointment_id: newAppointment.id,
      timestamp: new Date().toISOString(),
      actor_name: params.actor_name || 'Sistema Total Corp',
      action: 'created',
      details: 'Agendamento criado com verificação de bloqueio atômico.',
    });

    // Remove any active hold for this slot
    this.holds = this.holds.filter(
      (h) => !(h.professional_id === params.professional_id && h.start_time === params.start_time)
    );

    this.persist();
    return { success: true, appointment: newAppointment };
  }

  // Update appointment status with audit history
  public updateStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
    actorName: string,
    notes?: string
  ): boolean {
    const apt = this.appointments.find((a) => a.id === appointmentId);
    if (!apt) return false;

    const oldStatus = apt.status;
    apt.status = newStatus;
    if (notes) apt.notes = notes;

    this.history.push({
      id: `hist_${Date.now()}`,
      appointment_id: appointmentId,
      timestamp: new Date().toISOString(),
      actor_name: actorName,
      action: 'status_change',
      details: `Status alterado de "${oldStatus}" para "${newStatus}".`,
    });

    this.persist();
    return true;
  }

  // Add agenda block
  public addBlock(block: Omit<AgendaBlock, 'id'>): AgendaBlock {
    const newBlock: AgendaBlock = {
      id: `blk_${Date.now()}`,
      ...block,
    };
    this.blocks.push(newBlock);
    this.persist();
    return newBlock;
  }

  // Remove block
  public removeBlock(id: string): void {
    this.blocks = this.blocks.filter((b) => b.id !== id);
    this.persist();
  }

  // Hold reservation (10 minutes)
  public createHold(params: {
    service_id: string;
    professional_id: string | null;
    start_time: string;
    end_time: string;
    client_phone: string;
  }): HoldReservation {
    // Purge expired holds first
    const now = Date.now();
    this.holds = this.holds.filter((h) => new Date(h.expires_at).getTime() > now);

    const newHold: HoldReservation = {
      id: `hld_${Date.now()}`,
      service_id: params.service_id,
      professional_id: params.professional_id,
      start_time: params.start_time,
      end_time: params.end_time,
      client_phone: params.client_phone,
      expires_at: new Date(now + 10 * 60 * 1000).toISOString(),
    };

    this.holds.push(newHold);
    this.persist();
    return newHold;
  }

  // Add to waitlist
  public addToWaitlist(entry: Omit<WaitlistEntry, 'id' | 'created_at' | 'status'>): WaitlistEntry {
    const newEntry: WaitlistEntry = {
      id: `wait_${Date.now()}`,
      ...entry,
      status: 'waiting',
      created_at: new Date().toISOString(),
    };
    this.waitlist.push(newEntry);
    this.persist();
    return newEntry;
  }

  // Mathematical Availability calculation
  public calculateAvailability(params: {
    company_id: string;
    unit_id: string;
    service_id: string;
    date: string; // YYYY-MM-DD
    preferred_professional_id?: string | null;
    min_notice_minutes?: number; // default 60
  }): TimeSlot[] {
    const minNotice = params.min_notice_minutes ?? 60;
    const now = Date.now();
    const service = INITIAL_SERVICES.find((s) => s.id === params.service_id);
    if (!service) return [];

    const durationMin = service.duration_minutes;
    const bufferMin = service.buffer_time_minutes;
    const totalBlockMin = durationMin + bufferMin;

    // Filter candidate professionals
    const candidateProfessionals = INITIAL_PROFESSIONALS.filter((p) => {
      if (p.company_id !== params.company_id) return false;
      if (!p.unit_ids.includes(params.unit_id)) return false;
      if (params.preferred_professional_id && p.id !== params.preferred_professional_id) return false;
      return true;
    });

    if (candidateProfessionals.length === 0) return [];

    // Operating window for the day (e.g. 09:00 to 20:00)
    // 15-minute slot increments
    const startHour = 9;
    const endHour = 20;
    const slots: TimeSlot[] = [];

    // Clean expired holds
    this.holds = this.holds.filter((h) => new Date(h.expires_at).getTime() > now);

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        
        // Build slot UTC timestamps (assuming local America/Sao_Paulo timezone)
        const slotStart = new Date(`${params.date}T${timeStr}:00-03:00`);
        const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000);
        const slotEndWithBuffer = new Date(slotStart.getTime() + totalBlockMin * 60 * 1000);

        // Check 1: Minimum advance notice
        if (slotStart.getTime() < now + minNotice * 60 * 1000) {
          slots.push({
            time: timeStr,
            start_time: slotStart.toISOString(),
            end_time: slotEnd.toISOString(),
            available: false,
            available_professional_ids: [],
            reason: 'Antecedência mínima necessária (60 min)',
          });
          continue;
        }

        // Check 2: Which candidate professionals are free during this slot
        const freeProfs: string[] = [];

        for (const prof of candidateProfessionals) {
          // Check existing appointments for this professional
          const hasAptConflict = this.appointments.some((apt) => {
            if (apt.company_id !== params.company_id) return false;
            if (apt.professional_id !== prof.id) return false;
            if (apt.status === 'canceled') return false;

            const aStart = new Date(apt.start_time).getTime();
            const aEnd = new Date(apt.end_time).getTime();

            // Check collision with requested slot + buffer
            return Math.max(slotStart.getTime(), aStart) < Math.min(slotEndWithBuffer.getTime(), aEnd);
          });

          if (hasAptConflict) continue;

          // Check blocks
          const hasBlock = this.blocks.some((blk) => {
            if (blk.company_id !== params.company_id) return false;
            if (blk.professional_id !== prof.id) return false;

            const bStart = new Date(blk.start_time).getTime();
            const bEnd = new Date(blk.end_time).getTime();

            return Math.max(slotStart.getTime(), bStart) < Math.min(slotEndWithBuffer.getTime(), bEnd);
          });

          if (hasBlock) continue;

          // Check active holds
          const hasHold = this.holds.some((hld) => {
            if (hld.professional_id && hld.professional_id !== prof.id) return false;

            const hStart = new Date(hld.start_time).getTime();
            const hEnd = new Date(hld.end_time).getTime();

            return Math.max(slotStart.getTime(), hStart) < Math.min(slotEndWithBuffer.getTime(), hEnd);
          });

          if (hasHold) continue;

          freeProfs.push(prof.id);
        }

        const isAvailable = freeProfs.length > 0;

        slots.push({
          time: timeStr,
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          available: isAvailable,
          available_professional_ids: freeProfs,
          reason: isAvailable ? undefined : 'Sem profissionais livres ou horário ocupado',
        });
      }
    }

    return slots;
  }
}

export const calendarEngine = new CalendarEngineStore();
