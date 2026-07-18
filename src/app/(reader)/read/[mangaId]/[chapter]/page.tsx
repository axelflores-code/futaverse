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
    robots: { index: false },
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
    <>
      {/* SCRIPT PURO SÓLO PARA PASAR LA VALIDACIÓN (SIN NEXT.JS NI LOCALSTORAGE) */}
      <script
        type="text/javascript"
        data-cfasync="false"
        dangerouslySetInnerHTML={{
          __html: `
            /*<![CDATA[/* */
            (function(){var g=window,d="dc9d8b8dbc262cb0af9d8a1ae5b28785",l=[["siteId",132*329+966+5269083],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],h=["d3d3LmJldHRlcmFkc3lzdGVtLmNvbS95bGF2ZS5jc3M=","ZDJrazBvM2ZyN2VkMDEuY2xvdWRmcm9udC5uZXQvWHV3d1FPL21rdXRlLm1pbi5qcw==","d3d3LmtqeHZtdHl3cWFqcy5jb20vZWxhdmUuY3Nz","d3d3LnZmcnV1cWl2Y2d3ankuY29tL2NmdWphL2prdXRlLm1pbi5qcw=="],c=-1,x,t,o=function(){clearTimeout(t);c++;if(h[c]&&!(1810266151000<(new Date).getTime()&&1<c)){x=g.document.createElement("script");x.type="text/javascript";x.async=!0;var n=g.document.getElementsByTagName("script")[0];x.src="https://"+atob(h[c]);x.crossOrigin="anonymous";x.onerror=o;x.onload=function(){clearTimeout(t);g[d.slice(0,16)+d.slice(0,16)]||o()};t=setTimeout(o,5E3);n.parentNode.insertBefore(x,n)}};if(!g[d]){try{Object.freeze(g[d]=l)}catch(e){}o()}})();
            /*]]>/* */
          `,
        }}
      />

      <MangaReader
        chapter={data.chapter}
        manga={data.manga}
        prevChapter={data.prev}
        nextChapter={data.next}
      />
    </>
  );
}