
'use client';

import { useReaderStore } from '@/stores/readerStore';
import { cn } from '@/lib/utils';

interface ReaderBottombarProps {
  totalPages: number;
}

export function ReaderBottombar({ totalPages }: ReaderBottombarProps) {
  const { currentPage, setPage, settings } = useReaderStore();
  const isDark = settings.theme === 'dark';

  const displayPage = currentPage + 1;
  const pct = totalPages > 1 ? Math.round((currentPage / (totalPages - 1)) * 100) : 0;

  const barStyle = isDark
    ? 'bg-[#111] border-[#1e1e1e] text-zinc-500'
    : 'bg-white border-zinc-200 text-zinc-400';

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = Number(e.target.value) - 1;
    setPage(page);

    // Hacer scroll a la página seleccionada
    const pageEls = document.querySelectorAll('[data-page-index]');
    const target = pageEls[page];
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <footer
      className={cn(
        'sticky bottom-0 z-40 h-10 flex items-center gap-3 px-4 border-t',
        barStyle
      )}
    >
      <span className="text-xs tabular-nums whitespace-nowrap min-w-[72px]">
        Pág. {displayPage} / {totalPages}
      </span>

      <input
        type="range"
        min={1}
        max={totalPages}
        value={displayPage}
        step={1}
        onChange={handleSliderChange}
        className="flex-1 accent-red-500 cursor-pointer"
        aria-label="Navegar a página"
      />

      <span className="text-xs tabular-nums min-w-[32px] text-right">{pct}%</span>
    </footer>
  );
}