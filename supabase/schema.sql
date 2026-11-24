create extension if not exists pgcrypto;

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.user_boards (
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member','viewer')),
  primary key (user_id, board_id)
);
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  position numeric not null default 1000,
  created_at timestamptz not null default now()
);

create or replace function public.board_role(target_board uuid)
returns text language sql stable security definer set search_path = public, auth
as $$ select role from public.user_boards where board_id = target_board and user_id = auth.uid() limit 1 $$;
create or replace function public.is_board_creator(target_board uuid)
returns boolean language sql stable security definer set search_path = public, auth
as $$ select exists (select 1 from public.boards where id = target_board and owner_id = auth.uid()) $$;

create or replace function public.create_board_for_current_user(board_title text)
returns public.boards language plpgsql security definer set search_path = public, auth
as $$
declare current_user_id uuid := auth.uid(); created_board public.boards;
begin
  if current_user_id is null then raise exception 'A valid signed-in user is required to create a board'; end if;
  insert into public.boards(title, owner_id) values (trim(board_title), current_user_id) returning * into created_board;
  insert into public.user_boards(user_id, board_id, role) values (current_user_id, created_board.id, 'owner');
  return created_board;
end
$$;
revoke all on function public.create_board_for_current_user(text) from public;
grant execute on function public.create_board_for_current_user(text) to authenticated;

alter table public.boards enable row level security;
alter table public.user_boards enable row level security;
alter table public.cards enable row level security;
grant select, insert, update, delete on public.boards, public.user_boards, public.cards to authenticated;

create policy "board members can read boards" on public.boards for select to authenticated using (public.board_role(id) is not null);
create policy "users can create own boards" on public.boards for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "owners can update boards" on public.boards for update to authenticated using (public.board_role(id) = 'owner') with check (public.board_role(id) = 'owner');
create policy "owners can delete boards" on public.boards for delete to authenticated using (public.board_role(id) = 'owner');

create policy "board members can read memberships" on public.user_boards for select to authenticated using (public.board_role(board_id) is not null);
create policy "owners can add memberships" on public.user_boards for insert to authenticated with check (
  public.board_role(board_id) = 'owner' or
  (user_id = (select auth.uid()) and role = 'owner' and public.is_board_creator(board_id))
);
create policy "owners can change memberships" on public.user_boards for update to authenticated using (public.board_role(board_id) = 'owner') with check (public.board_role(board_id) = 'owner');
create policy "owners can remove memberships" on public.user_boards for delete to authenticated using (public.board_role(board_id) = 'owner' and not (user_id = (select auth.uid()) and role = 'owner'));

create policy "board members can read cards" on public.cards for select to authenticated using (public.board_role(board_id) is not null);
create policy "editors can add cards" on public.cards for insert to authenticated with check (public.board_role(board_id) in ('owner','member'));
create policy "editors can update cards" on public.cards for update to authenticated using (public.board_role(board_id) in ('owner','member')) with check (public.board_role(board_id) in ('owner','member'));
create policy "editors can delete cards" on public.cards for delete to authenticated using (public.board_role(board_id) in ('owner','member'));
