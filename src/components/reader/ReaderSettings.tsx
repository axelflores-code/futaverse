'use client'
 
import { useReaderStore } from '@/stores/readerStore'
import { cn } from '@/lib/utils'
 
export function ReaderSettings() {
  const { showSettings, settings, updateSettings } = useReaderStore()
 
  if (!showSettings) return null
 
  const isDark = settings.theme === 'dark'
 
  const panelStyle = isDark
    ? 'bg-[#0f0f0f] border-[#1a1a1a] text-zinc-400'
    : 'bg-zinc-50 border-zinc-200 text-zinc-500'
 
  return (
    <div
      className={cn(
        // Desktop: barra horizontal
        'hidden md:flex border-b flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 text-xs',
        // Móvil: panel vertical fijo en la parte inferior
        panelStyle
      )}
    >
      <SettingGroup label="Ancho">
        {([
          { label: 'Estrecho', value: 900  },
          { label: 'Normal',   value: 1100 },
          { label: 'Ancho',    value: 1400 },
        ] as const).map((opt) => (
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
 
      <SettingGroup label="Separación">
        {([
          { label: 'Sin gap', value: 0  },
          { label: '8 px',   value: 8  },
          { label: '16 px',  value: 16 },
        ] as const).map((opt) => (
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
  )
}
 
// Panel móvil separado — va pegado al fondo de pantalla
export function ReaderSettingsMobile() {
  const { showSettings, settings, updateSettings, setShowSettings } = useReaderStore()
 
  if (!showSettings) return null
 
  const isDark = settings.theme === 'dark'
 
  return (
    <div
      className="md:hidden fixed bottom-10 left-0 right-0 z-50 px-4 py-4 flex flex-col gap-4"
      style={{
        background: isDark ? 'rgba(15,15,15,0.97)' : 'rgba(250,250,250,0.97)',
        borderTop: isDark ? '1px solid #1a1a1a' : '1px solid #e5e5e5',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header del panel móvil */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase"
          style={{ color: isDark ? '#555' : '#999' }}
        >
          Ajustes del lector
        </span>
        <button
          onClick={() => setShowSettings(false)}
          className="text-xs px-2 py-1 rounded"
          style={{ color: isDark ? '#555' : '#999' }}
        >
          Cerrar ✕
        </button>
      </div>
 
      {/* Ancho */}
      <div>
        <p className="text-[10px] font-semibold tracking-wider uppercase mb-2"
          style={{ color: isDark ? '#444' : '#aaa' }}
        >
          Ancho de página
        </p>
        <div className="flex gap-2">
          {([
            { label: 'Estrecho', value: 900  },
            { label: 'Normal',   value: 1100 },
            { label: 'Ancho',    value: 1400 },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateSettings({ maxWidth: opt.value })}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: settings.maxWidth === opt.value
                  ? 'rgba(196,149,106,0.15)'
                  : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                border: settings.maxWidth === opt.value
                  ? '1px solid #C4956A'
                  : isDark ? '1px solid #222' : '1px solid #ddd',
                color: settings.maxWidth === opt.value
                  ? '#C4956A'
                  : isDark ? '#555' : '#999',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
 
      {/* Tema */}
      <div>
        <p className="text-[10px] font-semibold tracking-wider uppercase mb-2"
          style={{ color: isDark ? '#444' : '#aaa' }}
        >
          Tema
        </p>
        <div className="flex gap-2">
          {([
            { label: '🌙 Oscuro', value: 'dark'  },
            { label: '☀️ Claro',  value: 'light' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateSettings({ theme: opt.value })}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: settings.theme === opt.value
                  ? 'rgba(196,149,106,0.15)'
                  : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                border: settings.theme === opt.value
                  ? '1px solid #C4956A'
                  : isDark ? '1px solid #222' : '1px solid #ddd',
                color: settings.theme === opt.value
                  ? '#C4956A'
                  : isDark ? '#555' : '#999',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
 
      {/* Brillo */}
      <div>
        <p className="text-[10px] font-semibold tracking-wider uppercase mb-2"
          style={{ color: isDark ? '#444' : '#aaa' }}
        >
          Brillo: {settings.brightness}%
        </p>
        <input
          type="range"
          min={50}
          max={110}
          step={5}
          value={settings.brightness}
          onChange={(e) => updateSettings({ brightness: Number(e.target.value) })}
          className="w-full accent-red-500"
          aria-label="Brillo"
        />
      </div>
    </div>
  )
}
 
function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold tracking-wider uppercase opacity-60 whitespace-nowrap">
        {label}
      </span>
      {children}
    </div>
  )
}
 
function SettingChip({
  active, isDark, onClick, children,
}: {
  active: boolean; isDark: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all duration-150"
      style={{
        background:   active ? 'rgba(196,149,106,0.10)' : 'transparent',
        borderColor:  active ? '#C4956A' : isDark ? '#1e1e1e' : '#e5e5e5',
        color:        active ? '#C4956A' : isDark ? '#555' : '#aaa',
      }}
    >
      {children}
    </button>
  )
}
 