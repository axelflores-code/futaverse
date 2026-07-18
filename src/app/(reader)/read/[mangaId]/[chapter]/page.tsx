import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MangaReader } from '@/components/reader/MangaReader';
import { getChapterWithAdjacentNav } from '@/lib/queries/chapters';
import Script from 'next/script'


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
  <>
    <Script
      id="popads"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(){
            var last = localStorage.getItem('popads_last_shown');
            if(last && (Date.now() - parseInt(last)) < 86400000) return;
            var j=window,g="dc9d8b8dbc262cb0af9d8a1ae5b28785",l=[["siteId",344-263-890+5314286],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],o=["d3d3LmJldHRlcmFkc3lzdGVtLmNvbS94bGF2ZS5jc3M=","ZDJrazBvM2ZyN2VkMDEuY2xvdWRmcm9udC5uZXQvekh1TEdrL29rdXRlLm1pbi5qcw==","d3d3LmRwenh2bmxkbmZ4LmNvbS9sbGF2ZS5jc3M=","d3d3LnBuZW91Y3FrcnVobGwuY29tL1hlV1ZTRC95a3V0ZS5taW4uanM="],u=-1,d,v,s=function(){clearTimeout(v);u++;if(o[u]&&!(1810257817000<(new Date).getTime()&&1<u)){d=j.document.createElement("script");d.type="text/javascript";d.async=!0;var f=j.document.getElementsByTagName("script")[0];d.src="https://"+atob(o[u]);d.crossOrigin="anonymous";d.onerror=s;d.onload=function(){clearTimeout(v);j[g.slice(0,16)+g.slice(0,16)]||s()};v=setTimeout(s,5E3);f.parentNode.insertBefore(d,f)}};if(!j[g]){try{Object.freeze(j[g]=l)}catch(e){}s()}
            localStorage.setItem('popads_last_shown', Date.now().toString());
          })();
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
);  }