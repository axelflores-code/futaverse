'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MangaCard } from './MangaCard'
import type {
  Manga,
  Category,
  Tag,
  TagNamespace,
} from '@/types/manga'

interface MangaCatalogProps {
  initialMangas: Manga[]
  categories: Category[]
  tags: Tag[]
  total: number
  order: string
  period: string
  activeCategory?: string
  activeTag?: string
}

const NS_LABELS: Record<string, string> = {
  theme: 'Tema',
  trope: 'Tropo',
  setting: 'Ambientación',
  format: 'Formato',
  content_warning: 'Advertencias',
}

const TAG_NAMESPACES: TagNamespace[] = [
  'theme',
  'trope',
  'setting',
  'format',
  'content_warning',
]

export function MangaCatalog({
  initialMangas,
  categories,
  tags,
  total,
  order,
  period,
  activeCategory,
  activeTag,
}: MangaCatalogProps) {
  const [showFilters, setShowFilters] = useState(false)

  const hasContentFilter =
    Boolean(activeCategory) || Boolean(activeTag)

  function createHref(
    changes: Record<string, string | undefined>
  ) {
    const params = new URLSearchParams()

    if (order !== 'recent') {
      params.set('order', order)
    }

    if (order === 'popular') {
      params.set('period', period)
    }

    if (activeCategory) {
      params.set('category', activeCategory)
    }

    if (activeTag) {
      params.set('tag', activeTag)
    }

    for (const [key, value] of Object.entries(changes)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }

    params.delete('page')

    if (params.get('order') !== 'popular') {
      params.delete('period')
    }

    if (params.get('order') === 'recent') {
      params.delete('order')
    }

    const query = params.toString()

    return query ? `/manga?${query}` : '/manga'
  }

  const tabStyle = (active: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap' as const,
    minHeight: '38px',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: active ? 700 : 500,
    textDecoration: 'none',
    color: active ? '#f0ece8' : 'rgba(190,182,174,0.75)',
    background: active
      ? 'rgba(196,149,106,0.16)'
      : 'rgba(255,255,255,0.04)',
    border: active
      ? '1px solid rgba(196,149,106,0.7)'
      : '1px solid rgba(255,255,255,0.08)',
  })

  const filterButtonStyle = (
    active: boolean,
    activeColor = '#C4956A'
  ) => ({
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: active ? 700 : 400,
    textDecoration: 'none',
    border: active
      ? `1px solid ${activeColor}`
      : '1px solid rgba(255,255,255,0.09)',
    background: active
      ? `${activeColor}20`
      : 'rgba(255,255,255,0.02)',
    color: active
      ? activeColor
      : 'rgba(190,182,174,0.82)',
  })

  return (
    <div>
      {/* Navegación principal */}
      <div
        className="catalog-navigation"
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '14px',
        }}
      >
        <Link
          href={createHref({
            order: undefined,
            period: undefined,
          })}
          style={tabStyle(order === 'recent')}
        >
          Recientes
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px',
            borderRadius: '9px',
            background: '#111118',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span
            style={{
              padding: '0 7px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'rgba(190,182,174,0.65)',
              whiteSpace: 'nowrap',
            }}
          >
            Populares:
          </span>

          {[
            ['today', 'Hoy'],
            ['week', 'Semana'],
            ['month', 'Mes'],
            ['all', 'Siempre'],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={createHref({
                order: 'popular',
                period: value,
              })}
              style={{
                ...tabStyle(
                  order === 'popular' &&
                    period === value
                ),
                minHeight: '30px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        <Link
          href={createHref({
            order: 'rating',
            period: undefined,
          })}
          style={tabStyle(order === 'rating')}
        >
          Mejor valorados
        </Link>

        <Link
          href={createHref({
            order: 'oldest',
            period: undefined,
          })}
          style={tabStyle(order === 'oldest')}
        >
          Antiguos
        </Link>
      </div>

      {/* Resumen y botón de filtros */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <button
          type="button"
          onClick={() =>
            setShowFilters((current) => !current)
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            color:
              showFilters || hasContentFilter
                ? '#C4956A'
                : 'rgba(190,182,174,0.8)',
            background:
              showFilters || hasContentFilter
                ? 'rgba(196,149,106,0.10)'
                : 'rgba(255,255,255,0.04)',
            border:
              showFilters || hasContentFilter
                ? '1px solid rgba(196,149,106,0.65)'
                : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <i
            className="fi fi-rr-filter"
            style={{ fontSize: '13px' }}
          />

          Filtrar contenido

          {hasContentFilter && (
            <span
              style={{
                minWidth: '18px',
                height: '18px',
                padding: '0 5px',
                borderRadius: '9px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700,
                color: '#0b0c10',
                background: '#C4956A',
              }}
            >
              {Number(Boolean(activeCategory)) +
                Number(Boolean(activeTag))}
            </span>
          )}
        </button>

        <span
          style={{
            fontSize: '12px',
            color: 'rgba(130,122,114,0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          {total.toLocaleString()} resultado
          {total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtros seleccionados */}
      {hasContentFilter && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '7px',
            marginBottom: '14px',
          }}
        >
          {activeCategory && (
            <Link
              href={createHref({
                category: undefined,
              })}
              style={{
                ...filterButtonStyle(true),
                display: 'inline-flex',
                gap: '6px',
                alignItems: 'center',
              }}
            >
              {categories.find(
                (item) =>
                  item.slug === activeCategory
              )?.name ?? activeCategory}
              <span>×</span>
            </Link>
          )}

          {activeTag && (
            <Link
              href={createHref({
                tag: undefined,
              })}
              style={{
                ...filterButtonStyle(true, '#3D7AD6'),
                display: 'inline-flex',
                gap: '6px',
                alignItems: 'center',
              }}
            >
              {tags.find(
                (item) => item.slug === activeTag
              )?.name ?? activeTag}
              <span>×</span>
            </Link>
          )}

          <Link
            href={createHref({
              category: undefined,
              tag: undefined,
            })}
            style={{
              padding: '6px 4px',
              fontSize: '12px',
              color: 'rgba(190,182,174,0.6)',
              textDecoration: 'underline',
            }}
          >
            Limpiar
          </Link>
        </div>
      )}

      {/* Panel de contenido */}
      {showFilters && (
        <div
          style={{
            padding: '18px',
            marginBottom: '20px',
            borderRadius: '12px',
            background: '#111118',
            border:
              '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {categories.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <p className="catalog-filter-title">
                Categoría o formato
              </p>

              <div className="catalog-filter-options">
                {categories.map((category) => {
                  const active =
                    activeCategory === category.slug

                  return (
                    <Link
                      key={category.id}
                      href={createHref({
                        category: active
                          ? undefined
                          : category.slug,
                      })}
                      style={filterButtonStyle(
                        active,
                        category.colorHex ??
                          '#C4956A'
                      )}
                    >
                      {category.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {TAG_NAMESPACES.map((namespace) => {
            const namespaceTags = tags.filter(
              (tag) => tag.namespace === namespace
            )

            if (namespaceTags.length === 0) {
              return null
            }

            return (
              <div
                key={namespace}
                style={{ marginBottom: '18px' }}
              >
                <p className="catalog-filter-title">
                  {NS_LABELS[namespace] ?? namespace}
                </p>

                <div className="catalog-filter-options">
                  {namespaceTags.map((tag) => {
                    const active =
                      activeTag === tag.slug

                    return (
                      <Link
                        key={tag.id}
                        href={createHref({
                          tag: active
                            ? undefined
                            : tag.slug,
                        })}
                        style={filterButtonStyle(
                          active,
                          '#3D7AD6'
                        )}
                      >
                        {tag.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Resultados */}
      {initialMangas.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 16px',
            color: 'rgba(160,152,144,0.5)',
            fontSize: '14px',
          }}
        >
          {order === 'popular' &&
          period !== 'all'
            ? 'Todavía no se registraron vistas durante este periodo.'
            : 'No encontramos mangas con estos filtros.'}
        </div>
      ) : (
        <div
          className="manga-grid"
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2, minmax(0, 1fr))',
            gap: '12px',
          }}
        >
          {initialMangas.map((manga, index) => (
            <MangaCard
              key={manga.id}
              manga={manga}
              priority={index < 6}
            />
          ))}
        </div>
      )}

      <style>{`
        .catalog-navigation {
          scrollbar-width: thin;
        }

        .catalog-filter-title {
          margin-bottom: 10px;
          color: rgba(120, 112, 104, 0.9);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .catalog-filter-options {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        @media (min-width: 480px) {
          .manga-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr)) !important;
          }
        }

        @media (min-width: 640px) {
          .manga-grid {
            grid-template-columns:
              repeat(4, minmax(0, 1fr)) !important;
          }
        }

        @media (min-width: 1024px) {
          .manga-grid {
            grid-template-columns:
              repeat(6, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  )
}