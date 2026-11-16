import React from 'react';
import { cn } from '../lib/utils';

/**
 * জুলাই ২০২৪ গণঅভ্যুত্থানের স্মারক — হাত উঁচু করে দাঁড়ানো রিকশাচালক ও তার রিকশা।
 * পুরো শিল্পকর্ম বিন্দু (ডট) দিয়ে তৈরি — বড় স্ক্রিনে ঝকঝকে, ছোট স্ক্রিনেও স্পষ্ট।
 *
 * কৌশল: প্রতিটি অংশের সিলুয়েট একটি <mask>-এ আঁকা, তার ওপর ডট-প্যাটার্ন বসানো।
 * এতে আকৃতির ধার পরিষ্কার থাকে, অথচ ভেতরটা পুরোপুরি বিন্দুময় দেখায়।
 */

interface HeroArtProps {
  className?: string;
  accent?: string;
}

export const HeroArt: React.FC<HeroArtProps> = ({ className, accent = '#FF8527' }) => {
  const accents = [
    { x: 128, y: 54, r: 3, d: 0 },
    { x: 180, y: 44, r: 2.4, d: 0.6 },
    { x: 146, y: 30, r: 2, d: 1.2 },
    { x: 300, y: 252, r: 3.4, d: 0.3 },
    { x: 616, y: 128, r: 2.6, d: 1.8 },
    { x: 60, y: 306, r: 2.2, d: 2.4 },
    { x: 112, y: 408, r: 2.4, d: 0.9 },
    { x: 252, y: 414, r: 2, d: 1.5 },
    { x: 336, y: 410, r: 1.8, d: 2.1 },
  ];

  return (
    <svg
      viewBox="0 0 640 450"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-auto w-full', className)}
      role="img"
      aria-label="হাত উঁচু করে দাঁড়ানো রিকশাচালক ও রিকশার ডট-চিত্র"
    >
      <defs>
        {/* বিন্দুর প্যাটার্ন — ঘন (মানুষ), মাঝারি (রিকশা), হালকা (ছায়া) */}
        <pattern id="hpDotsPerson" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.95" fill="#fafafa" />
        </pattern>
        <pattern id="hpDotsRickshaw" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.55" fill="#e4e4e7" />
        </pattern>
        <pattern id="hpDotsSoft" width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="4.5" r="1.15" fill="#d4d4d8" />
        </pattern>

        <radialGradient id="hpGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="55%" stopColor={accent} stopOpacity="0.10" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>

        {/* ---------- মানুষ ---------- */}
        <mask id="hpMaskPerson" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="480">
          <g fill="#fff">
            {/* মাথা ও ঘাড় */}
            <circle cx="196" cy="112" r="22" />
            <circle cx="217" cy="117" r="6" />
            <rect x="188" y="128" width="16" height="16" rx="4" />
            {/* শরীর */}
            <path d="M168 152 Q196 140 224 152 L220 234 Q196 243 172 234 Z" />
            {/* লুঙ্গি */}
            <path d="M170 228 L222 228 L240 318 Q196 329 152 318 Z" />
            {/* পা */}
            <path d="M178 314 L172 396" stroke="#fff" strokeWidth="21" strokeLinecap="round" />
            <path d="M214 314 L224 396" stroke="#fff" strokeWidth="21" strokeLinecap="round" />
            <ellipse cx="170" cy="402" rx="21" ry="8" />
            <ellipse cx="230" cy="402" rx="21" ry="8" />
            {/* উঁচু হাত */}
            <path
              d="M178 162 L159 122 L154 96"
              stroke="#fff"
              strokeWidth="19"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* মুঠি */}
            <circle cx="152" cy="75" r="16" />
            <circle cx="140" cy="64" r="6" />
            <circle cx="152" cy="59" r="6" />
            <circle cx="164" cy="64" r="6" />
            <circle cx="166" cy="82" r="6.5" />
            {/* নামানো হাত — হ্যান্ডেল ধরে */}
            <path
              d="M220 162 L252 208 L294 250"
              stroke="#fff"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="298" cy="255" r="10" />
          </g>
        </mask>

        {/* ---------- রিকশা (মূল রেখা) ---------- */}
        <mask id="hpMaskRickshaw" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="480">
          <g fill="#fff" stroke="#fff">
            {/* সামনের চাকা */}
            <circle cx="368" cy="350" r="42" fill="none" strokeWidth="9" />
            <circle cx="368" cy="350" r="7" fill="#fff" stroke="none" />
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i * Math.PI) / 3;
              return (
                <line
                  key={`fs${i}`}
                  x1={368 + Math.cos(a) * 8}
                  y1={350 + Math.sin(a) * 8}
                  x2={368 + Math.cos(a) * 36}
                  y2={350 + Math.sin(a) * 36}
                  strokeWidth="3.5"
                />
              );
            })}
            {/* সামনের ফেন্ডার */}
            <path d="M324 350 A44 44 0 0 1 412 350" fill="none" strokeWidth="7" strokeLinecap="round" />

            {/* পেছনের চাকা */}
            <circle cx="536" cy="336" r="58" fill="none" strokeWidth="11" />
            <circle cx="536" cy="336" r="8" fill="#fff" stroke="none" />
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i * Math.PI) / 4;
              return (
                <line
                  key={`rs${i}`}
                  x1={536 + Math.cos(a) * 10}
                  y1={336 + Math.sin(a) * 10}
                  x2={536 + Math.cos(a) * 50}
                  y2={336 + Math.sin(a) * 50}
                  strokeWidth="5"
                />
              );
            })}

            {/* ফ্রেম ও চেইন */}
            <path
              d="M368 350 L448 326 L536 336"
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="404" cy="352" r="12" fill="none" strokeWidth="5" />
            <path d="M452 306 L452 330" fill="none" strokeWidth="8" strokeLinecap="round" />

            {/* হ্যান্ডেল বার */}
            <path
              d="M298 255 L330 302 L368 346"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="340" cy="306" r="5" fill="#fff" stroke="none" />

            {/* সিট ও পিঠ */}
            <rect x="444" y="274" width="152" height="32" rx="9" stroke="none" />
            <rect x="572" y="194" width="24" height="86" rx="10" stroke="none" />
            {/* পা রাখার বোর্ড */}
            <path d="M444 304 L424 330" fill="none" strokeWidth="7" strokeLinecap="round" />

            {/* ছাদের কাঠামো (শুধু রেখা) */}
            <path
              d="M436 288 C436 194 468 164 508 164 C556 164 598 198 598 288"
              fill="none"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path d="M436 288 L436 312" fill="none" strokeWidth="9" strokeLinecap="round" />
            <path d="M598 288 L598 306" fill="none" strokeWidth="9" strokeLinecap="round" />
          </g>
        </mask>

        {/* ---------- রিকশার হালকা ছায়া ---------- */}
        <mask id="hpMaskSoft" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="480">
          <g fill="#fff" stroke="#fff">
            {/* ছাদের ক্যানভাস */}
            <path d="M436 288 C436 194 468 164 508 164 C556 164 598 198 598 288 Z" stroke="none" />
            {/* দ্বিতীয় পেছনের চাকা — গভীরতা */}
            <circle cx="508" cy="344" r="55" fill="none" strokeWidth="8" opacity="0.7" />
            {/* যাত্রীর আসন */}
            <rect x="452" y="246" width="128" height="16" rx="8" stroke="none" opacity="0.7" />
          </g>
        </mask>
      </defs>

      {/* পটভূমির আভা */}
      <circle cx="330" cy="236" r="250" fill="url(#hpGlow)" />

      {/* মাটির রেখা */}
      <g fill="#a1a1aa" opacity="0.35">
        {Array.from({ length: 26 }).map((_, i) => (
          <circle key={`g${i}`} cx={44 + i * 22} cy={420} r={i % 3 === 0 ? 1.7 : 1.1} />
        ))}
      </g>

      {/* ডট-স্তরগুলো */}
      <rect width="640" height="480" fill="url(#hpDotsSoft)" mask="url(#hpMaskSoft)" />
      <rect width="640" height="480" fill="url(#hpDotsRickshaw)" mask="url(#hpMaskRickshaw)" />
      <rect width="640" height="480" fill="url(#hpDotsPerson)" mask="url(#hpMaskPerson)" />

      {/* অরেঞ্জ অ্যাকসেন্ট — মুঠি ও হ্যান্ডেলের চারপাশে */}
      <g>
        {accents.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.r}
            fill={accent}
            opacity="0.9"
            style={{ animation: `dot-rise 4.5s ease-in-out ${d.d}s infinite` }}
          />
        ))}
      </g>
    </svg>
  );
};

export default HeroArt;
