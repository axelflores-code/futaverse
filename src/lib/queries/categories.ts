import {
  unstable_cache,
} from 'next/cache'

import {
  createPublicClient,
} from '@/lib/supabase/public'

import type {
  Category,
} from '@/types/manga'

const getCachedCategories =
  unstable_cache(
    async (): Promise<
      Category[]
    > => {
      const supabase =
        createPublicClient()

      const {
        data,
        error,
      } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          description,
          color_hex,
          sort_order
        `)
        .order('sort_order', {
          ascending: true,
        })

      if (error) {
        throw new Error(
          `Error cargando categorías: ${error.message}`
        )
      }

      return (
        data ?? []
      ).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description:
          row.description,
        colorHex:
          row.color_hex,
        sortOrder:
          row.sort_order,
      }))
    },
    [
      'mangafuta-categories-v2',
    ],
    {
      revalidate: 3600,
      tags: [
        'mangafuta-categories',
      ],
    }
  )

export async function getAllCategories():
  Promise<Category[]> {
  return getCachedCategories()
}