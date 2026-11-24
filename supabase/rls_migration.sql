-- Run this after the new schema is installed if you want email-based invitations.
create or replace function public.board_member_emails(target_board uuid)
returns table(id uuid, email text, role text)
language sql stable security definer set search_path = public, auth
as $$
  select bm.user_id, coalesce(u.email, ''), bm.role
  from public.user_boards bm join auth.users u on u.id = bm.user_id
  where bm.board_id = target_board and public.board_role(target_board) is not null
$$;

create or replace function public.invite_board_member_by_email(target_board uuid, invite_email text, member_role text)
returns table(id uuid, email text, role text)
language plpgsql security definer set search_path = public, auth
as $$
declare target_user uuid;
begin
  if public.board_role(target_board) <> 'owner' then raise exception 'Only board owners can invite members'; end if;
  if member_role not in ('member','viewer') then raise exception 'Role must be member or viewer'; end if;
  select u.id into target_user from auth.users u where lower(u.email) = lower(invite_email) limit 1;
  if target_user is null then return; end if;
  insert into public.user_boards(board_id,user_id,role) values(target_board,target_user,member_role)
  on conflict(board_id,user_id) do update set role = excluded.role;
  return query select target_user, lower(invite_email), member_role;
end
$$;
revoke all on function public.board_member_emails(uuid) from public;
revoke all on function public.invite_board_member_by_email(uuid,text,text) from public;
grant execute on function public.board_member_emails(uuid) to authenticated;
grant execute on function public.invite_board_member_by_email(uuid,text,text) to authenticated;
grant select, insert, update, delete on public.boards, public.user_boards, public.cards to authenticated;

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

drop policy if exists "authenticated create boards" on public.boards;
create policy "authenticated create boards" on public.boards
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);
