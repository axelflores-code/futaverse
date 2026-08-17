import {
  revalidatePath,
  revalidateTag,
} from 'next/cache'

interface RevalidateMangaOptions {
  slug?: string | null
  previousSlug?: string | null
  tagSlugs?: string[]
}

const MANGA_CACHE_TAGS = [
  'mangafuta-home',
  'mangafuta-mangas',
  'mangafuta-tags',
  'mangafuta-related',
  'manga-catalog',
] as const

export function revalidateMangaContent({
  slug,
  previousSlug,
  tagSlugs = [],
}: RevalidateMangaOptions = {}): void {
  for (
    const tag of
    MANGA_CACHE_TAGS
  ) {
    revalidateTag(
      tag,
      {
        expire: 0,
      }
    )
  }

  revalidatePath('/')
  revalidatePath('/manga')
  revalidatePath('/tags')
  revalidatePath(
    '/sitemap.xml'
  )

  if (slug) {
    revalidatePath(
      `/manga/${slug}`
    )
  }

  if (
    previousSlug &&
    previousSlug !== slug
  ) {
    revalidatePath(
      `/manga/${previousSlug}`
    )
  }

  const uniqueTagSlugs =
    [...new Set(tagSlugs)]

  for (
    const tagSlug of
    uniqueTagSlugs
  ) {
    if (!tagSlug) {
      continue
    }

    revalidatePath(
      `/tag/${tagSlug}`
    )
  }
}