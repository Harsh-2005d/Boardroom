-- Board-level RBAC management helpers. Run after schema.sql and rls_migration.sql.
create or replace function public.set_board_member_role(target_board uuid, target_user uuid, new_role text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare previous_role text; owners_left bigint;
begin
  if public.board_role(target_board) <> 'owner' then raise exception 'Only a board owner can manage roles'; end if;
  if new_role not in ('owner','member','viewer') then raise exception 'Role must be owner, member, or viewer'; end if;
  select role into previous_role from public.user_boards where board_id=target_board and user_id=target_user;
  if previous_role is null then raise exception 'This user is not a member of the board'; end if;
  if previous_role='owner' and new_role<>'owner' then
    select count(*) into owners_left from public.user_boards where board_id=target_board and role='owner';
    if owners_left <= 1 then raise exception 'A board must keep at least one owner'; end if;
  end if;
  update public.user_boards set role=new_role where board_id=target_board and user_id=target_user;
end $$;

create or replace function public.remove_board_member(target_board uuid, target_user uuid)
returns void language plpgsql security definer set search_path=public,auth as $$
declare previous_role text; owners_left bigint;
begin
  if public.board_role(target_board) <> 'owner' then raise exception 'Only a board owner can remove members'; end if;
  select role into previous_role from public.user_boards where board_id=target_board and user_id=target_user;
  if previous_role is null then raise exception 'This user is not a member of the board'; end if;
  if previous_role='owner' then
    select count(*) into owners_left from public.user_boards where board_id=target_board and role='owner';
    if owners_left <= 1 then raise exception 'A board must keep at least one owner'; end if;
  end if;
  delete from public.user_boards where board_id=target_board and user_id=target_user;
end $$;

revoke all on function public.set_board_member_role(uuid,uuid,text) from public;
revoke all on function public.remove_board_member(uuid,uuid) from public;
grant execute on function public.set_board_member_role(uuid,uuid,text) to authenticated;
grant execute on function public.remove_board_member(uuid,uuid) to authenticated;
