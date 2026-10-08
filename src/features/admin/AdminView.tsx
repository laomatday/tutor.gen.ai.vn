import { Button, Input, Select, Icon, Field } from '../../components/ui';
import React, { useEffect, useRef, useState } from 'react';
import { initialUsers } from './data';
import { roleLabels, validUsers, getUserDraftError } from './domain';
import type { ManagedUser, UserRole } from './types';
import { storageKeys } from '../../config/storage';
import { normalizeSearch } from '../../lib/search';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useCurriculum } from '../../context/CurriculumContext';
import { GRADES, SUBJECTS } from '../curriculum';
import { CurriculumAdminView } from '../curriculum/admin/CurriculumAdminView';

export type AdminSection = 'overview' | 'users' | 'content';

interface AdminViewProps {
  section: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  onNotice: (message: string) => void;
}


export function AdminView({ section, onSectionChange, onNotice }: AdminViewProps) {
  const [users, setUsers, usersError] = useLocalStorage<ManagedUser[]>(storageKeys.adminUsers, initialUsers, validUsers);
  const { lessons, storageError } = useCurriculum();
  const [initialLessonId, setInitialLessonId] = useState<string | undefined>();
  useEffect(() => {
    if (section !== 'content') setInitialLessonId(undefined);
  }, [section]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [userStatus, setUserStatus] = useState('all');
  const [showAddUser, setShowAddUser] = useState(false);
  const [formError, setFormError] = useState('');
  const [draft, setDraft] = useState({ name: '', email: '', role: 'student' as UserRole });
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const pending = lessons.filter(lesson => lesson.status === 'draft');
  const approved = lessons.filter(lesson => lesson.status === 'published');
  const activeUsers = users.filter(user => user.active);
  const teachers = users.filter(user => user.role === 'teacher');
  const normalizedQuery = normalizeSearch(query);
  const filteredUsers = users.filter(user => normalizeSearch(`${user.name} ${user.email} ${user.group}`).includes(normalizedQuery) && (roleFilter === 'all' || user.role === roleFilter) && (userStatus === 'all' || (userStatus === 'active' ? user.active : !user.active)));
  const closeForm = () => {
    setShowAddUser(false);
    setDraft({ name: '', email: '', role: 'student' });
    setFormError('');
    requestAnimationFrame(() => addButtonRef.current?.focus());
  };

  const addUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = draft.name.trim().replace(/\s+/g, ' ');
    const email = draft.email.trim().toLowerCase();
    const error = getUserDraftError({ ...draft, name, email }, users);
    if (error) { setFormError(error); return; }
    setUsers(current => [{ id: crypto.randomUUID(), name, email, role: draft.role, active: true, group: 'Chưa phân nhóm' }, ...current]);
    setQuery('');
    setRoleFilter('all');
    setUserStatus('all');
    closeForm();
    onNotice(`Đã thêm hồ sơ mẫu của ${name}.`);
  };

  const toggleUser = (user: ManagedUser) => {
    if (!window.confirm(`${user.active ? 'Khóa' : 'Mở khóa'} hồ sơ mẫu của ${user.name}? Thao tác chỉ thay đổi trạng thái trong bản demo này.`)) return;
    setUsers(current => current.map(item => item.id === user.id ? { ...item, active: !item.active } : item));
    onNotice(`Đã ${user.active ? 'khóa' : 'mở khóa'} hồ sơ mẫu của ${user.name}.`);
  };

  const openCurriculum = (lessonId?: string) => {
    setInitialLessonId(lessonId);
    onSectionChange('content');
  };

  return (
    <div className="w-full space-y-6 pb-8">
      <div className="flex items-start gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-xs leading-5 text-on-surface-variant">
        <Icon className="text-base text-secondary">info</Icon>
        <p>Bản trải nghiệm • Học liệu đã xuất bản xuất hiện trong mục Môn học trên trình duyệt này. Hồ sơ người dùng là dữ liệu minh họa.</p>
      </div>
      {(usersError || storageError) && <p role="alert" className="rounded-xl bg-error-container p-4 text-sm text-on-error-container">{usersError || storageError}</p>}

      {section === 'overview' && <>
        <section className="relative overflow-hidden rounded-2xl bg-primary p-6 text-white md:p-8">
          <div aria-hidden="true" className="absolute -right-14 -top-28 h-72 w-72 rounded-full border-[32px] border-white/5" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary-fixed">Không gian quản trị</p>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Vận hành gọn gàng.<br />Học tập hiệu quả.</h1>
              <p className="mt-3 text-sm leading-6 text-primary-fixed">Theo dõi người dùng và quản lý chất lượng học liệu từ một không gian chung.</p>
            </div>
            <Button variant="secondary" type="button" onClick={() => openCurriculum()} className="shrink-0">Quản lý học liệu<Icon className="text-lg">arrow_forward</Icon></Button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { label: 'Người dùng', value: users.length, detail: `${users.filter(user => user.role === 'student').length} học sinh trong dữ liệu mẫu`, icon: 'groups', tone: 'text-primary bg-primary/8' },
            { label: 'Hồ sơ hoạt động', value: activeUsers.length, detail: `${users.length - activeUsers.length} hồ sơ đang khóa`, icon: 'verified_user', tone: 'text-secondary bg-secondary/10' },
            { label: 'Giáo viên', value: teachers.length, detail: `${teachers.filter(user => user.active).length} hồ sơ hoạt động`, icon: 'school', tone: 'text-tertiary bg-tertiary-fixed/50' },
            { label: 'Bài học bản nháp', value: pending.length, detail: `${approved.length} bài học đã xuất bản`, icon: 'fact_check', tone: 'text-warning bg-warning-container' },
          ].map(stat => <div key={stat.label} className="ui-card p-4 shadow-sm md:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-on-surface-variant">{stat.label}</span><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.tone}`}><Icon className="text-xl">{stat.icon}</Icon></span></div><p className="mt-3 text-3xl font-bold text-on-surface">{stat.value}</p><p className="mt-1 text-xs leading-5 text-outline">{stat.detail}</p></div>)}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <section className="overflow-hidden ui-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/25 p-5"><div><h2 className="font-bold text-on-surface">Bài học đang biên soạn</h2><p className="mt-1 text-xs text-outline">Hoàn thiện lý thuyết, ví dụ và bài tập trước khi xuất bản.</p></div><span className="rounded-full bg-warning-container px-3 py-1 text-xs font-bold text-warning">{pending.length} bản nháp</span></div>
            {pending.length ? <div className="divide-y divide-outline-variant/20">{pending.slice(0, 3).map(item => <Button variant="surface" type="button" key={item.id} onClick={() => openCurriculum(item.id)} className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary cursor-pointer"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-primary"><Icon>description</Icon></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-on-surface">{item.title}</span><span className="mt-1 block text-xs text-outline">{GRADES.find(grade => grade.id === item.gradeId)?.label} · {SUBJECTS.find(subject => subject.id === item.subjectId)?.name}</span></span><Icon className="text-outline">chevron_right</Icon></Button>)}</div> : <div className="p-8 text-center"><Icon className="text-3xl text-secondary">task_alt</Icon><p className="mt-2 text-sm text-on-surface-variant">Tất cả bài học đã được xuất bản.</p></div>}
          </section>
          <section className="ui-card p-5 shadow-sm">
            <h2 className="font-bold text-on-surface">Cộng đồng học tập</h2><p className="mt-1 text-xs text-outline">Phân bổ vai trò trong {users.length} hồ sơ mẫu.</p>
            <div className="mt-6 space-y-5">{(['student', 'teacher', 'admin'] as UserRole[]).map(role => { const count = users.filter(user => user.role === role).length; return <div key={role}><div className="mb-2 flex items-center justify-between text-sm"><span className="text-on-surface-variant">{roleLabels[role]}</span><span className="font-bold text-on-surface">{count}</span></div><div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-surface-container-low"><div className={`h-full rounded-full ${role === 'student' ? 'bg-primary' : role === 'teacher' ? 'bg-secondary' : 'bg-tertiary-fixed-dim'}`} style={{ width: `${users.length ? count / users.length * 100 : 0}%` }} /></div></div>; })}</div>
            <Button variant="secondary" type="button" onClick={() => onSectionChange('users')} className={`mt-6 w-full`}>Quản lý người dùng<Icon className="text-base">arrow_forward</Icon></Button>
          </section>
        </div>
      </>}

      {section === 'users' && <>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-1 text-xs font-bold uppercase tracking-wider text-secondary">Quản lý cộng đồng</p><h1 className="text-2xl font-bold text-on-surface">Người dùng</h1><p className="mt-2 text-sm text-on-surface-variant">Tra cứu hồ sơ, thêm thành viên và quản lý trạng thái.</p></div><Button variant="primary" ref={addButtonRef} type="button" aria-expanded={showAddUser} aria-controls="admin-add-user" onClick={() => { if (showAddUser) closeForm(); else setShowAddUser(true); }} ><Icon className="text-lg">person_add</Icon>Thêm người dùng</Button></div>
        {showAddUser && <form id="admin-add-user" onSubmit={addUser} onKeyDown={event => { if (event.key === 'Escape') closeForm(); }} noValidate className="rounded-2xl border border-primary/20 bg-surface-container-low p-5"><div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="font-bold text-on-surface">Thêm hồ sơ mẫu</h2><p className="mt-1 text-xs text-on-surface-variant">Hồ sơ chỉ được lưu tại đây; không tạo tài khoản đăng nhập hoặc gửi email.</p></div><Button variant="ghost" size="icon" type="button" onClick={closeForm} aria-label="Đóng biểu mẫu thêm người dùng" ><Icon>close</Icon></Button></div><div className="grid gap-4 md:grid-cols-3"><Field label={<> Họ và tên </>}>
<Input autoFocus required maxLength={100} value={draft.name} onChange={event => { setDraft({ ...draft, name: event.target.value }); setFormError(''); }} autoComplete="name" placeholder="Nguyễn Văn An" />
</Field><Field label={<> Email </>}>
<Input required type="email" maxLength={254} value={draft.email} onChange={event => { setDraft({ ...draft, email: event.target.value }); setFormError(''); }} autoComplete="email" placeholder="ten@example.com" />
</Field><Field label={<> Vai trò </>}>
<Select value={draft.role} onChange={event => setDraft({ ...draft, role: event.target.value as UserRole })}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
</Field></div>{formError && <p role="alert" className="mt-3 text-sm text-error">{formError}</p>}<div className="mt-4 flex justify-end gap-2"><Button variant="secondary" type="button" onClick={closeForm} >Hủy</Button><Button variant="primary" type="submit" >Lưu hồ sơ</Button></div></form>}
        <section aria-label="Danh sách người dùng" className="overflow-hidden ui-card">
          <div className="grid gap-3 border-b border-outline-variant/30 p-4 md:grid-cols-[minmax(0,1fr)_180px_180px]"><label className="relative"><span className="sr-only">Tìm người dùng</span><Icon className="pointer-events-none absolute left-3 top-3 text-lg text-outline">search</Icon><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm theo tên, email hoặc nhóm..." className={`pl-10`} /></label><label><span className="sr-only">Lọc theo vai trò</span><Select value={roleFilter} onChange={event => setRoleFilter(event.target.value)}><option value="all">Tất cả vai trò</option>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><label><span className="sr-only">Lọc theo trạng thái</span><Select value={userStatus} onChange={event => setUserStatus(event.target.value)}><option value="all">Tất cả trạng thái</option><option value="active">Hoạt động</option><option value="locked">Đã khóa</option></Select></label></div>
          <div role="list" className="space-y-3 p-4 sm:hidden" aria-label="Hồ sơ người dùng">
            {filteredUsers.map(user => (
              <article role="listitem" key={user.id} className="rounded-xl border border-outline-variant/40 bg-white p-4">
                <h2 className="font-bold text-on-surface">{user.name}</h2>
                <p className="mt-1 break-all text-sm text-on-surface-variant">{user.email}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-xs text-on-surface-variant">Vai trò</dt><dd className="font-semibold">{roleLabels[user.role]}</dd></div>
                  <div><dt className="text-xs text-on-surface-variant">Nhóm</dt><dd>{user.group}</dd></div>
                  <div><dt className="text-xs text-on-surface-variant">Trạng thái</dt><dd>{user.active ? "Hoạt động" : "Đã khóa"}</dd></div>
                </dl>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => toggleUser(user)}><Icon name={user.active ? "lock" : "lock_open"}/>{user.active ? "Khóa hồ sơ" : "Mở khóa hồ sơ"}</Button>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:block" tabIndex={0} role="region" aria-label="Bảng người dùng, có thể cuộn ngang"><table className="w-full min-w-[700px] text-left text-sm"><caption className="sr-only">Hồ sơ người dùng minh họa</caption><thead className="bg-surface-container-low/60 text-xs text-outline"><tr><th scope="col" className="px-5 py-3 font-semibold">Người dùng</th><th scope="col" className="px-4 py-3 font-semibold">Vai trò</th><th scope="col" className="px-4 py-3 font-semibold">Nhóm</th><th scope="col" className="px-4 py-3 font-semibold">Trạng thái</th><th scope="col" className="px-5 py-3 text-right font-semibold">Thao tác</th></tr></thead><tbody className="divide-y divide-outline-variant/20">{filteredUsers.map(user => <tr key={user.id} className="hover:bg-surface-container-low/35"><td className="px-5 py-4"><div className="flex items-center gap-3"><span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${user.role === 'teacher' ? 'bg-secondary/10 text-secondary' : 'bg-primary/8 text-primary'}`}>{user.name.split(' ').slice(-2).map(part => part[0]).join('')}</span><div><p className="font-semibold text-on-surface">{user.name}</p><p className="mt-0.5 text-xs text-outline">{user.email}</p></div></div></td><td className="px-4 py-4 text-on-surface-variant">{roleLabels[user.role]}</td><td className="px-4 py-4 text-on-surface-variant">{user.group}</td><td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${user.active ? 'bg-secondary/10 text-secondary' : 'bg-surface-container text-on-surface-variant'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{user.active ? 'Hoạt động' : 'Đã khóa'}</span></td><td className="px-5 py-4 text-right"><Button variant="ghost" size="icon" type="button" onClick={() => toggleUser(user)} aria-label={`${user.active ? 'Khóa' : 'Mở khóa'} hồ sơ ${user.name}`} className="whitespace-nowrap"><Icon className="text-base">{user.active ? 'lock' : 'lock_open'}</Icon>{user.active ? 'Khóa' : 'Mở khóa'}</Button></td></tr>)}</tbody></table></div>
          {filteredUsers.length === 0 && <div className="p-10 text-center"><Icon className="text-3xl text-outline">person_search</Icon><p className="mt-2 text-sm text-on-surface-variant">Không có người dùng phù hợp với bộ lọc.</p><Button variant="ghost" size="sm" type="button" onClick={() => { setQuery(''); setRoleFilter('all'); setUserStatus('all'); }} className="mt-3">Xóa bộ lọc</Button></div>}
          <p aria-live="polite" className="border-t border-outline-variant/25 px-5 py-3 text-xs text-outline">Hiển thị {filteredUsers.length} / {users.length} người dùng</p>
        </section>
      </>}

      {section === 'content' && <CurriculumAdminView initialLessonId={initialLessonId} onNotice={onNotice} />}
    </div>
  );
}
