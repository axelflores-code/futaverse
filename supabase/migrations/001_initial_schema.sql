## `supabase/migrations/001_initial_schema.sql` — Schema completo

```sql
-- Extensiones
create extension if not exists "uuid-ossp";

-- Géneros
create table genres (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

-- Mangas
create table mangas (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  title              text not null,
  alternative_titles text[] default '{}',
  description        text,
  cover_url          text,
  status             text not null check (status in ('ongoing','completed','hiatus'))
                       default 'ongoing',
  rating             text not null check (rating in ('everyone','teen','mature'))
                       default 'everyone',
  score              numeric(4,2) default 0 check (score >= 0 and score <= 10),
  views              bigint default 0,
  author             text,
  artist             text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- Relación manga ↔ géneros
create table manga_genres (
  manga_id uuid references mangas on delete cascade,
  genre_id uuid references genres on delete cascade,
  primary key (manga_id, genre_id)
);

-- Capítulos
create table chapters (
  id         uuid primary key default gen_random_uuid(),
  manga_id   uuid not null references mangas on delete cascade,
  number     numeric(6,1) not null,
  title      text,
  pages      text[] not null default '{}',
  views      bigint default 0,
  created_at timestamptz default now(),
  unique (manga_id, number)
);

-- Bookmarks de usuario
create table bookmarks (
  user_id    uuid references auth.users on delete cascade,
  manga_id   uuid references mangas on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, manga_id)
);

-- Progreso de lectura
create table reading_progress (
  user_id    uuid references auth.users on delete cascade,
  chapter_id uuid references chapters on delete cascade,
  page       int not null default 0,
  updated_at timestamptz default now(),
  primary key (user_id, chapter_id)
);

-- Índices para performance
create index idx_mangas_slug        on mangas (slug);
create index idx_mangas_updated_at  on mangas (updated_at desc);
create index idx_mangas_score       on mangas (score desc);
create index idx_chapters_manga_id  on chapters (manga_id);
create index idx_chapters_number    on chapters (manga_id, number desc);
create index idx_bookmarks_user     on bookmarks (user_id);
create index idx_progress_user      on reading_progress (user_id);

-- Trigger: actualizar updated_at automáticamente
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger mangas_updated_at
  before update on mangas
  for each row execute function update_updated_at();

-- Row Level Security
alter table mangas          enable row level security;
alter table chapters        enable row level security;
alter table bookmarks       enable row level security;
alter table reading_progress enable row level security;

-- Mangas y capítulos: lectura pública
create policy "mangas_public_read"
  on mangas for select using (true);

create policy "chapters_public_read"
  on chapters for select using (true);

-- Bookmarks: solo el dueño
create policy "bookmarks_owner"
  on bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Progreso: solo el dueño
create policy "reading_progress_owner"
  on reading_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```