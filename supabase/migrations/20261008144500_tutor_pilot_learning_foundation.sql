-- Tutor commercial pilot domain. All new tables are private by default.
-- Existing gen.ai.vn and English Quest tables remain untouched.
-- Accounts and child consent are provisioned by authorized backend operators.
-- Students cannot grant themselves a role, consent, enrollment or teacher link.

create table public.tutor_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 120),
  role text not null check (role in ('student','teacher','admin')),
  grade_id text,
  consent_approved_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint tutor_profiles_student_grade_check
    check (role <> 'student' or grade_id in ('6','7','8','9','10','11','12'))
);

create table public.tutor_teacher_links (
  teacher_id uuid not null references public.tutor_profiles(user_id) on delete cascade,
  learner_id uuid not null references public.tutor_profiles(user_id) on delete cascade,
  class_label text not null default '',
  created_at timestamptz not null default now(),
  primary key (teacher_id, learner_id),
  check (teacher_id <> learner_id),
  check (char_length(class_label) <= 80)
);
create index tutor_teacher_links_learner_idx on public.tutor_teacher_links (learner_id);

create table public.tutor_enrollments (
  learner_id uuid not null references public.tutor_profiles(user_id) on delete cascade,
  grade_id text not null check (grade_id in ('6','7','8','9','10','11','12')),
  subject_id text not null references public.tutor_subjects(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (learner_id, grade_id, subject_id)
);

create table public.tutor_lesson_completions (
  learner_id uuid not null references public.tutor_profiles(user_id) on delete cascade,
  lesson_id text not null references public.tutor_lessons(id),
  completed_at timestamptz not null default now(),
  primary key (learner_id, lesson_id)
);
create index tutor_lesson_completions_lesson_idx on public.tutor_lesson_completions (lesson_id);

create table public.tutor_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.tutor_profiles(user_id) on delete cascade,
  lesson_id text not null references public.tutor_lessons(id),
  correct_count integer not null check (correct_count >= 0),
  question_count integer not null check (question_count between 1 and 50),
  submitted_at timestamptz not null default now(),
  check (correct_count <= question_count)
);
create index tutor_quiz_attempts_learner_time_idx on public.tutor_quiz_attempts (learner_id, submitted_at desc);
create index tutor_quiz_attempts_lesson_idx on public.tutor_quiz_attempts (lesson_id);

-- Drafts and local deterministic checks are explicitly unverified learner notes.
-- Only quiz submissions processed on the server become verified completions.
create table public.tutor_studio_snapshots (
  learner_id uuid not null references public.tutor_profiles(user_id) on delete cascade,
  problem_id text not null check (char_length(problem_id) between 2 and 120),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (learner_id, problem_id),
  check (jsonb_typeof(payload) = 'object'),
  check (octet_length(payload::text) <= 131072)
);

create table public.tutor_reward_ledger (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.tutor_profiles(user_id) on delete cascade,
  amount integer not null check (amount between -100000 and 100000 and amount <> 0),
  source text not null,
  source_id text not null,
  created_at timestamptz not null default now(),
  unique (learner_id, source, source_id)
);
create index tutor_reward_ledger_learner_time_idx on public.tutor_reward_ledger (learner_id, created_at desc);

create table public.tutor_skills (
  id text primary key,
  grade_id text not null check (grade_id in ('6','7','8','9','10','11','12')),
  subject_id text not null references public.tutor_subjects(id),
  label text not null,
  description text not null default '',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);

create table public.tutor_lesson_skills (
  lesson_id text not null references public.tutor_lessons(id) on delete cascade,
  skill_id text not null references public.tutor_skills(id) on delete cascade,
  primary key (lesson_id, skill_id)
);
create index tutor_lesson_skills_skill_idx on public.tutor_lesson_skills (skill_id);

-- Evidence from an all-correct published quiz; never claim "mastery" from a single quiz.
create table public.tutor_skill_evidence (
  learner_id uuid not null references public.tutor_profiles(user_id) on delete cascade,
  skill_id text not null references public.tutor_skills(id),
  lesson_id text not null references public.tutor_lessons(id),
  source text not null default 'quiz_passed' check (source = 'quiz_passed'),
  created_at timestamptz not null default now(),
  primary key (learner_id, skill_id, lesson_id)
);
create index tutor_skill_evidence_skill_idx on public.tutor_skill_evidence (skill_id);

create table public.tutor_teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.tutor_profiles(user_id) on delete cascade,
  lesson_id text not null references public.tutor_lessons(id),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  due_at timestamptz,
  created_at timestamptz not null default now()
);
create index tutor_teacher_assignments_teacher_idx on public.tutor_teacher_assignments (teacher_id, created_at desc);

create table public.tutor_assignment_targets (
  assignment_id uuid not null references public.tutor_teacher_assignments(id) on delete cascade,
  learner_id uuid not null references public.tutor_profiles(user_id) on delete cascade,
  primary key (assignment_id, learner_id)
);
create index tutor_assignment_targets_learner_idx on public.tutor_assignment_targets (learner_id);

-- Explicit RLS on every table; no private table is exposed to anon.
alter table public.tutor_profiles enable row level security;
alter table public.tutor_teacher_links enable row level security;
alter table public.tutor_enrollments enable row level security;
alter table public.tutor_lesson_completions enable row level security;
alter table public.tutor_quiz_attempts enable row level security;
alter table public.tutor_studio_snapshots enable row level security;
alter table public.tutor_reward_ledger enable row level security;
alter table public.tutor_skills enable row level security;
alter table public.tutor_lesson_skills enable row level security;
alter table public.tutor_skill_evidence enable row level security;
alter table public.tutor_teacher_assignments enable row level security;
alter table public.tutor_assignment_targets enable row level security;

revoke all on public.tutor_profiles, public.tutor_teacher_links,
  public.tutor_enrollments, public.tutor_lesson_completions,
  public.tutor_quiz_attempts, public.tutor_studio_snapshots,
  public.tutor_reward_ledger, public.tutor_skills,
  public.tutor_lesson_skills, public.tutor_skill_evidence,
  public.tutor_teacher_assignments, public.tutor_assignment_targets
  from anon, authenticated;

grant select on public.tutor_profiles, public.tutor_teacher_links,
  public.tutor_enrollments, public.tutor_lesson_completions,
  public.tutor_quiz_attempts, public.tutor_studio_snapshots,
  public.tutor_reward_ledger, public.tutor_skills,
  public.tutor_lesson_skills, public.tutor_skill_evidence,
  public.tutor_teacher_assignments, public.tutor_assignment_targets
  to authenticated;

grant insert, update on public.tutor_studio_snapshots to authenticated;
grant insert, update on public.tutor_teacher_assignments to authenticated;
grant insert, delete on public.tutor_assignment_targets to authenticated;

create policy tutor_profiles_read_scoped on public.tutor_profiles
  for select to authenticated using (
    user_id = (select auth.uid()) or
    user_id in (select learner_id from public.tutor_teacher_links where teacher_id = (select auth.uid()))
  );
create policy tutor_teacher_links_read_scoped on public.tutor_teacher_links
  for select to authenticated using (
    teacher_id = (select auth.uid()) or learner_id = (select auth.uid())
  );
create policy tutor_enrollments_read_scoped on public.tutor_enrollments
  for select to authenticated using (
    learner_id = (select auth.uid()) or
    learner_id in (select learner_id from public.tutor_teacher_links where teacher_id = (select auth.uid()))
  );
create policy tutor_lesson_completions_read_scoped on public.tutor_lesson_completions
  for select to authenticated using (
    learner_id = (select auth.uid()) or
    learner_id in (select learner_id from public.tutor_teacher_links where teacher_id = (select auth.uid()))
  );
create policy tutor_quiz_attempts_read_scoped on public.tutor_quiz_attempts
  for select to authenticated using (
    learner_id = (select auth.uid()) or
    learner_id in (select learner_id from public.tutor_teacher_links where teacher_id = (select auth.uid()))
  );
create policy tutor_studio_snapshots_read_scoped on public.tutor_studio_snapshots
  for select to authenticated using (
    learner_id = (select auth.uid()) or
    learner_id in (select learner_id from public.tutor_teacher_links where teacher_id = (select auth.uid()))
  );
create policy tutor_studio_snapshots_insert_own on public.tutor_studio_snapshots
  for insert to authenticated with check (
    learner_id = (select auth.uid()) and
    exists (select 1 from public.tutor_profiles p
      where p.user_id = (select auth.uid()) and p.role='student'
      and p.active and p.consent_approved_at is not null)
  );
create policy tutor_studio_snapshots_update_own on public.tutor_studio_snapshots
  for update to authenticated using (
    learner_id = (select auth.uid())
  ) with check (
    learner_id = (select auth.uid()) and
    exists (select 1 from public.tutor_profiles p
      where p.user_id = (select auth.uid()) and p.role='student'
      and p.active and p.consent_approved_at is not null)
  );
create policy tutor_reward_ledger_read_scoped on public.tutor_reward_ledger
  for select to authenticated using (learner_id = (select auth.uid()));
create policy tutor_skills_published_read on public.tutor_skills
  for select to authenticated using (status = 'published');
create policy tutor_lesson_skills_published_read on public.tutor_lesson_skills
  for select to authenticated using (
    exists (select 1 from public.tutor_skills s
      where s.id = skill_id and s.status = 'published')
  );
create policy tutor_skill_evidence_read_scoped on public.tutor_skill_evidence
  for select to authenticated using (
    learner_id = (select auth.uid()) or
    learner_id in (select learner_id from public.tutor_teacher_links where teacher_id = (select auth.uid()))
  );
create policy tutor_teacher_assignments_read_scoped on public.tutor_teacher_assignments
  for select to authenticated using (
    teacher_id = (select auth.uid()) or
    id in (select assignment_id from public.tutor_assignment_targets where learner_id = (select auth.uid()))
  );
create policy tutor_teacher_assignments_insert_staff on public.tutor_teacher_assignments
  for insert to authenticated with check (
    teacher_id = (select auth.uid()) and
    exists (select 1 from public.tutor_profiles p
      where p.user_id=(select auth.uid()) and p.role='teacher' and p.active)
  );
create policy tutor_teacher_assignments_update_staff on public.tutor_teacher_assignments
  for update to authenticated using (
    teacher_id = (select auth.uid())
  ) with check (
    teacher_id = (select auth.uid()) and
    exists (select 1 from public.tutor_profiles p
      where p.user_id=(select auth.uid()) and p.role='teacher' and p.active)
  );
create policy tutor_assignment_targets_read_scoped on public.tutor_assignment_targets
  for select to authenticated using (
    learner_id = (select auth.uid()) or
    assignment_id in (select id from public.tutor_teacher_assignments
      where teacher_id = (select auth.uid()))
  );
create policy tutor_assignment_targets_insert_staff on public.tutor_assignment_targets
  for insert to authenticated with check (
    exists (select 1 from public.tutor_teacher_assignments a
      join public.tutor_teacher_links l on l.teacher_id=a.teacher_id and l.learner_id=tutor_assignment_targets.learner_id
      where a.id=tutor_assignment_targets.assignment_id
        and a.teacher_id=(select auth.uid()))
  );
create policy tutor_assignment_targets_delete_staff on public.tutor_assignment_targets
  for delete to authenticated using (
    assignment_id in (select id from public.tutor_teacher_assignments
      where teacher_id=(select auth.uid()))
  );

-- SECURITY DEFINER justified: immutable results and GP must not be client-writable.
-- Strict JWT identity + approved consent + enrollment + published lesson.
create function public.tutor_submit_lesson_quiz(
  p_lesson_id text,
  p_answers jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $function$
declare
  v_learner uuid := auth.uid();
  v_exercises jsonb;
  v_grade text;
  v_subject text;
  v_total integer := 0;
  v_correct integer := 0;
  v_exercise jsonb;
  v_choice text;
  v_inserted integer := 0;
  v_earned_today integer := 0;
  v_reward integer := 0;
begin
  if v_learner is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if not exists (select 1 from public.tutor_profiles
    where user_id=v_learner and role='student'
      and active and consent_approved_at is not null) then
    raise exception 'Pilot account approval required' using errcode='42501';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object'
    or octet_length(p_answers::text) > 16000 then
    raise exception 'Invalid answer payload' using errcode='22023';
  end if;
  select l.grade_id, l.subject_id, l.exercises
    into v_grade, v_subject, v_exercises
  from public.tutor_lessons l
  join public.tutor_topics t on t.id=l.topic_id and t.status='published'
  join public.tutor_subjects s on s.id=l.subject_id and s.status='published'
  where l.id=p_lesson_id and l.status='published'
    and t.grade_id=l.grade_id and t.subject_id=l.subject_id;
  if not found then
    raise exception 'Published lesson unavailable' using errcode='22023';
  end if;
  if not exists (select 1 from public.tutor_enrollments e
    where e.learner_id=v_learner and e.grade_id=v_grade
      and e.subject_id=v_subject and e.active) then
    raise exception 'Course enrollment required' using errcode='42501';
  end if;
  if jsonb_typeof(v_exercises) <> 'array' then
    raise exception 'Lesson exercises unavailable' using errcode='22023';
  end if;
  v_total := jsonb_array_length(v_exercises);
  if v_total < 1 or v_total > 50 then
    raise exception 'Unsupported quiz length' using errcode='22023';
  end if;
  for v_exercise in select value from jsonb_array_elements(v_exercises)
  loop
    v_choice := p_answers ->> (v_exercise->>'id');
    if v_choice is null or v_choice !~ '^[0-9]{1,3}$' then
      raise exception 'Please answer each exercise' using errcode='22023';
    end if;
    if v_choice::integer = (v_exercise->>'correctIndex')::integer then
      v_correct := v_correct + 1;
    end if;
  end loop;
  insert into public.tutor_quiz_attempts (learner_id, lesson_id, correct_count, question_count)
  values (v_learner, p_lesson_id, v_correct, v_total);

  if v_correct = v_total then
    insert into public.tutor_lesson_completions (learner_id, lesson_id)
    values (v_learner, p_lesson_id)
    on conflict do nothing;
    get diagnostics v_inserted = row_count;
    if v_inserted > 0 then
      insert into public.tutor_skill_evidence (learner_id, skill_id, lesson_id)
      select v_learner, m.skill_id, p_lesson_id
      from public.tutor_lesson_skills m
      where m.lesson_id = p_lesson_id
      on conflict do nothing;
      select coalesce(sum(amount),0) into v_earned_today
      from public.tutor_reward_ledger
      where learner_id=v_learner and amount>0
        and (created_at at time zone 'Asia/Ho_Chi_Minh')::date =
          (now() at time zone 'Asia/Ho_Chi_Minh')::date;
      v_reward := least(20, greatest(0,120 - v_earned_today));
      if v_reward > 0 then
        insert into public.tutor_reward_ledger (learner_id, amount, source, source_id)
        values (v_learner, v_reward, 'lesson_quiz', p_lesson_id)
        on conflict do nothing;
      end if;
    end if;
  end if;
  return jsonb_build_object(
    'correct', v_correct,
    'total', v_total,
    'completed', v_correct = v_total,
    'newlyCompleted', v_inserted > 0,
    'awardedGp', v_reward
  );
end;
$function$;

revoke all on function public.tutor_submit_lesson_quiz(text,jsonb) from public, anon;
grant execute on function public.tutor_submit_lesson_quiz(text,jsonb) to authenticated;

-- A small published skill taxonomy mapped to currently published Math 9 content.
-- It is NOT evidence of mastery or proof that a lesson covers an entire skill.
insert into public.tutor_skills(id,grade_id,subject_id,label,description,status) values
  ('math9-radical-domain','9','toan','Điều kiện xác định căn bậc hai','Xác định điều kiện để biểu thức căn bậc hai có nghĩa.','published'),
  ('math9-radical-simplification','9','toan','Rút gọn căn thức','Vận dụng các quy tắc biến đổi căn thức.','published'),
  ('math9-parabola','9','toan','Hàm số và đồ thị parabol','Liên hệ hệ số với tính chất đồ thị bậc hai.','published'),
  ('math9-equation-systems','9','toan','Giải hệ phương trình','Biến đổi và kiểm tra nghiệm của hệ phương trình.','published'),
  ('math9-circle-angles','9','toan','Góc nội tiếp đường tròn','Vận dụng tính chất góc nội tiếp.','published')
  on conflict (id) do nothing;
insert into public.tutor_lesson_skills(lesson_id,skill_id) values
  ('can-bac-hai','math9-radical-domain'),
  ('rut-gon-can-thuc','math9-radical-simplification'),
  ('ham-so-bac-hai','math9-parabola'),
  ('he-phuong-trinh','math9-equation-systems'),
  ('goc-noi-tiep','math9-circle-angles')
  on conflict do nothing;
