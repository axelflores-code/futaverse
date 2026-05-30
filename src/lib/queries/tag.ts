import { createClient } from '@/lib/supabase/server'
import type { Tag, TagNamespace } from '@/types/manga'

export async function getAllTags(namespace?: TagNamespace): Promise<Tag[]> {
  const supabase = await createClient()
  let query = supabase
    .from('tags')
    .select('*')
    .order('usage_count', { ascending: false })
  if (namespace) query = query.eq('namespace', namespace)
  const { data } = await query
  return (data ?? []).map(r => ({
    id:         r.id,
    name:       r.name,
    slug:       r.slug,
    namespace:  r.namespace as TagNamespace,
    usageCount: r.usage_count,
  }))
}