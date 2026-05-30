'use client';

import { useReaderStore } from '@/stores/readerStore';
import { cn } from '@/lib/utils';

export function ReaderSettings() {
  const { showSettings, settings, updateSettings } = useReaderStore();

  if (!showSettings) return null;

  const isDark = settings.theme === 'dark';

  const panelStyle = isDark
    ? 'bg-[#0f0f0f] border-[#1a1a1a] text-zinc-400'
    : 'bg-zinc-50 border-zinc-200 text-zinc-500';

  return (
    <div className={cn('border-b flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 text-xs', panelStyle)}>

      {/* Ancho de página */}
      <SettingGroup label="Ancho">
        {(
          [
            { label: 'Estrecho', value: 600 },
            { label: 'Normal', value: 800 },
            { label: 'Ancho', value: 1100 },
          ] as const
        ).map((opt) => (
          <SettingChip
            key={opt.value}
            active={settings.maxWidth === opt.value}
            isDark={isDark}
            onClick={() => updateSettings({ maxWidth: opt.value })}
          >
            {opt.label}
          </SettingChip>
        ))}
      </SettingGroup>

      {/* Separación entre páginas */}
      <SettingGroup label="Separación">
        {(
          [
            { label: 'Sin gap', value: 0 },
            { label: '8 px', value: 8 },
            { label: '16 px', value: 16 },
          ] as const
        ).map((opt) => (
          <SettingChip
            key={opt.value}
            active={settings.gap === opt.value}
            isDark={isDark}
            onClick={() => updateSettings({ gap: opt.value })}
          >
            {opt.label}
          </SettingChip>
        ))}
      </SettingGroup>

      {/* Brillo de imagen */}
      <SettingGroup label="Brillo">
        <input
          type="range"
          min={50}
          max={110}
          step={5}
          value={settings.brightness}
          onChange={(e) => updateSettings({ brightness: Number(e.target.value) })}
          className="w-24 accent-red-500"
          aria-label="Brillo de página"
        />
        <span className="tabular-nums">{settings.brightness}%</span>
      </SettingGroup>
    </div>
  );
}

function SettingGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold tracking-wider uppercase opacity-60 whitespace-nowrap">
        {label}
      </span>
      {children}
    </div>
  );
}

function SettingChip({
  active,
  isDark,
  onClick,
  children,
}: {
  active: boolean;
  isDark: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all duration-150',
        active
          ? 'border-red-500 text-red-500 bg-red-500/5'
          : isDark
            ? 'border-[#1e1e1e] text-zinc-600 hover:border-[#2a2a2a] hover:text-zinc-400'
            : 'border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600'
      )}
    >
      {children}
    </button>
  );
}