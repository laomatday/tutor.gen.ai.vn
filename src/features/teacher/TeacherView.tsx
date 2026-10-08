import { Button, Input, Textarea, Select, Icon, Badge, Field, Alert, Progress } from "../../components/ui";
import { TeacherAssignmentList } from './TeacherAssignmentList';
import { TeacherDetailsDialog } from './TeacherDetailsDialog';
import React, { useEffect, useRef, useState } from 'react';
import { classes, students, initialAssignments } from './data';
import { classLabel, teachingProgramLabel, teacherRules, needsSupport, averageProgress, isAssignments, classStudents, submissionCount } from './domain';
import type { Assignment, Student } from './types';
import { localDate, formatDate } from '../../lib/dates';
import { normalizeSearch } from '../../lib/search';
import { appConfig } from '../../config/app';
import { storageKeys } from '../../config/storage';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export type TeacherSection = 'overview' | 'classes' | 'assignments';

interface TeacherViewProps {
  section: TeacherSection;
  onSectionChange: (section: TeacherSection) => void;
  onNotice: (message: string) => void;
}


export function TeacherView({ section, onSectionChange, onNotice }: TeacherViewProps) {
  const [assignments, setAssignments, storageError] = useLocalStorage<Assignment[]>(storageKeys.teacherAssignments, initialAssignments, isAssignments);
  const [selectedClass, setSelectedClass] = useState('all');
  const [query, setQuery] = useState('');
  const [supportOnly, setSupportOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [title, setTitle] = useState('');
  const [assignmentClass, setAssignmentClass] = useState(classes[0].id);
  const [dueDate, setDueDate] = useState(localDate(1));
  const [description, setDescription] = useState('');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showForm && section === 'assignments') titleRef.current?.focus();
  }, [showForm, section]);

  const supportStudents = students.filter(needsSupport);
  const filteredStudents = students.filter(student =>
    (selectedClass === 'all' || student.classId === selectedClass)
    && (!supportOnly || needsSupport(student))
    && normalizeSearch(`${student.name} ${student.classId}`).includes(normalizeSearch(query.trim())),
  );
  const pendingAssignments = assignments.filter(assignment => submissionCount(assignment) < classStudents(assignment.classId).length);
  const filteredAssignments = assignments.filter(assignment => selectedClass === 'all' || assignment.classId === selectedClass)
    .slice().sort((first, second) => first.dueDate.localeCompare(second.dueDate));
  const sectionTitles: Record<TeacherSection, string> = { overview: 'Mỗi học sinh, một bước tiến.', classes: 'Lớp học của bạn', assignments: 'Bài tập & tiến độ' };

  function openCreationForm() {
    if (selectedClass !== 'all') setAssignmentClass(selectedClass);
    setFormError('');
    setShowForm(true);
    onSectionChange('assignments');
  }

  function createAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim().length < 3) {
      setFormError('Tên bài tập cần ít nhất 3 ký tự.');
      titleRef.current?.focus();
      return;
    }
    if (!classes.some(group => group.id === assignmentClass)) {
      setFormError('Vui lòng chọn một lớp học hợp lệ.');
      return;
    }
    if (!dueDate || Number.isNaN(new Date(`${dueDate}T12:00:00`).getTime()) || dueDate < localDate()) {
      setFormError('Hạn nộp phải từ hôm nay trở đi.');
      return;
    }
    const next: Assignment = {
      id: `assignment-${crypto.randomUUID()}`,
      title: title.trim(), classId: assignmentClass, dueDate,
      description: description.trim(), submitted: [],
    };
    setAssignments(previous => [...previous, next]);
    setSelectedClass(assignmentClass);
    setTitle('');
    setDescription('');
    setDueDate(localDate(1));
    setShowForm(false);
    setFormError('');
    onNotice(`Đã thêm bài tập cho lớp ${assignmentClass} vào bản mẫu trên trình duyệt này.`);
  }

  function closeDetails() {
    setActiveStudent(null);
    setActiveAssignment(null);
  }


  return <div className="teacher-workspace w-full space-y-6 pb-10">
    <div className="ui-page-header">
      <div>
        <p className="ui-page-kicker">Không gian giáo viên</p>
        <h1 className="ui-page-title">{sectionTitles[section]}</h1>
        <p className="ui-page-description">Theo dõi tiến độ, nhận diện khó khăn và đồng hành cùng từng lớp học.</p>
      </div>
      <Button variant="primary" type="button" onClick={openCreationForm} ><Icon name="add" className="text-lg" />Tạo bài tập</Button>
    </div>

    <div className="flex items-start gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-xs leading-relaxed text-on-surface-variant">
      <Icon name="info" className="shrink-0 text-lg text-primary" />
      <p>Dữ liệu minh họa · Các lớp, học sinh và lượt nộp bài dưới đây là dữ liệu mẫu. Bài tập mới chỉ được lưu trên trình duyệt này, chưa gửi tới học sinh.</p>
    </div>
    {storageError && <Alert tone="danger">{storageError}</Alert>}

    <div className="teacher-metrics grid gap-3">
      {[
        { label: 'Lớp đang phụ trách', value: classes.length, icon: 'school', detail: teachingProgramLabel },
        { label: 'Học sinh', value: students.length, icon: 'groups', detail: `Trong ${classes.length} lớp minh họa` },
        { label: 'Tiến độ trung bình', value: `${averageProgress(students)}%`, icon: 'trending_up', detail: 'Tiến độ lộ trình học tập' },
        { label: 'Cần hỗ trợ', value: supportStudents.length, icon: 'volunteer_activism', detail: 'Học sinh cần củng cố' },
      ].map((stat, index) => <div key={stat.label} className="ui-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-2"><p className="text-xs font-semibold text-on-surface-variant">{stat.label}</p><Icon name={stat.icon} className={index === 3 ? 'text-secondary' : 'text-primary'} /></div>
        <p className="text-3xl font-bold tracking-tight text-on-surface">{stat.value}</p>
        <p className="mt-2 text-xs text-on-surface-variant">{stat.detail}</p>
      </div>)}
    </div>

    {section === 'overview' && <div className="teacher-overview grid gap-5">
      <section className="teacher-priority relative overflow-hidden rounded-2xl bg-primary p-6 text-white">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border-[28px] border-white/5" />
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-secondary-fixed"><Icon name="insights" className="text-lg" />Ưu tiên hỗ trợ</p>
        <h2 className="max-w-md text-2xl font-bold leading-snug">Một chút hỗ trợ đúng lúc,<br />thêm tự tin cho {supportStudents.length} học sinh.</h2>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/80">Nhóm có tiến độ dưới {teacherRules.supportProgressPercent}% hoặc điểm trung bình dưới {teacherRules.supportScore.toLocaleString(appConfig.locale)} cần được củng cố kiến thức nền. Xem chủ đề cụ thể để chuẩn bị nội dung phù hợp.</p>
        <Button variant="secondary" type="button" onClick={() => { setSupportOnly(true); setSelectedClass('all'); setQuery(''); onSectionChange('classes'); }} className="mt-5">Xem nhóm cần hỗ trợ<Icon name="arrow_forward" className="text-lg" /></Button>
      </section>
      <section className="ui-card p-5">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><Icon name="checklist" /></span>
        <h2 className="mt-4 text-lg font-bold text-on-surface">Nhịp học của các lớp</h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant"><strong className="text-primary">{pendingAssignments.length} bài tập</strong> chưa đủ lượt nộp trong dữ liệu mẫu. Xem chi tiết để biết học sinh nào còn cần hoàn thành.</p>
        <Button variant="ghost" size="sm" type="button" onClick={() => { setSelectedClass('all'); onSectionChange('assignments'); }} className="mt-4">Theo dõi bài tập<Icon name="arrow_forward" className="text-lg" /></Button>
      </section>
    </div>}

    {section !== 'assignments' && <section aria-labelledby="teacher-classes-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="teacher-classes-title" className="text-lg font-bold text-on-surface">Lớp học đang phụ trách</h2>
        {section === 'overview' && <Button variant="ghost" size="sm" type="button" onClick={() => { setSelectedClass('all'); setSupportOnly(false); setQuery(''); onSectionChange('classes'); }} >Xem tất cả học sinh →</Button>}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {classes.map(group => {
          const members = classStudents(group.id);
          const progress = averageProgress(members);
          const supportCount = members.filter(needsSupport).length;
          return <Button variant="surface" key={group.id} type="button" onClick={() => { setSelectedClass(group.id); setSupportOnly(false); setQuery(''); onSectionChange('classes'); }} className={`rounded-2xl border bg-white p-5 text-left transition-colors hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-primary ${selectedClass === group.id ? 'border-primary ring-1 ring-primary/20' : 'border-outline-variant/30'}`}>
            <div className="flex items-center justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ui-tone-${group.tone}`}><Icon name="menu_book" /></span><span className="rounded-full bg-surface-container-low px-2.5 py-1 text-xs text-on-surface-variant">{members.length} học sinh</span></div>
            <h3 className="mt-4 text-xl font-bold text-on-surface">{classLabel(group.id)}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">{group.topic}</p>
            <div className="mb-2 mt-5 flex justify-between text-xs"><span className="text-on-surface-variant">Tiến độ trung bình</span><span className="font-bold text-primary">{progress}%</span></div>
            <Progress value={progress} label={`Tiến độ lớp ${group.id}: ${progress}%`} tone="accent" className="h-1.5" />
            <div className="mt-4 flex items-center justify-between text-xs"><span className="text-secondary">{supportCount} học sinh cần hỗ trợ</span><Icon name="arrow_forward" className="text-lg text-primary" /></div>
          </Button>;
        })}
      </div>
    </section>}

    {section === 'classes' && <section className="overflow-hidden ui-card" aria-labelledby="teacher-progress-title">
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="teacher-progress-title" className="text-lg font-bold text-on-surface">Tiến độ học sinh</h2><p className="mt-1 text-xs text-on-surface-variant">Điểm trung bình theo thang {teacherRules.scoreScale} · Tiến độ lộ trình mẫu</p></div><span className="text-sm text-on-surface-variant" role="status">{filteredStudents.length} học sinh</span></div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="min-w-52 flex-1"><span className="sr-only">Tìm học sinh</span><Input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên học sinh hoặc lớp…" /></label>
          <label><span className="sr-only">Lọc lớp học</span><Select value={selectedClass} onChange={event => setSelectedClass(event.target.value)}><option value="all">Tất cả lớp</option>{classes.map(group => <option key={group.id} value={group.id}>Lớp {group.id}</option>)}</Select></label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-on-surface"><Input type="checkbox" checked={supportOnly} onChange={event => setSupportOnly(event.target.checked)} className="h-4 w-4 accent-primary" />Cần hỗ trợ</label>
        </div>
      </div>
      <div role="list" aria-label="Tiến độ học sinh" className="space-y-3 p-4 sm:hidden">
        {filteredStudents.map(student => (
          <article key={student.id} role="listitem" className="rounded-xl border border-outline-variant/40 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="font-bold text-primary">{student.name}</h3><p className="mt-1 text-sm text-on-surface-variant">Lớp {student.classId}</p></div>
              <Badge tone={needsSupport(student) ? "warning" : "success"}>{needsSupport(student) ? "Cần hỗ trợ" : "Đúng tiến độ"}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm">Tiến độ: {student.completion}%</span>
              <span className="text-sm font-bold text-primary">Điểm TB: {student.score.toLocaleString(appConfig.locale, {minimumFractionDigits: 1})}</span>
            </div>
            <Progress value={student.completion} label={`Tiến độ của ${student.name}`} tone="accent" className="mt-2" />
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setActiveStudent(student)}>Xem chi tiết <Icon name="arrow_forward" /></Button>
          </article>
        ))}
        {!filteredStudents.length && <p className="text-sm text-on-surface-variant">Không tìm thấy học sinh phù hợp.</p>}
       </div>
       <div className="hidden overflow-x-auto sm:block">
         <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="bg-surface-container-low text-xs text-on-surface-variant"><tr>{['Học sinh', 'Lớp', 'Tiến độ', 'Điểm TB', 'Tình trạng', 'Chi tiết'].map(label => <th scope="col" key={label} className="px-5 py-3 font-semibold">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-outline-variant/25">
            {filteredStudents.map(student => <tr key={student.id} className="hover:bg-surface/80">
              <th scope="row" className="px-5 py-4 font-semibold text-on-surface">{student.name}</th>
              <td className="px-5 py-4 text-on-surface-variant">{student.classId}</td>
              <td className="px-5 py-4"><div className="flex items-center gap-2"><Progress value={student.completion} label={`Tiến độ của ${student.name}`} tone="accent" className="h-1.5 w-16" /><span className="text-xs text-on-surface-variant">{student.completion}%</span></div></td>
              <td className="px-5 py-4 font-semibold text-primary">{student.score.toLocaleString(appConfig.locale, { minimumFractionDigits: 1 })}</td>
              <td className="px-5 py-4"><Badge tone={needsSupport(student) ? 'warning' : 'success'}>{needsSupport(student) ? 'Cần hỗ trợ' : 'Đúng tiến độ'}</Badge></td>
              <td className="px-5 py-4"><Button variant="ghost" size="icon" type="button" onClick={() => setActiveStudent(student)}  aria-label={`Xem tiến độ ${student.name}`}><Icon name="open_in_new" className="text-lg" /></Button></td>
            </tr>)}
            {!filteredStudents.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-on-surface-variant">Không tìm thấy học sinh phù hợp. Thử đổi tên hoặc bộ lọc.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>}

    {section === 'assignments' && <>
      {showForm && <section className="rounded-2xl border border-primary/25 bg-white p-5 sm:p-6" aria-labelledby="teacher-create-title">
        <h2 id="teacher-create-title" className="text-lg font-bold text-on-surface">Tạo bài tập mới</h2>
        <p className="mt-1 text-xs text-on-surface-variant">Bản mẫu cục bộ · Các trường có dấu * là bắt buộc.</p>
        <form onSubmit={createAssignment} className="mt-5 space-y-4">
          <Field label={<> Tên bài tập * </>}>
<Input ref={titleRef} required minLength={3} maxLength={120} value={title} onChange={event => setTitle(event.target.value)} className={``} placeholder="Ví dụ: Luyện tập phương trình bậc hai" />
</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={<> Lớp học * </>}>
<Select required value={assignmentClass} onChange={event => setAssignmentClass(event.target.value)} className={``}>{classes.map(group => <option key={group.id} value={group.id}>{classLabel(group.id)}</option>)}</Select>
</Field>
            <Field label={<> Hạn nộp * </>}>
<Input required type="date" min={localDate()} value={dueDate} onChange={event => setDueDate(event.target.value)} className={``} />
</Field>
          </div>
          <Field label={<> Hướng dẫn làm bài </>}>
<Textarea rows={3} maxLength={2000} value={description} onChange={event => setDescription(event.target.value)} className={`resize-y`} placeholder="Nội dung cần hoàn thành, yêu cầu trình bày…" />
</Field>
          {formError && <p role="alert" className="text-sm text-error">{formError}</p>}
          <div className="flex flex-wrap gap-3"><Button variant="primary" type="submit" ><Icon name="save" className="text-lg" />Lưu bài tập</Button><Button variant="secondary" type="button" onClick={() => { setShowForm(false); setFormError(''); }} >Hủy</Button></div>
        </form>
      </section>}
      <section className="ui-card p-5 sm:p-6" aria-labelledby="teacher-assignments-title">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3"><h2 id="teacher-assignments-title" className="text-lg font-bold text-on-surface">Danh sách bài tập <span className="ml-1 text-sm font-normal text-on-surface-variant">({filteredAssignments.length})</span></h2><label><span className="sr-only">Lọc bài tập theo lớp</span><Select value={selectedClass} onChange={event => setSelectedClass(event.target.value)}><option value="all">Tất cả lớp</option>{classes.map(group => <option key={group.id} value={group.id}>Lớp {group.id}</option>)}</Select></label></div>
        <TeacherAssignmentList items={filteredAssignments} onSelect={setActiveAssignment} />
      </section>
    </>}

    {section === 'overview' && <section className="ui-card p-5 sm:p-6" aria-labelledby="teacher-recent-title">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="teacher-recent-title" className="text-lg font-bold text-on-surface">Bài tập cần theo dõi</h2><Button variant="ghost" size="sm" type="button" onClick={() => { setSelectedClass('all'); onSectionChange('assignments'); }} >Xem tất cả →</Button></div>
      <TeacherAssignmentList items={pendingAssignments.slice().sort((first, second) => first.dueDate.localeCompare(second.dueDate)).slice(0, 3)} onSelect={setActiveAssignment} />
    </section>}

    <TeacherDetailsDialog student={activeStudent} assignment={activeAssignment} assignments={assignments} onClose={closeDetails} />
  </div>;
}
