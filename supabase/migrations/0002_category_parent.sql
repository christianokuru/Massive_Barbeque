-- Categories support an optional parent (sub-categories).
alter table public.categories
  add column parent_id integer references public.categories (id) on delete set null;

create index categories_parent_idx on public.categories (parent_id);
