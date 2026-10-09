-- Tutor pilot atomic assignment workflows, scoped student reads and admin health.
-- Public RPCs run with pinned search_path and verify auth.uid() and DB roles.
-- Remove direct authenticated assignment writes so targets cannot be half-created.
revoke insert, update on public.tutor_teacher_assignments from authenticated;
revoke insert, delete on public.tutor_assignment_targets from authenticated;

create function public.tutor_assign_lesson(
  p_lesson_id text,
  p_title text,
  p_learner_ids uuid[],
  p_due_at timestamptz default null
) returns uuid
language plpgsql security definer set search_path=''
as $function$
declare
  v_teacher uuid := auth.uid();
  v_grade text;
  v_subject text;
  v_count integer;
  v_valid integer;
  v_assignment uuid;
begin
  if v_teacher is null or not exists (
    select 1 from public.tutor_profiles p
    where p.user_id=v_teacher and p.role='teacher' and p.active
  ) then
    raise exception 'Teacher account required' using errcode='42501';
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 3 and 180 then
    raise exception 'Invalid assignment title' using errcode='22023';
  end if;
  if p_learner_ids is null or cardinality(p_learner_ids) not between 1 and 50 then
    raise exception 'Choose between 1 and 50 linked learners' using errcode='22023';
  end if;
  select count(distinct learner_id) into v_count from unnest(p_learner_ids) learner_id;
  if v_count <> cardinality(p_learner_ids) then
    raise exception 'Duplicate learner in assignment' using errcode='22023';
  end if;
  select l.grade_id,l.subject_id into v_grade,v_subject
  from public.tutor_lessons l
  join public.tutor_topics t on t.id=l.topic_id and t.status='published'
  join public.tutor_subjects s on s.id=l.subject_id and s.status='published'
  where l.id=p_lesson_id and l.status='published';
  if not found then
    raise exception 'Published lesson required' using errcode='22023';
  end if;
  select count(*) into v_valid from public.tutor_teacher_links link
  join public.tutor_profiles learner on learner.user_id=link.learner_id
  join public.tutor_enrollments e on e.learner_id=link.learner_id
    and e.grade_id=v_grade and e.subject_id=v_subject and e.active
  where link.teacher_id=v_teacher
    and link.learner_id=any(p_learner_ids)
    and learner.role='student' and learner.active
    and learner.consent_approved_at is not null;
  if v_valid <> v_count then
    raise exception 'Some learners lack linked teacher access or enrollment' using errcode='42501';
  end if;
  insert into public.tutor_teacher_assignments(teacher_id,lesson_id,title,due_at)
  values(v_teacher,p_lesson_id,btrim(p_title),p_due_at)
  returning id into v_assignment;
  insert into public.tutor_assignment_targets(assignment_id,learner_id)
  select v_assignment,learner_id from unnest(p_learner_ids) learner_id;
  return v_assignment;
end;
$function$;

create function public.tutor_my_assignments()
returns table(
  id uuid, title text, lesson_id text,
  due_at timestamptz, teacher_name text, completed boolean
)
language plpgsql security definer set search_path=''
as $function$
begin
  if auth.uid() is null or not exists(
    select 1 from public.tutor_profiles p
    where p.user_id=auth.uid() and p.role='student'
      and p.active and p.consent_approved_at is not null
  ) then
    raise exception 'Approved learner required' using errcode='42501';
  end if;
  return query
  select a.id,a.title,a.lesson_id,a.due_at,
    teacher.display_name,
    (c.lesson_id is not null) as completed
  from public.tutor_assignment_targets target
  join public.tutor_teacher_assignments a on a.id=target.assignment_id
  join public.tutor_profiles teacher on teacher.user_id=a.teacher_id and teacher.role='teacher'
  left join public.tutor_lesson_completions c on c.learner_id=auth.uid() and c.lesson_id=a.lesson_id
  where target.learner_id=auth.uid()
  order by a.created_at desc
  limit 100;
end;
$function$;

create function public.tutor_admin_pilot_overview()
returns jsonb
language plpgsql security definer set search_path=''
as $function$
begin
  if auth.uid() is null or not exists(
    select 1 from public.tutor_profiles p
    where p.user_id=auth.uid() and p.role='admin' and p.active
  ) then
    raise exception 'Tutor admin required' using errcode='42501';
  end if;
  return jsonb_build_object(
    'learners',(select count(*) from public.tutor_profiles where role='student' and active and consent_approved_at is not null),
    'teachers',(select count(*) from public.tutor_profiles where role='teacher' and active),
    'enrollments',(select count(*) from public.tutor_enrollments where active),
    'quizAttempts',(select count(*) from public.tutor_quiz_attempts),
    'completedLessons',(select count(*) from public.tutor_lesson_completions),
    'studioDrafts',(select count(*) from public.tutor_studio_snapshots),
    'publishedLessons',(select count(*) from public.tutor_lessons where status='published')
  );
end;
$function$;

revoke all on function public.tutor_assign_lesson(text,text,uuid[],timestamptz) from public,anon;
revoke all on function public.tutor_my_assignments() from public,anon;
revoke all on function public.tutor_admin_pilot_overview() from public,anon;
grant execute on function public.tutor_assign_lesson(text,text,uuid[],timestamptz) to authenticated;
grant execute on function public.tutor_my_assignments() to authenticated;
grant execute on function public.tutor_admin_pilot_overview() to authenticated;
