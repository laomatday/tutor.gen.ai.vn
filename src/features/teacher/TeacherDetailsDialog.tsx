import { Button, Modal } from '../../components/ui';
import { formatDate } from '../../lib/dates';
import { appConfig } from '../../config/app';
import { classStudents, needsSupport, submissionCount, teacherRules } from './domain';
import type { Student, Assignment } from './types';

interface TeacherDetailsDialogProps {
  student: Student | null;
  assignment: Assignment | null;
  assignments: Assignment[];
  onClose: () => void;
}

export function TeacherDetailsDialog({ student: activeStudent, assignment: activeAssignment, assignments, onClose: closeDetails }: TeacherDetailsDialogProps) {
  return (
    <Modal open={Boolean(activeStudent || activeAssignment)} onClose={closeDetails}
      title={activeStudent?.name ?? activeAssignment?.title ?? ''}
      description={activeStudent ? `Học sinh · Lớp ${activeStudent.classId}` : `Bài tập · Lớp ${activeAssignment?.classId ?? ''}`}
      footer={<Button variant="secondary" onClick={closeDetails} className="w-full">Đóng</Button>}>
        {activeStudent && <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-surface-container-low p-4"><p className="text-xs text-on-surface-variant">Tiến độ lộ trình</p><p className="mt-1 text-2xl font-bold text-primary">{activeStudent.completion}%</p></div><div className="rounded-xl bg-surface-container-low p-4"><p className="text-xs text-on-surface-variant">Điểm trung bình</p><p className="mt-1 text-2xl font-bold text-primary">{activeStudent.score.toLocaleString(appConfig.locale)}<span className="text-sm font-normal"> / {teacherRules.scoreScale}</span></p></div></div>
          <div><h3 className="mb-2 text-sm font-bold">{needsSupport(activeStudent) ? 'Nội dung cần củng cố' : 'Nội dung học tiếp theo'}</h3><p className="rounded-xl bg-secondary/10 p-4 text-sm text-secondary">{activeStudent.focus}</p></div>
          <div><h3 className="mb-2 text-sm font-bold">Bài tập của học sinh</h3>{assignments.filter(assignment => assignment.classId === activeStudent.classId).map(assignment => <div key={assignment.id} className="flex items-center justify-between gap-4 border-b border-outline-variant/30 py-3 text-sm"><span className="min-w-0 break-words">{assignment.title}</span><span className={`shrink-0 text-xs font-semibold ${assignment.submitted.includes(activeStudent.id) ? 'text-secondary' : 'text-on-surface-variant'}`}>{assignment.submitted.includes(activeStudent.id) ? 'Đã nộp' : 'Chưa nộp'}</span></div>)}</div>
        </div>}
        {activeAssignment && <div className="space-y-5">
          <div className="flex flex-wrap gap-3 text-sm"><span className="rounded-lg bg-surface-container-low px-3 py-2">Hạn nộp: {formatDate(activeAssignment.dueDate)}</span><span className="rounded-lg bg-secondary/10 px-3 py-2 text-secondary">{submissionCount(activeAssignment)}/{classStudents(activeAssignment.classId).length} đã nộp</span></div>
          <div><h3 className="mb-2 text-sm font-bold">Hướng dẫn</h3><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-on-surface-variant">{activeAssignment.description || 'Chưa bổ sung hướng dẫn cho bài tập này.'}</p></div>
          <div><h3 className="mb-2 text-sm font-bold">Tình trạng nộp bài</h3>{classStudents(activeAssignment.classId).map(student => <div key={student.id} className="flex items-center justify-between gap-3 border-b border-outline-variant/30 py-3 text-sm"><span>{student.name}</span><span className={`shrink-0 text-xs font-semibold ${activeAssignment.submitted.includes(student.id) ? 'text-secondary' : 'text-on-surface-variant'}`}>{activeAssignment.submitted.includes(student.id) ? 'Đã nộp' : 'Chưa nộp'}</span></div>)}</div>
        </div>}
        <p className="mt-5 text-xs leading-relaxed text-on-surface-variant">Thông tin minh họa trên trình duyệt, chưa kết nối dữ liệu học tập thực tế.</p>
    </Modal>
  );
}
