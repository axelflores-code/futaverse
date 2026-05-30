
export interface ApiError {
  message: string;
  code: string;
  status: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

// Parámetros de búsqueda
export interface MangaSearchParams {
  q?: string;
  genres?: string[];
  status?: string;
  rating?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

