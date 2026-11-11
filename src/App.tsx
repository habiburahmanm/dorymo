import React, { useState, useEffect } from 'react';
import { EcosystemProvider, useEcosystem, SANDBOX_ACCOUNTS } from './context/EcosystemContext';
import { Navbar } from './components/Navbar';
import { IntentRouter } from './components/IntentRouter';
import { ServiceFinder } from './components/ServiceFinder';
import { CustomerPortal } from './components/CustomerPortal';
import { ProviderPortal } from './components/ProviderPortal';
import { AdminPortal } from './components/AdminPortal';
import { HybridCheckout } from './components/HybridCheckout';
import { DesignSystemTokens } from './components/DesignSystemTokens';
import { SystemInspector } from './components/SystemInspector';
import { CommandPalette } from './components/CommandPalette';
import { SpotlightBackground } from './components/SpotlightBackground';
import { AuthGateModal } from './components/AuthGateModal';
import { ShieldCheck, Activity, Terminal, Lock } from 'lucide-react';

const EcosystemShell: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    currentUser,
    loginAdminPin,
    openAuthGate,
    consoleErrors,
    verificationConfidence,
  } = useEcosystem();

  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Global Keyboard shortcuts:
  // 1. ⌘K / Ctrl+K: Command Palette
  // 2. ⌘+Shift+A / Ctrl+Shift+A: Secret Elevated Admin Dispatcher Access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret Admin shortcut: Ctrl + Shift + A (or Meta + Shift + A)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (currentUser?.role === 'admin') {
          setCurrentView('admin_portal');
        } else {
          openAuthGate('admin', 'admin_portal');
        }
        return;
      }

      // Command Palette: ⌘K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };

    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('admin-terminal') || hash.includes('gatekeeper-admin') || hash.includes('portal/admin')) {
        setCurrentView('admin_portal');
      } else if (hash.includes('portal/provider')) {
        setCurrentView('provider_portal');
      } else if (hash.includes('portal/customer') || hash.includes('consumer')) {
        setCurrentView('customer_portal');
      } else if (hash.includes('explore') || hash.includes('finder')) {
        setCurrentView('service_finder');
      } else if (hash.includes('checkout')) {
        setCurrentView('hybrid_checkout');
      } else if (hash.includes('inspector')) {
        setCurrentView('system_inspector');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [currentUser, openAuthGate, setCurrentView]);

  return (
    <div className="relative min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col justify-between selection:bg-orange-500 selection:text-black font-sans">
      {/* Interactive Radial Mouse Spotlight + Dot Grid Background */}
      <SpotlightBackground />

      {/* 21st.dev Clean Navigation Bar */}
      <Navbar onOpenCommand={() => setIsCommandOpen(true)} />

      {/* Main View Transition Engine */}
      <main className="relative z-10 flex-1 pb-16">
        {currentView === 'intent_router' && <IntentRouter />}
        {currentView === 'service_finder' && <ServiceFinder />}
        {(currentView === 'customer_portal' || currentView === 'consumer_account') && <CustomerPortal />}
        {currentView === 'provider_portal' && <ProviderPortal />}
        {currentView === 'admin_portal' && <AdminPortal />}
        {currentView === 'hybrid_checkout' && <HybridCheckout />}
        {currentView === 'design_system' && <DesignSystemTokens />}
        {currentView === 'system_inspector' && <SystemInspector />}
      </main>

      {/* Global Bottom Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#09090b]/90 backdrop-blur-md px-4 py-2 text-[11px] font-mono text-zinc-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-1.5 text-emerald-400 truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate hidden sm:inline">ZERO SYNTHETIC DATA: STRICT AUTHENTIC</span>
              <span className="truncate inline sm:hidden">AUTHENTIC ONLY</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-orange-400 shrink-0">
              <Lock className="h-3 w-3" />
              <span>ESCROW DEPOSIT ENGINE ACTIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setCurrentView('system_inspector')}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">STATE GRAPH CONFIDENCE: {verificationConfidence}%</span>
              <span className="inline sm:hidden">{verificationConfidence}% CONFIDENCE</span>
            </button>
            <div className="hidden md:flex items-center gap-1.5 text-zinc-500">
              <Terminal className="h-3 w-3" />
              <span>ERRORS: {consoleErrors.length}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Tri-Portal Authentication Modal */}
      <AuthGateModal />

      {/* Command Palette Modal */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <EcosystemProvider>
      <EcosystemShell />
    </EcosystemProvider>
  );
}
