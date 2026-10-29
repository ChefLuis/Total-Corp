import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage, CreateCompanyPage, SplashScreen } from './pages/auth/AuthPages';
import { RBACProvider } from './context/RBACContext';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/dashboard/Dashboard';
import CalendarPage from './pages/calendar/Calendar';
import ClientsPage from './pages/clients/Clients';
import ServicesPage from './pages/services/Services';
import TeamPage from './pages/team/Team';
import TabsPage from './pages/tabs/Tabs';
import FinancialPage from './pages/financial/Financial';
import CommissionsPage from './pages/commissions/Commissions';
import InventoryPage from './pages/inventory/Inventory';
import MessagingCenter from './pages/marketing/MessagingCenter';
import SubscriptionsPage from './pages/subscriptions/Subscriptions';
import CorporatePage from './pages/corporate/Corporate';
import SettingsPage from './pages/settings/Settings';
import PermissionsPage from './pages/settings/Permissions';
import OnboardingPage from './pages/onboarding/Onboarding';
import PublicBookingPage from './pages/public/PublicBooking';
import DigitalMenuPage from './pages/public/DigitalMenu';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') return <SplashScreen />;
  if (status === 'unauthenticated') return <LoginPage />;
  if (status === 'needs_company') return <CreateCompanyPage />;
  return <>{children}</>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RBACProvider>
          <BrowserRouter>
            <Routes>
              {/* Authenticated Dashboard Shell */}
              <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="tabs" element={<TabsPage />} />
                <Route path="financial" element={<FinancialPage />} />
                <Route path="commissions" element={<CommissionsPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="marketing" element={<MessagingCenter />} />
                <Route path="messages" element={<MessagingCenter />} />
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="corporate" element={<CorporatePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="settings/permissions" element={<PermissionsPage />} />
                <Route path="onboarding" element={<OnboardingPage />} />
              </Route>

              {/* Digital Menu & Orders (Standalone & Branded menu.naturospa.com.br) */}
              <Route path="/menu" element={<DigitalMenuPage />} />
              <Route path="/:slug/menu" element={<DigitalMenuPage />} />

              {/* Public Booking Portal (Branded per tenant /{slug}) */}
              <Route path="/:slug" element={<PublicBookingPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </RBACProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
