import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { IntentRouter } from './components/IntentRouter';
import { HowItWorks } from './components/HowItWorks';
import { Footer } from './components/Footer';
import { ManualCheckout } from './components/ManualCheckout';
import { AdminVerificationPanel } from './components/AdminVerificationPanel';
import { SignUpModal } from './components/SignUpModal';
import { ExploreV2 } from './components/ExploreV2';
import { ProviderJobs } from './components/ProviderJobs';
import { ChatPanel } from './components/ChatPanel';
import { ReviewsPanel } from './components/ReviewsPanel';
import { InstallPrompt } from './components/InstallPrompt';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AvatarModal } from './components/AvatarModal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { ScrollProgress } from './components/ScrollProgress';
import { useMaster } from './context/MasterContext';
import { supabase } from './lib/supabase';

const Shell: React.FC = () => {
  const { masterView } = useMaster();
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ error }) => {
        if (error) setBootError('সার্ভারের সাথে সংযোগে সমস্যা হচ্ছে।');
      })
      .catch(() => setBootError('ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না।'));
  }, []);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#09090b] text-zinc-50">
      <ScrollProgress />
      <Navbar />

      {bootError && (
        <div className="mx-auto mt-3 w-full max-w-7xl px-4 sm:px-6">
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 px-4 py-2.5 text-[12.5px] text-amber-200">
            {bootError}
          </div>
        </div>
      )}

      <main className="relative flex-1">
        {masterView === 'manual_checkout' && <ManualCheckout />}
        {masterView === 'admin_verify' && <AdminVerificationPanel />}
        {masterView === 'explore' && <ExploreV2 />}
        {masterView === 'provider_jobs' && <ProviderJobs />}
        {masterView === 'chat' && <ChatPanel />}
        {masterView === 'reviews' && <ReviewsPanel />}
        {masterView === 'how_it_works' && <HowItWorks />}
        {masterView === 'customer_dashboard' && <CustomerDashboard />}
        {!masterView && <IntentRouter />}
      </main>

      <Footer />
      <SignUpModal />
      <AvatarModal />
      <InstallPrompt />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <Shell />
    </ErrorBoundary>
  );
}
