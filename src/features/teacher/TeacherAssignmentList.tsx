import { Button, Icon } from '../../components/ui';
import { localDate, formatDate } from '../../lib/dates';
import { classStudents, submissionCount } from './domain';
import type { Assignment } from './types';

export function TeacherAssignmentList({ items, onSelect }: { items: Assignment[]; onSelect: (assignment: Assignment) => void }) {
    return <div className="divide-y divide-outline-variant/30">
      {items.length === 0 && <p className="py-8 text-center text-sm text-on-surface-variant">Lớp này chưa có bài tập. Tạo bài đầu tiên để bắt đầu.</p>}
      {items.map(assignment => {
        const count = submissionCount(assignment);
        const total = classStudents(assignment.classId).length;
        const complete = count === total;
        const overdue = !complete && assignment.dueDate < localDate();
        return <div key={assignment.id} className="flex flex-wrap items-center gap-3 py-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${complete ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-low text-primary'}`}><Icon name={complete ? 'task_alt' : 'assignment'} /></span>
          <div className="min-w-0 flex-1 basis-40">
            <h3 className="break-words text-sm font-bold text-on-surface">{assignment.title}</h3>
            <p className="mt-1 text-xs text-on-surface-variant">Lớp {assignment.classId} · Hạn {formatDate(assignment.dueDate)}</p>
          </div>
          <div className="min-w-24 text-xs">
            <p className="font-semibold text-on-surface">{count}/{total} đã nộp</p>
            <p className={`mt-1 ${complete ? 'text-secondary' : overdue ? 'text-error' : 'text-on-surface-variant'}`}>{complete ? 'Đã hoàn thành' : overdue ? 'Quá hạn' : 'Đang thực hiện'}</p>
          </div>
          <Button variant="ghost" size="icon" type="button" onClick={() => onSelect(assignment)}  aria-label={`Chi tiết bài tập ${assignment.title}`}><Icon name="arrow_forward" /></Button>
        </div>;
      })}
    </div>;
  }

