import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MangaReader } from '@/components/reader/MangaReader';
import { getChapterWithAdjacentNav } from '@/lib/queries/chapters';

interface PageProps {
  params: Promise<{ mangaId: string; chapter: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mangaId, chapter } = await params;
  const data = await getChapterWithAdjacentNav(mangaId, Number(chapter));

  if (!data) return { title: 'Capítulo no encontrado' };

  return {
    title: `${data.manga.title} — Capítulo ${chapter}`,
    description: `Lee ${data.manga.title} capítulo ${chapter} gratis en MangaFuta.`,
    robots: { index: false }, // No indexar páginas del lector
  };
}

export default async function ReaderPage({ params }: PageProps) {
  const { mangaId, chapter } = await params;
  const chapterNum = Number(chapter);

  if (isNaN(chapterNum)) notFound();

  const data = await getChapterWithAdjacentNav(mangaId, chapterNum);

  if (!data) notFound();

  // Incrementar contador de vistas (fire-and-forget)
  const supabase = await createClient();
  supabase
    .from('chapters')
    .update({ views: Number(data.chapter.views) + 1 })
    .eq('id', data.chapter.id)
    .then(() => {});

  return (
    <MangaReader
      chapter={data.chapter}
      manga={data.manga}
      prevChapter={data.prev}
      nextChapter={data.next}
    />
  );
}