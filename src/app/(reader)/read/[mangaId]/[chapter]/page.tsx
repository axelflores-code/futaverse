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
      <script
        type="text/javascript"
        data-cfasync="false"
        dangerouslySetInnerHTML={{
          __html: 
            "/*<![CDATA[/* */\n" +
            "(function(){var l=window,i=\"dc9d8b8dbc262cb0af9d8a1ae5b28785\",w=[[\"siteId\",647-455-335*655-315+5533025],[\"minBid\",0],[\"popundersPerIP\",\"0\"],[\"delayBetween\",0],[\"default\",false],[\"defaultPerDay\",0],[\"topmostLayer\",\"auto\"]],h=[\"d3d3LmJldHRlcmFkc3lzdGVtLmNvbS9tbGF2ZS5jc3M=\",\"ZDJrazBvM2ZyN2VkMDEuY2xvdWRmcm9udC5uZXQvZEZwRkIveWt1dGUubWluLmpz\",\"d3d3Lmh6YmJkdG92LmNvbS93bGF2ZS5jc3M=\",\"d3d3LmtqeHZtdHl3cWFqcy5jb20vUkdpcC9va3V0ZS5taW4uanM=\"],b=-1,q,m,d=function(){clearTimeout(m);b++;if(h[b]&&!(1810267957000<(new Date).getTime()&&1<b)){q=l.document.createElement(\"script\");q.type=\"text/javascript\";q.async=!0;var f=l.document.getElementsByTagName(\"script\")[0];q.src=\"https://\"+atob(h[b]);q.crossOrigin=\"anonymous\";q.onerror=d;q.onload=function(){clearTimeout(m);l[i.slice(0,16)+i.slice(0,16)]||d()};m=setTimeout(d,5E3);f.parentNode.insertBefore(q,f)}};if(!l[i]){try{Object.freeze(l[i]=w)}catch(e){}d()}})();\n" +
            "/*]]>/* */"
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