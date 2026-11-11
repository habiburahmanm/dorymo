import React from 'react';
import {
  Layers,
  Palette,
  Type,
  Layout,
  Sliders,
  CheckCircle2,
  Copy,
  Sparkles,
} from 'lucide-react';
import { cn } from '../lib/utils';

export const DesignSystemTokens: React.FC = () => {
  const colorTokens = [
    { name: 'Surface Black', token: '--background', hex: '#09090b', class: 'bg-[#09090b]', text: 'text-white' },
    { name: 'Card Dark', token: '--card', hex: '#121215', class: 'bg-zinc-950', text: 'text-white' },
    { name: 'Elevated Surface', token: '--muted', hex: '#18181b', class: 'bg-zinc-900', text: 'text-white' },
    { name: 'Subtle Border', token: '--border', hex: '#27272a', class: 'bg-zinc-800', text: 'text-white' },
    { name: 'Muted Foreground', token: '--muted-foreground', hex: '#a1a1aa', class: 'bg-zinc-400', text: 'text-black' },
    { name: 'High-Contrast Text', token: '--foreground', hex: '#fafafa', class: 'bg-zinc-100', text: 'text-black' },
    { name: 'Precision Accent', token: '--primary (Orange)', hex: '#f97316', class: 'bg-orange-500', text: 'text-black' },
    { name: 'Accent Glow/Hover', token: '--accent-hover', hex: '#ea580c', class: 'bg-orange-600', text: 'text-white' },
  ];

  const typographyScale = [
    { label: 'Display Hero', size: 'text-4xl sm:text-5xl', weight: 'font-semibold tracking-tight', sample: 'Three Service Vectors. One Ecosystem.' },
    { label: 'Section Heading', size: 'text-2xl', weight: 'font-semibold tracking-tight', sample: 'Verified Provider Registry' },
    { label: 'Card Title', size: 'text-base', weight: 'font-semibold', sample: 'High-Voltage Diagnostic Electrician' },
    { label: 'Body Regular', size: 'text-xs sm:text-sm', weight: 'font-normal leading-relaxed', sample: 'Escrow hold is automatically authorized and segregated upon mixed checkout.' },
    { label: 'Mono Tag / Ledger', size: 'text-[11px] font-mono', weight: 'font-medium', sample: 'ESCROW_TX: 0x992B... ৳450 HOLD' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 border-b border-white/10 pb-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 uppercase font-semibold">
            Node 5 Architecture
          </span>
          <span className="text-zinc-600">//</span>
          <span className="font-mono text-xs text-zinc-400">21st.dev & shadcn/ui Design Tokens</span>
        </div>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          Design System & Primitive Tokens
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          Strictly monochromatic surfaces, restrained international orange action accent, zero-bloat geometry, and fluid micro-interaction primitives.
        </p>
      </div>

      <div className="space-y-10">
        {/* Color Palette Tokens */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 font-mono">
              1. Monochromatic & Accent Surface Palette
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 text-xs font-mono">
            {colorTokens.map((c) => (
              <div
                key={c.name}
                className="rounded-lg border border-white/10 bg-zinc-950 p-3 space-y-2 flex flex-col justify-between"
              >
                <div className={cn('h-12 w-full rounded border border-white/10', c.class)} />
                <div>
                  <span className="block font-medium text-white text-[11px] truncate">{c.name}</span>
                  <span className="block text-[10px] text-zinc-500">{c.hex}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography Scale */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Type className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 font-mono">
              2. Accessible Typography Hierarchy
            </h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 space-y-4">
            {typographyScale.map((t) => (
              <div
                key={t.label}
                className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/5 pb-3 last:border-b-0"
              >
                <div className="w-48 shrink-0">
                  <span className="font-mono text-xs text-orange-400 block">{t.label}</span>
                  <span className="font-mono text-[10px] text-zinc-500">{t.size}</span>
                </div>
                <div className={cn('text-zinc-200 flex-1', t.size, t.weight)}>
                  {t.sample}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Component Primitives Showcase */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Layout className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 font-mono">
              3. Interactive Component Primitives (21st.dev Style)
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Buttons */}
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 space-y-3">
              <span className="font-mono text-xs text-zinc-400 uppercase font-semibold block">Button Hierarchy</span>
              <div className="space-y-2">
                <button className="w-full rounded-md bg-orange-500 px-3 py-2 text-xs font-semibold text-black hover:bg-orange-400 transition-colors">
                  Primary Accent Action
                </button>
                <button className="w-full rounded-md border border-white/15 bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:border-white/30 transition-colors">
                  Secondary Surface Action
                </button>
                <button className="w-full rounded-md border border-dashed border-white/10 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                  Subtle Ghost Trigger
                </button>
              </div>
            </div>

            {/* Badges & Status Pills */}
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 space-y-3">
              <span className="font-mono text-xs text-zinc-400 uppercase font-semibold block">Status Badges</span>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
                  ● KYC Verified
                </span>
                <span className="rounded border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-orange-400">
                  🔒 Escrow Hold Active
                </span>
                <span className="rounded border border-white/10 bg-zinc-900 px-2.5 py-1 text-zinc-400">
                  ⚡ 60m SLA Dispatch
                </span>
                <span className="rounded border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-red-400">
                  ⚠ Dispute Under Review
                </span>
              </div>
            </div>

            {/* Inputs & Controls */}
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 space-y-3">
              <span className="font-mono text-xs text-zinc-400 uppercase font-semibold block">Inputs & Radii</span>
              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  readOnly
                  value="Interactive Monochromatic Input"
                  className="w-full rounded-md border border-white/15 bg-zinc-900 px-3 py-2 text-white focus:outline-none"
                />
                <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono">
                  <span>Radius: 0.5rem (8px)</span>
                  <span>Border: 1px subtle</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
