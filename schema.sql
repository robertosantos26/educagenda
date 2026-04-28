
create extension if not exists "pgcrypto";

do $$ begin
  create type user_role as enum ('admin','supervisor','teacher','guardian');
exception when duplicate_object then null;
end $$;

create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text unique,
  email text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role user_role not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  name text not null,
  birth_date date,
  notes text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists student_guardians (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  guardian_id uuid references profiles(id) on delete cascade,
  relationship text,
  created_at timestamptz default now(),
  unique(student_id, guardian_id)
);

create table if not exists teacher_classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  created_at timestamptz default now(),
  unique(teacher_id, class_id)
);

create table if not exists daily_reports (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  teacher_id uuid references profiles(id) on delete set null,
  report_date date not null default current_date,
  food text,
  sleep text,
  bathroom text,
  mood text,
  activities text,
  observations text,
  message_to_parents text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(student_id, report_date)
);

create table if not exists parent_messages (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  guardian_id uuid references profiles(id) on delete cascade,
  message text not null,
  message_date date not null default current_date,
  read boolean default false,
  created_at timestamptz default now()
);

create or replace function get_my_school_id()
returns uuid
language sql
security definer
set search_path = public
as $$ select school_id from profiles where id = auth.uid(); $$;

create or replace function get_my_role()
returns user_role
language sql
security definer
set search_path = public
as $$ select role from profiles where id = auth.uid(); $$;

create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists update_daily_reports_updated_at on daily_reports;
create trigger update_daily_reports_updated_at
before update on daily_reports
for each row execute function update_updated_at_column();

alter table schools enable row level security;
alter table profiles enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table student_guardians enable row level security;
alter table teacher_classes enable row level security;
alter table daily_reports enable row level security;
alter table parent_messages enable row level security;

drop policy if exists "Schools can be created during signup" on schools;
create policy "Schools can be created during signup" on schools for insert with check (auth.uid() is not null);

drop policy if exists "Users can view own school" on schools;
create policy "Users can view own school" on schools for select using (id = get_my_school_id());

drop policy if exists "Profile can be created during signup" on profiles;
create policy "Profile can be created during signup" on profiles for insert with check (id = auth.uid());

drop policy if exists "Users can view profiles from same school" on profiles;
create policy "Users can view profiles from same school" on profiles for select using (school_id = get_my_school_id() or id = auth.uid());

drop policy if exists "Admins can manage profiles" on profiles;
create policy "Admins can manage profiles" on profiles for all
using (school_id = get_my_school_id() and get_my_role() in ('admin','supervisor'))
with check (school_id = get_my_school_id() and get_my_role() in ('admin','supervisor'));

drop policy if exists "School users can view classes" on classes;
create policy "School users can view classes" on classes for select using (school_id = get_my_school_id());

drop policy if exists "Admins and supervisors can manage classes" on classes;
create policy "Admins and supervisors can manage classes" on classes for all
using (school_id = get_my_school_id() and get_my_role() in ('admin','supervisor'))
with check (school_id = get_my_school_id() and get_my_role() in ('admin','supervisor'));

drop policy if exists "School staff can view students" on students;
create policy "School staff can view students" on students for select
using (school_id = get_my_school_id() and get_my_role() in ('admin','supervisor','teacher'));

drop policy if exists "Guardians can view linked students" on students;
create policy "Guardians can view linked students" on students for select
using (exists (select 1 from student_guardians sg where sg.student_id = students.id and sg.guardian_id = auth.uid()));

drop policy if exists "Admins and supervisors can manage students" on students;
create policy "Admins and supervisors can manage students" on students for all
using (school_id = get_my_school_id() and get_my_role() in ('admin','supervisor'))
with check (school_id = get_my_school_id() and get_my_role() in ('admin','supervisor'));

drop policy if exists "School staff can view student guardians" on student_guardians;
create policy "School staff can view student guardians" on student_guardians for select
using (exists (select 1 from students s where s.id = student_guardians.student_id and s.school_id = get_my_school_id()));

drop policy if exists "Admins and supervisors can manage student guardians" on student_guardians;
create policy "Admins and supervisors can manage student guardians" on student_guardians for all
using (get_my_role() in ('admin','supervisor'))
with check (get_my_role() in ('admin','supervisor'));

drop policy if exists "School users can view teacher classes" on teacher_classes;
create policy "School users can view teacher classes" on teacher_classes for select
using (exists (select 1 from classes c where c.id = teacher_classes.class_id and c.school_id = get_my_school_id()));

drop policy if exists "Admins and supervisors can manage teacher classes" on teacher_classes;
create policy "Admins and supervisors can manage teacher classes" on teacher_classes for all
using (get_my_role() in ('admin','supervisor'))
with check (get_my_role() in ('admin','supervisor'));

drop policy if exists "School staff can view daily reports" on daily_reports;
create policy "School staff can view daily reports" on daily_reports for select
using (school_id = get_my_school_id() and get_my_role() in ('admin','supervisor','teacher'));

drop policy if exists "Guardians can view linked student reports" on daily_reports;
create policy "Guardians can view linked student reports" on daily_reports for select
using (exists (select 1 from student_guardians sg where sg.student_id = daily_reports.student_id and sg.guardian_id = auth.uid()));

drop policy if exists "Teachers can create daily reports" on daily_reports;
create policy "Teachers can create daily reports" on daily_reports for insert
with check (school_id = get_my_school_id() and get_my_role() in ('admin','supervisor','teacher'));

drop policy if exists "Teachers and supervisors can update daily reports" on daily_reports;
create policy "Teachers and supervisors can update daily reports" on daily_reports for update
using (school_id = get_my_school_id() and get_my_role() in ('admin','supervisor','teacher'))
with check (school_id = get_my_school_id() and get_my_role() in ('admin','supervisor','teacher'));

drop policy if exists "Guardians can create messages for linked students" on parent_messages;
create policy "Guardians can create messages for linked students" on parent_messages for insert
with check (guardian_id = auth.uid() and exists (
  select 1 from student_guardians sg join students s on s.id = sg.student_id
  where sg.student_id = parent_messages.student_id and sg.guardian_id = auth.uid() and s.school_id = parent_messages.school_id
));

drop policy if exists "Guardians can view own messages" on parent_messages;
create policy "Guardians can view own messages" on parent_messages for select using (guardian_id = auth.uid());

drop policy if exists "School staff can view parent messages" on parent_messages;
create policy "School staff can view parent messages" on parent_messages for select
using (school_id = get_my_school_id() and get_my_role() in ('admin','supervisor','teacher'));

drop policy if exists "School staff can mark messages as read" on parent_messages;
create policy "School staff can mark messages as read" on parent_messages for update
using (school_id = get_my_school_id() and get_my_role() in ('admin','supervisor','teacher'))
with check (school_id = get_my_school_id() and get_my_role() in ('admin','supervisor','teacher'));
