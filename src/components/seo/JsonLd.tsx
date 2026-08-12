interface JsonLdProps {
  type: string
  data: Record<string, unknown>
}

export function JsonLd({
  type,
  data,
}: JsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  }

  /*
   * Reemplazar "<" evita que un título o descripción
   * pueda cerrar accidentalmente la etiqueta script.
   */
  const serialized = JSON.stringify(
    jsonLd
  ).replace(/</g, '\\u003c')

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serialized,
      }}
    />
  )
}