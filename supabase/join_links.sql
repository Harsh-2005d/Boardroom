create table if not exists public.board_join_links (
  id uuid primary key default gen_random_uuid(), board_id uuid not null references public.boards(id) on delete cascade,
  token_hash text not null unique, mode text not null check (mode in ('anyone','approval')),
  created_by uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now(), revoked_at timestamptz
);
create table if not exists public.board_join_requests (
  id uuid primary key default gen_random_uuid(), board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(), unique(board_id,user_id)
);
alter table public.board_join_links enable row level security;
alter table public.board_join_requests enable row level security;
grant select,insert,update,delete on public.board_join_links, public.board_join_requests to authenticated;
drop policy if exists "owners manage join links" on public.board_join_links;
create policy "owners manage join links" on public.board_join_links for all to authenticated using (public.board_role(board_id)='owner') with check (public.board_role(board_id)='owner');
drop policy if exists "users can request board access" on public.board_join_requests;
create policy "users can request board access" on public.board_join_requests for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "users and owners read join requests" on public.board_join_requests;
create policy "users and owners read join requests" on public.board_join_requests for select to authenticated using (user_id=auth.uid() or public.board_role(board_id)='owner');
drop policy if exists "owners review join requests" on public.board_join_requests;
create policy "owners review join requests" on public.board_join_requests for update to authenticated using (public.board_role(board_id)='owner') with check (public.board_role(board_id)='owner');
drop function if exists public.use_board_join_link(text);
create function public.use_board_join_link(link_token_hash text)
returns jsonb language plpgsql security definer set search_path=public,auth,extensions as $$
declare l public.board_join_links; uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Sign in before joining a board'; end if;
 select * into l from public.board_join_links where token_hash=link_token_hash and revoked_at is null;
 if l.id is null then raise exception 'This board link is invalid or revoked'; end if;
 if l.mode='anyone' then
  insert into public.user_boards(user_id,board_id,role) values(uid,l.board_id,'member') on conflict(user_id,board_id) do nothing;
  return jsonb_build_object('status','joined','board_id',l.board_id);
 end if;
 insert into public.board_join_requests(user_id,board_id,status) values(uid,l.board_id,'pending') on conflict(board_id,user_id) do update set status='pending',created_at=now();
 return jsonb_build_object('status','pending','board_id',l.board_id);
end $$;
revoke all on function public.use_board_join_link(text) from public;
grant execute on function public.use_board_join_link(text) to authenticated;
create or replace function public.review_board_join_request(request_id uuid, decision text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare r public.board_join_requests;
begin
 if decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
 select * into r from public.board_join_requests where id=request_id;
 if r.id is null or public.board_role(r.board_id)<>'owner' then raise exception 'Only the board owner can review requests'; end if;
 update public.board_join_requests set status=decision where id=request_id;
 if decision='approved' then insert into public.user_boards(user_id,board_id,role) values(r.user_id,r.board_id,'member') on conflict(user_id,board_id) do nothing; end if;
end $$;
revoke all on function public.review_board_join_request(uuid,text) from public;
grant execute on function public.review_board_join_request(uuid,text) to authenticated;
create or replace function public.board_join_request_details(target_board uuid)
returns table(id uuid,email text,created_at timestamptz)
language sql stable security definer set search_path=public,auth as $$
 select r.id, coalesce(u.email,''), r.created_at
 from public.board_join_requests r join auth.users u on u.id=r.user_id
 where r.board_id=target_board and r.status='pending' and public.board_role(target_board)='owner'
$$;
revoke all on function public.board_join_request_details(uuid) from public;
grant execute on function public.board_join_request_details(uuid) to authenticated;
