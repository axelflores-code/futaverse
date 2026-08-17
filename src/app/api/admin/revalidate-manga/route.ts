import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  revalidateMangaContent,
} from '@/lib/cache/revalidate-manga'

interface RequestBody {
  slug?: string
  previousSlug?: string
  tagSlugs?: string[]
}

export async function POST(
  request: Request
) {
  try {
    const supabase =
      await createClient()

    /*
     * Confirmamos la sesión desde el servidor.
     * No confiamos únicamente en el formulario.
     */
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            'No has iniciado sesión.',
        },
        {
          status: 401,
        }
      )
    }

    /*
     * Confirmamos que el usuario realmente
     * tiene permisos de administrador.
     */
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      throw new Error(
        profileError.message
      )
    }

    if (
      profile?.role !== 'admin'
    ) {
      return NextResponse.json(
        {
          error:
            'No tienes permisos de administrador.',
        },
        {
          status: 403,
        }
      )
    }

    const body =
      (await request.json()) as
        RequestBody

    const slug =
      typeof body.slug === 'string'
        ? body.slug.trim()
        : undefined

    const previousSlug =
      typeof body.previousSlug ===
      'string'
        ? body.previousSlug.trim()
        : undefined

    const tagSlugs =
      Array.isArray(body.tagSlugs)
        ? body.tagSlugs
            .filter(
              (
                value
              ): value is string =>
                typeof value ===
                'string'
            )
            .map((value) =>
              value.trim()
            )
            .filter(Boolean)
        : []

    if (
      !slug &&
      !previousSlug
    ) {
      return NextResponse.json(
        {
          error:
            'Falta el slug del manga.',
        },
        {
          status: 400,
        }
      )
    }

    revalidateMangaContent({
      slug,
      previousSlug,
      tagSlugs,
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(
      'Error invalidando caché:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error inesperado.',
      },
      {
        status: 500,
      }
    )
  }
}