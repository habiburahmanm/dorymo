import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** stagger in milliseconds */
  delay?: number;
}

/** Fades + slides content in when it enters the viewport (IntersectionObserver). */
export const Reveal: React.FC<RevealProps> = ({ children, className, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn('reveal', visible && 'reveal-visible', className)}
    >
      {children}
    </div>
  );
};

export default Reveal;
