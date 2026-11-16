/**
 * PWA install nudge. Shows a small banner when the browser allows installing,
 * and stays hidden inside the Capacitor native app (already installed).
 */
import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Download, X } from 'lucide-react';
import { Button } from './ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') setDismissed(true);
    setDeferred(null);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex justify-center px-4 sm:bottom-6">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-orange-500/30 bg-[#141416]/95 p-3 shadow-2xl backdrop-blur-xl">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-black">
          <Download className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold text-white">অ্যাপ হিসেবে ইনস্টল করুন</p>
          <p className="text-[10.5px] text-zinc-500">এক ট্যাপে খুলুন · অফলাইনের আংশিক সুবিধা</p>
        </div>
        <Button size="sm" onClick={() => void install()}>Install</Button>
        <button onClick={() => setDismissed(true)} aria-label="Close" className="text-zinc-600 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
