'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useReaderStore } from '@/stores/readerStore';
import { cn } from '@/lib/utils';

interface ReaderPageProps {
  src: string;
  index: number;
  mangaTitle: string;
  chapterNumber: number;
  onVisible: (index: number) => void;
}

export function ReaderPage({
  src,
  index,
  mangaTitle,
  chapterNumber,
  onVisible,
}: ReaderPageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [isIntersecting, setIsIntersecting] = useState(false);
  const { settings } = useReaderStore();

  // Intersection Observer para lazy loading
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          onVisible(index);
          observer.disconnect(); // Solo necesitamos el primer trigger
        }
      },
      { rootMargin: '300px 0px' } // Pre-cargar 300px antes de entrar al viewport
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [index, onVisible]);

  // Comenzar a cargar cuando entra en el área de pre-carga
  useEffect(() => {
    if (isIntersecting && state === 'idle') {
      setState('loading');
    }
  }, [isIntersecting, state]);

  const isDark = settings.theme === 'dark';

  return (
    <div
      ref={wrapRef}
      className="relative w-full flex justify-center"
      style={{ maxWidth: settings.maxWidth }}
    >
      {/* Skeleton mientras carga */}
      {state !== 'loaded' && (
        <div
          className={cn(
            'w-full',
            isDark ? 'bg-[#141414]' : 'bg-zinc-200',
            state === 'loading' && 'animate-pulse'
          )}
          style={{ aspectRatio: '11 / 16' }}
          aria-hidden="true"
        />
      )}

      {/* Imagen real — solo renderizar si está en zona de pre-carga */}
      {state !== 'idle' && (
        <Image
          src={src}
          alt={`${mangaTitle} — Capítulo ${chapterNumber}, página ${index + 1}`}
          width={800}
          height={1200}
          priority={index < 2} // Las primeras 2 páginas son prioritarias
          loading={index < 2 ? 'eager' : 'lazy'}
          quality={90}
          className={cn(
            'block w-full h-auto transition-opacity duration-300',
            state === 'loaded' ? 'opacity-100' : 'opacity-0 absolute inset-0',
            // Filtro de brillo para el modo de lectura
            settings.brightness !== 100 && `brightness-[${settings.brightness / 100}]`
          )}
          style={{
            filter: settings.brightness !== 100
              ? `brightness(${settings.brightness / 100})`
              : undefined,
          }}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
        />
      )}

      {/* Estado de error */}
      {state === 'error' && (
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-2',
            isDark ? 'text-zinc-700' : 'text-zinc-400'
          )}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span className="text-xs">Error al cargar la página</span>
          <button
            onClick={() => setState('loading')}
            className="text-xs text-red-500 hover:text-red-400 underline underline-offset-2"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Número de página */}
      {state === 'loaded' && (
        <span
          className={cn(
            'absolute bottom-3 right-3 text-[11px] px-1.5 py-0.5 rounded',
            'tabular-nums pointer-events-none select-none',
            isDark
              ? 'bg-black/60 text-zinc-500'
              : 'bg-white/70 text-zinc-400'
          )}
        >
          {index + 1}
        </span>
      )}
    </div>
  );
}