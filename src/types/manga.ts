
export type MangaStatus = 'ongoing' | 'completed' | 'hiatus';

export type MangaRating = 'everyone' | 'teen' | 'mature';

export type ArtistRole = 'autor' | 'artist' | 'autor_artist'

export type TagNamespace =
  | 'theme'
  | 'trope'
  | 'setting'
  | 'content_warning'
  | 'format'

export interface Tag {
  id: string
  name: string
  slug: string
  namespace: TagNamespace
  usageCount: number
}


export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  colorHex: string | null
  sortOrder: number
}

export type FavoriteStatus =
  | 'reading'
  | 'completed'
  | 'on_hold'
  | 'dropped'
  | 'plan_to_read'

export interface Favorite {
  userId: string
  mangaId: string
  status: FavoriteStatus
  score: number | null
  progress: number
  createdAt: string
  updatedAt: string
}

export interface ReadingHistoryEntry {
  id: string
  userId: string
  mangaId: string
  chapterId: string
  lastPage: number
  completed: boolean
  readAt: string
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface Manga {
  id: string;
  slug: string;
  title: string;
  alternativeTitles: string[];
  description: string | null;
  coverUrl: string | null;
  status: MangaStatus;
  rating: MangaRating;
  score: number;          // 0.00 – 10.00
  views: bigint;
  genres: Genre[];
  author: string | null;
  artist: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  mangaId: string;
  number: number;
  title: string | null;
  pages: string[];        // URLs en Supabase Storage
  views: bigint;
  createdAt: string;
}

export interface Bookmark {
  userId: string;
  mangaId: string;
  createdAt: string;
}

export interface ReadingProgress {
  userId: string;
  chapterId: string;
  page: number;
  updatedAt: string;
}

// Tipos de respuesta API
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type SortOrder = 'asc' | 'desc';
export type MangaSortBy = 'title' | 'score' | 'views' | 'updatedAt' | 'createdAt';

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface MangaSearchParams {
  q?: string
  genres?: string[]
  tags?: string[]
  categories?: string[]
  status?: string
  rating?: string
  sortBy?: 'title' | 'score' | 'views' | 'updatedAt' | 'createdAt'
  order?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}
