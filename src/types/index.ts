import { AppRole, Permission } from './rbac';

export type BusinessSegment =
  | 'spa_wellness'
  | 'salon'
  | 'barbershop'
  | 'aesthetics'
  | 'clinic';

export interface Company {
  id: string;
  name: string;
  trade_name: string;
  document: string; // CNPJ / CPF
  slug: string;
  segment: BusinessSegment;
  theme_color: string;
  logo_url?: string;
  phone: string;
  email: string;
  subscription_status: 'trialing' | 'active' | 'past_due' | 'suspended' | 'canceled';
  trial_ends_at: string;
  created_at: string;
}

export interface Unit {
  id: string;
  company_id: string;
  name: string;
  address_street: string;
  address_number: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zipcode: string;
  timezone: string;
  phone: string;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  role: AppRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
}

export interface Professional {
  id: string;
  company_id: string;
  user_profile_id?: string;
  name: string;
  bio?: string;
  role_title?: string;
  pix_key?: string;
  email?: string;
  color_tag: string;
  commission_rate: number; // ex: 35.00 (%)
  specialties: string[];
  unit_ids: string[];
  is_active: boolean;
  avatar_url?: string;
}

export interface ServiceCategory {
  id: string;
  company_id: string;
  name: string;
  color: string;
  sort_order: number;
}

export interface Service {
  id: string;
  company_id: string;
  category_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  buffer_time_minutes: number;
  price_cents: number; // Sempre em centavos
  is_online_bookable: boolean;
  requires_deposit: boolean;
  deposit_amount_cents?: number;
  professional_ids: string[];
  is_active?: boolean;
}

export interface Client {
  id: string;
  company_id: string;
  name: string;
  email?: string;
  phone: string;
  document?: string;
  birth_date?: string;
  notes?: string;
  tags: string[];
  credit_balance_cents: number;
  lgpd_consent: boolean;
  lgpd_consent_at: string;
  created_at: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'arrived'
  | 'in_service'
  | 'completed'
  | 'canceled'
  | 'no_show';

export interface Appointment {
  id: string;
  company_id: string;
  unit_id: string;
  client_id: string;
  professional_id: string;
  service_id: string;
  start_time: string; // ISO String UTC
  end_time: string;   // ISO String UTC
  status: AppointmentStatus;
  notes?: string;
  price_cents: number;
}

export interface DashboardMetricSummary {
  revenue_today_cents: number;
  appointments_count_today: number;
  occupancy_rate_percent: number;
  new_clients_month: number;
  pending_confirmations: number;
  low_stock_alerts: number;
}

export * from './rbac';
