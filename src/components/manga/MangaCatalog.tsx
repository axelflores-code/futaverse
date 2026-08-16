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
  const [showFilters, setShowFilters] =
    useState(false)

  const hasContentFilter =
    Boolean(activeCategory) ||
    Boolean(activeTag)

  function createHref(
    changes: Record<
      string,
      string | undefined
    >
  ) {
    const params = new URLSearchParams()

    if (order !== 'recent') {
      params.set('order', order)
    }

    if (order === 'popular') {
      params.set('period', period)
    }

    if (activeCategory) {
      params.set(
        'category',
        activeCategory
      )
    }

    if (activeTag) {
      params.set('tag', activeTag)
    }

    for (
      const [key, value] of
      Object.entries(changes)
    ) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }

    /*
     * Al cambiar un filtro u ordenamiento,
     * siempre regresamos a la página 1.
     */
    params.delete('page')

    /*
     * El periodo solo tiene sentido
     * cuando el orden es "popular".
     */
    if (
      params.get('order') !==
      'popular'
    ) {
      params.delete('period')
    }

    /*
     * "Recientes" es la opción por defecto,
     * así que no necesita parámetro.
     */
    if (
      params.get('order') ===
      'recent'
    ) {
      params.delete('order')
    }

    const query = params.toString()

    return query
      ? `/manga?${query}`
      : '/manga'
  }

  function filterButtonStyle(
    active: boolean,
    activeColor = '#C4956A'
  ): React.CSSProperties {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
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
      transition: 'all 150ms ease',
    }
  }

  return (
    <div>
      {/* Orden principal */}
      <nav
        aria-label="Ordenar catálogo"
        className="catalog-sort-navigation"
      >
        <Link
          href={createHref({
            order: undefined,
            period: undefined,
          })}
          className={`catalog-main-tab ${
            order === 'recent'
              ? 'active'
              : ''
          }`}
        >
          Recientes
        </Link>

        <div className="catalog-popular-group">
          <span className="catalog-popular-label">
            Popular:
          </span>

          {[
            ['today', 'Hoy'],
            ['week', 'Semana'],
            ['all', 'Siempre'],
          ].map(([value, label]) => {
            const active =
              order === 'popular' &&
              period === value

            return (
              <Link
                key={value}
                href={createHref({
                  order: 'popular',
                  period: value,
                })}
                className={`catalog-period-tab ${
                  active ? 'active' : ''
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>

        <Link
          href={createHref({
            order: 'rating',
            period: undefined,
          })}
          className={`catalog-main-tab ${
            order === 'rating'
              ? 'active'
              : ''
          }`}
        >
          Mejor valorados
        </Link>
      </nav>

      {/* Filtros y contador */}
      <div className="catalog-filter-bar">
        <button
          type="button"
          onClick={() =>
            setShowFilters(
              (current) => !current
            )
          }
          className={`catalog-filter-toggle ${
            showFilters ||
            hasContentFilter
              ? 'active'
              : ''
          }`}
          aria-expanded={showFilters}
          aria-controls="catalog-filters"
        >
          <i
            className="fi fi-rr-filter"
            aria-hidden="true"
          />

          <span>Filtrar contenido</span>

          {hasContentFilter && (
            <span className="catalog-filter-count">
              {Number(
                Boolean(activeCategory)
              ) +
                Number(
                  Boolean(activeTag)
                )}
            </span>
          )}
        </button>

        <span className="catalog-result-count">
          {total.toLocaleString()}{' '}
          resultado
          {total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtros actualmente seleccionados */}
      {hasContentFilter && (
        <div className="catalog-active-filters">
          {activeCategory && (
            <Link
              href={createHref({
                category: undefined,
              })}
              className="catalog-active-chip category"
            >
              <span>
                {categories.find(
                  (category) =>
                    category.slug ===
                    activeCategory
                )?.name ??
                  activeCategory}
              </span>

              <span aria-hidden="true">
                ×
              </span>
            </Link>
          )}

          {activeTag && (
            <Link
              href={createHref({
                tag: undefined,
              })}
              className="catalog-active-chip tag"
            >
              <span>
                {tags.find(
                  (tag) =>
                    tag.slug ===
                    activeTag
                )?.name ?? activeTag}
              </span>

              <span aria-hidden="true">
                ×
              </span>
            </Link>
          )}

          <Link
            href={createHref({
              category: undefined,
              tag: undefined,
            })}
            className="catalog-clear-filters"
          >
            Limpiar filtros
          </Link>
        </div>
      )}

      {/* Panel de filtros avanzados */}
      {showFilters && (
        <div
          id="catalog-filters"
          className="catalog-filters-panel"
        >
          {categories.length > 0 && (
            <section className="catalog-filter-section">
              <h2 className="catalog-filter-title">
                Categoría o formato
              </h2>

              <div className="catalog-filter-options">
                {categories.map(
                  (category) => {
                    const active =
                      activeCategory ===
                      category.slug

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
                  }
                )}
              </div>
            </section>
          )}

          {TAG_NAMESPACES.map(
            (namespace) => {
              const namespaceTags =
                tags.filter(
                  (tag) =>
                    tag.namespace ===
                    namespace
                )

              if (
                namespaceTags.length === 0
              ) {
                return null
              }

              return (
                <section
                  key={namespace}
                  className="catalog-filter-section"
                >
                  <h2 className="catalog-filter-title">
                    {NS_LABELS[
                      namespace
                    ] ?? namespace}
                  </h2>

                  <div className="catalog-filter-options">
                    {namespaceTags.map(
                      (tag) => {
                        const active =
                          activeTag ===
                          tag.slug

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
                              '#4A76C9'
                            )}
                          >
                            {tag.name}
                          </Link>
                        )
                      }
                    )}
                  </div>
                </section>
              )
            }
          )}

          {hasContentFilter && (
            <Link
              href={createHref({
                category: undefined,
                tag: undefined,
              })}
              className="catalog-panel-clear"
            >
              Limpiar todos los filtros
            </Link>
          )}
        </div>
      )}

      {/* Resultados */}
      {initialMangas.length === 0 ? (
        <div className="catalog-empty">
          {order === 'popular' &&
          period !== 'all'
            ? 'Todavía no se registraron vistas durante este periodo.'
            : 'No encontramos mangas con estos filtros.'}
        </div>
      ) : (
        <div className="manga-grid">
          {initialMangas.map(
            (manga, index) => (
              <MangaCard
                key={manga.id}
                manga={manga}
                priority={index < 6}
              />
            )
          )}
        </div>
      )}

      <style>{`
        /* Navegación principal */

        .catalog-sort-navigation {
          display: flex;
          align-items: stretch;
          gap: 10px;
          margin-bottom: 18px;
          overflow-x: auto;
          padding-bottom: 5px;
          scrollbar-width: thin;
        }

        .catalog-main-tab {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 9px 17px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 7px;
          background: #15151b;
          color: rgba(220, 215, 210, 0.76);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
          transition:
            background 150ms ease,
            border-color 150ms ease,
            color 150ms ease;
        }

        .catalog-main-tab:hover {
          background: #1d1c22;
          color: #f0ece8;
        }

        .catalog-main-tab.active {
          border-color: rgba(196, 149, 106, 0.68);
          background: #30251d;
          color: #ffffff;
        }

        .catalog-popular-group {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          min-height: 42px;
          padding: 4px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 7px;
          background: #15151b;
          white-space: nowrap;
        }

        .catalog-popular-label {
          padding: 0 9px;
          color: rgba(220, 215, 210, 0.64);
          font-size: 12px;
          font-weight: 700;
        }

        .catalog-period-tab {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 32px;
          padding: 6px 11px;
          border-radius: 5px;
          color: rgba(220, 215, 210, 0.72);
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          transition:
            background 150ms ease,
            color 150ms ease;
        }

        .catalog-period-tab:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
        }

        .catalog-period-tab.active {
          background: #4b4745;
          color: #ffffff;
          font-weight: 700;
        }

        /* Barra de filtros */

        .catalog-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .catalog-filter-toggle {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 38px;
          padding: 8px 14px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 7px;
          background: #15151b;
          color: rgba(220, 215, 210, 0.76);
          font-family: inherit;
          font-size: 13px;
          cursor: pointer;
          transition:
            background 150ms ease,
            border-color 150ms ease,
            color 150ms ease;
        }

        .catalog-filter-toggle:hover {
          background: #1d1c22;
          color: #ffffff;
        }

        .catalog-filter-toggle.active {
          border-color: rgba(196, 149, 106, 0.6);
          background: rgba(196, 149, 106, 0.1);
          color: #c4956a;
        }

        .catalog-filter-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9px;
          background: #c4956a;
          color: #0b0c10;
          font-size: 10px;
          font-weight: 800;
        }

        .catalog-result-count {
          color: rgba(140, 132, 124, 0.8);
          font-size: 12px;
          white-space: nowrap;
        }

        /* Filtros activos */

        .catalog-active-filters {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 15px;
        }

        .catalog-active-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 11px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
        }

        .catalog-active-chip.category {
          border: 1px solid rgba(196, 149, 106, 0.55);
          background: rgba(196, 149, 106, 0.11);
          color: #c4956a;
        }

        .catalog-active-chip.tag {
          border: 1px solid rgba(74, 118, 201, 0.55);
          background: rgba(74, 118, 201, 0.12);
          color: #7198df;
        }

        .catalog-clear-filters {
          padding: 6px 4px;
          color: rgba(190, 182, 174, 0.58);
          font-size: 12px;
          text-decoration: underline;
        }

        /* Panel de filtros */

        .catalog-filters-panel {
          padding: 18px;
          margin-bottom: 22px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 10px;
          background: #111118;
        }

        .catalog-filter-section {
          margin-bottom: 19px;
        }

        .catalog-filter-section:last-of-type {
          margin-bottom: 6px;
        }

        .catalog-filter-title {
          margin: 0 0 10px;
          color: rgba(130, 122, 114, 0.9);
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

        .catalog-panel-clear {
          display: inline-block;
          margin-top: 5px;
          color: #c4956a;
          font-size: 12px;
          text-decoration: underline;
        }

        /* Grid */

        .manga-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .catalog-empty {
          padding: 65px 16px;
          color: rgba(160, 152, 144, 0.5);
          font-size: 14px;
          text-align: center;
        }

        @media (min-width: 480px) {
          .manga-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }
        }

        @media (min-width: 640px) {
          .manga-grid {
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .manga-grid {
            grid-template-columns:
              repeat(6, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .catalog-sort-navigation {
            gap: 7px;
            margin-right: -16px;
            padding-right: 16px;
          }

          .catalog-main-tab {
            min-height: 38px;
            padding: 7px 13px;
            font-size: 12px;
          }

          .catalog-popular-group {
            min-height: 38px;
          }

          .catalog-popular-label {
            padding: 0 6px;
          }

          .catalog-period-tab {
            min-height: 29px;
            padding: 5px 9px;
          }

          .catalog-filter-bar {
            align-items: center;
          }

          .catalog-filter-toggle {
            min-height: 36px;
            padding: 7px 12px;
            font-size: 12px;
          }

          .catalog-result-count {
            font-size: 11px;S
          }

          .catalog-filters-panel {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  )
}