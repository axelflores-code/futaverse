import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MangaReader } from '@/components/reader/MangaReader';
import { getChapterWithAdjacentNav } from '@/lib/queries/chapters';
import Script from 'next/script';

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
      {/* INYECCIÓN DINÁMICA CON EL NUEVO SCRIPT ORIGINAL (FRENTE A MINIFICACIÓN DE NEXT.JS) */}
      <Script
        id="popads-new-bypass"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              // Doble capa de seguridad para evitar que te sature mientras el bot revisa:
              // Si ya se abrió un popad en las últimas 24h, detenemos el script de inmediato.
              var last = localStorage.getItem('popads_last_shown');
              if (last && (Date.now() - parseInt(last, 10)) < 24 * 60 * 60 * 1000) return;

              var script = document.createElement('script');
              script.type = 'text/javascript';
              script.setAttribute('data-cfasync', 'false');
              
              // Aquí metemos tu código exacto simulando los saltos de línea reales (\\n) que busca el bot.
              // Cambié el límite interno a "1" para que no le salte a cada rato al mismo usuario.
              script.text = "/*<![CDATA[/* */\\n" +
                "(function(){var f=window,g=\\"dc9d8b8dbc262cb0af9d8a1ae5b28785\\",x=[[\\"siteId\\",109*525+559-522-717+5256932],[\\"popundersPerIP\\",\\"1\\"],[\\"delayBetween\\",0],[\\"default\\",false],[\\"defaultPerDay\\",0],[\\"topmostLayer\\",\\"auto\\"]],b=[\\"d3d3LmJldHRlcmFkc3lzdGVtLmNvbS91bGF2ZS5jc3M=\\",\\"ZDJrazBvM2ZyN2VkMDEuY2xvdWRmcm9udC5uZXQvcld3eWl6L21rdXRlLm1pbi5qcw==\\",\\"d3d3Lmh6YmJkdG92LmNvbS9sbGF2ZS5jc3M=\\",\\"d3d3LmtqeHZtdHl3cWFqcy5jb20vR0huYy9qa3V0ZS5taW4uanM=\\"],s=-1,i,d,c=function(){clearTimeout(d);s++;if(b[s]&&!(1810267568000<(new Date).getTime()&&1<s)){i=f.document.createElement(\\"script\\");i.type=\\"text/javascript\\";i.async=!0;var e=f.document.getElementsByTagName(\\"script\\")[0];i.src=\\"https://\\"+atob(b[s]);i.crossOrigin=\\"anonymous\\";i.onerror=c;i.onload=function(){clearTimeout(d);f[g.slice(0,16)+g.slice(0,16)]||c()};d=setTimeout(c,5E3);e.parentNode.insertBefore(i,e)}};if(!f[g]){try{Object.freeze(f[g]=x)}catch(e){}c()}})();\\n" +
                "/*]]>/* */";
              
              document.head.appendChild(script);

              // Registrar que ya saltó para bloquearlo por 24 horas
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
  );
}