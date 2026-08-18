interface MangaMetadataInput {
  title: string

  description:
    | string
    | null

  seoTitle?:
    | string
    | null

  seoDescription?:
    | string
    | null

  tags?: Array<{
    name: string
    namespace?: string
  }>
}

function normalizeText(
  value: string
): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateText(
  value: string,
  maximumLength: number
): string {
  if (
    value.length <=
    maximumLength
  ) {
    return value
  }

  const shortened =
    value.slice(
      0,
      maximumLength - 1
    )

  const lastSpace =
    shortened.lastIndexOf(' ')

  const safeText =
    lastSpace > 30
      ? shortened.slice(
          0,
          lastSpace
        )
      : shortened

  return `${safeText.trim()}…`
}

export function buildMangaSeoTitle({
  title,
  seoTitle,
}: Pick<
  MangaMetadataInput,
  'title' | 'seoTitle'
>): string {
  return truncateText(
    normalizeText(
      seoTitle?.trim() ||
      title
    ),
    58
  )
}

export function buildMangaSeoDescription({
  title,
  description,
  seoDescription,
  tags = [],
}: MangaMetadataInput): string {
  /*
   * Una metadescripción manual tiene
   * prioridad, pero no reemplaza la
   * descripción visible.
   */
  if (
    seoDescription?.trim()
  ) {
    return truncateText(
      normalizeText(
        seoDescription
      ),
      160
    )
  }

  /*
   * Si no existe una versión SEO,
   * utilizamos la descripción creada
   * por tu programa.
   */
  if (
    description?.trim()
  ) {
    return truncateText(
      normalizeText(
        description
      ),
      160
    )
  }

  /*
   * Solo si el manga no tiene ninguna
   * descripción se genera un respaldo.
   */
  const usefulTags =
    tags
      .filter(
        (tag) =>
          tag.namespace !==
          'content_warning'
      )
      .slice(0, 3)
      .map(
        (tag) =>
          tag.name
      )

  const tagText =
    usefulTags.length > 0
      ? ` relacionado con ${usefulTags.join(', ')}`
      : ''

  return truncateText(
    `Lee ${normalizeText(title)} en español en MangaFuta. Explora este manga${tagText} y descubre otras obras relacionadas.`,
    160
  )
}