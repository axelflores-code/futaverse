import {
  unstable_cache,
} from 'next/cache'

import {
  createPublicClient,
} from '@/lib/supabase/public'

import type {
  Tag,
  TagNamespace,
} from '@/types/manga'

const getCachedTags =
  unstable_cache(
    async (
      namespace?: TagNamespace
    ): Promise<Tag[]> => {
      const supabase =
        createPublicClient()

      let query = supabase
        .from('tags')
        .select(`
          id,
          name,
          slug,
          namespace,
          usage_count
        `)
        /*
         * Evitamos mostrar filtros
         * prácticamente vacíos.
         */
        .gte(
          'usage_count',
          2
        )
        .order(
          'usage_count',
          {
            ascending: false,
          }
        )
        .order(
          'name',
          {
            ascending: true,
          }
        )

      if (namespace) {
        query = query.eq(
          'namespace',
          namespace
        )
      }

      const {
        data,
        error,
      } = await query

      if (error) {
        throw new Error(
          `Error cargando tags: ${error.message}`
        )
      }

      return (
        data ?? []
      ).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,

        namespace:
          row.namespace as
            TagNamespace,

        usageCount:
          row.usage_count ?? 0,
      }))
    },
    [
      'mangafuta-filter-tags-v2',
    ],
    {
      revalidate: 3600,
      tags: [
        'mangafuta-tags',
      ],
    }
  )

export async function getAllTags(
  namespace?: TagNamespace
): Promise<Tag[]> {
  return getCachedTags(
    namespace
  )
}