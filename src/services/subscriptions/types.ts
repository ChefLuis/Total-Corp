export interface ClubPlan {
  id: string;
  company_id: string;
  name: string;
  price_cents: number;
  sessions_per_month: number;
  discount_percentage: number;
  description: string;
  perks: string[];
  active: boolean;
}

export interface ClubSubscriber {
  id: string;
  company_id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  plan_id: string;
  plan_name: string;
  price_cents: number;
  start_date: string;
  next_billing_date: string;
  credits_remaining: number;
  status: 'active' | 'past_due' | 'cancelled';
  card_last4?: string;
}

export interface SaaSPlatformSubscription {
  plan_name: string;
  price_cents: number;
  status: 'trial' | 'active';
  trial_days_remaining: number;
  next_charge_date: string;
  features: string[];
}
