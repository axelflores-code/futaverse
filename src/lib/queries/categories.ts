import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types/manga'

export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
  return (data ?? []).map(r => ({
    id:          r.id,
    name:        r.name,
    slug:        r.slug,
    description: r.description,
    colorHex:    r.color_hex,
    sortOrder:   r.sort_order,
  }))
}