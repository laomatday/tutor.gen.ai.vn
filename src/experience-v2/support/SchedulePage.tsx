import { useEffect, useRef, useState, type FormEvent } from "react";
import { Alert, Button, Field, Icon, Input, Modal, Select, Tabs, Textarea } from "../../components/ui";
import { appConfig } from "../../config/app";
import { useCurriculum } from "../../context/CurriculumContext";
import { localDayOfWeek } from "../../lib/dates";
import { lessonHref, ownedPublishedLessons, studentProfile } from "../../features/curriculum";
import {
  getNextScheduleSession,
  getScheduleWeek,
  selectScheduleSessions,
  summarizeSchedule,
  validateScheduleDraft,
  type ScheduleDraft,
} from "../../features/schedule/domain";
import { useSchedule } from "../../features/schedule/useSchedule";
import { DAYS_OF_WEEK, type ScheduleSession, type SessionType } from "../../features/schedule/types";
import { SupportHeader } from "./SupportUI";
import "./support-ui.css";

const typeOptions = [
  { id: "chinh-khoa", label: "Chính khóa", icon: "school" },
  { id: "tutor", label: "Tutor", icon: "support_agent" },
  { id: "tu-hoc", label: "Tự học", icon: "edit_square" },
  { id: "thi-thu", label: "Thi thử", icon: "quiz" },
] as const;
const filterOptions = [
  { id: "all", label: "Tất cả", icon: "calendar_today" },
  ...typeOptions,
] as const;
const viewOptions = [
  { id: "daily", label: "Theo ngày", icon: "calendar_today" },
  { id: "weekly", label: "Cả tuần", icon: "calendar_month" },
] as const;

interface Props {
  onNavigate: (path: string) => void;
}

function sessionDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} giờ${rest ? ` ${rest} phút` : ""}` : `${rest} phút`;
}

export function SchedulePage({ onNavigate }: Props) {
  const { subjects, lessons, topics } = useCurriculum();
  const { sessions, setSessions, storageError } = useSchedule();
  const [now, setNow] = useState(() => new Date());
  const currentDay = localDayOfWeek(now);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const [filter, setFilter] = useState<SessionType | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleSession | null>(null);
  const [deleted, setDeleted] = useState<ScheduleSession | null>(null);
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<ReturnType<typeof validateScheduleDraft>>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const week = getScheduleWeek(now);
  const selected = week.find((day) => day.day === selectedDay)!;
  const upcoming = getNextScheduleSession(sessions, now);
  const shown = selectScheduleSessions(
    sessions,
    view === "daily" ? { day: selectedDay, type: filter } : { type: filter },
  );
  const summary = summarizeSchedule(shown);
  const availableLessons = ownedPublishedLessons(lessons, topics);
  const subjectOptions = Array.from(
    new Map([
      ...subjects.map((subject) => [subject.name, subject.icon] as const),
      ...sessions.map((session) => [session.subjectName, session.subjectIcon] as const),
    ]).entries(),
  );
  const defaultSubject =
    subjects.find((subject) => subject.id === studentProfile.enrollments[0]?.subjectId)?.name ??
    subjectOptions[0]?.[0] ?? "Tự học";
  const createDraft = (day: number): ScheduleDraft => ({
    title: "", subjectName: defaultSubject, dayOfWeek: day, startTime: "19:30", endTime: "20:00",
    sessionType: "tu-hoc", instructor: "", location: "", notes: "",
  });
  const [draft, setDraft] = useState<ScheduleDraft>(() => createDraft(selectedDay));

  function changeDraft<K extends keyof ScheduleDraft>(field: K, value: ScheduleDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function openAdd(day = selectedDay) {
    setEditing(null);
    setDraft(createDraft(day));
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(session: ScheduleSession) {
    setEditing(session);
    setDraft({ ...session });
    setErrors({});
    setModalOpen(true);
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const validation = validateScheduleDraft(draft);
    setErrors(validation);
    if (Object.keys(validation).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    const entry: ScheduleSession = {
      ...editing,
      ...draft,
      id: editing?.id ?? `session-${crypto.randomUUID()}`,
      title: draft.title.trim(),
      subjectName: draft.subjectName.trim(),
      subjectIcon: subjectOptions.find(([name]) => name === draft.subjectName)?.[1] ?? "school",
      location: draft.location?.trim() ?? "",
      instructor: draft.instructor?.trim() ?? "",
      notes: draft.notes?.trim() ?? "",
      status: editing?.status ?? "upcoming",
    };
    setSessions((current) => editing
      ? current.map((session) => session.id === editing.id ? entry : session)
      : [...current, entry],
    );
    setSelectedDay(entry.dayOfWeek);
    setView("daily");
    setFilter("all");
    setNotice(editing ? "Đã cập nhật lịch học trên thiết bị." : "Đã thêm lịch tự học trên thiết bị.");
    setDeleted(null);
    setModalOpen(false);
  }

  function remove(session: ScheduleSession) {
    setSessions((current) => current.filter((item) => item.id !== session.id));
    setDeleted(session);
    setNotice(`Đã xóa “${session.title}”.`);
  }

  function undo() {
    if (!deleted) return;
    setSessions((current) => current.some((item) => item.id === deleted.id)
      ? current : [...current, deleted],
    );
    setDeleted(null);
    setNotice("Đã khôi phục buổi học.");
  }

  function destination(session: ScheduleSession) {
    const lesson = availableLessons.find((item) => item.id === session.lessonId);
    if (lesson) return lessonHref(lesson);
    if (session.sessionType === "tu-hoc") return "/tu-giai";
    if (session.sessionType === "thi-thu") return "/tien-bo";
    return "/hoc-bai";
  }

  function renderSession(session: ScheduleSession) {
    const kind = typeOptions.find((item) => item.id === session.sessionType)!;
    const editable = session.id.startsWith("session-");
    return (
      <article key={session.id} className="v2-schedule-session" data-session-id={session.id} data-type={session.sessionType}>
        <div className="v2-schedule-session-time">
          <strong>{session.startTime}</strong><span>{session.endTime}</span>
        </div>
        <div className="v2-schedule-session-body">
          <div className="v2-schedule-session-tags">
            <span><Icon name={session.subjectIcon} /> {session.subjectName}</span>
            <span><Icon name={kind.icon} /> {kind.label}</span>
            {session.status === "completed" && <span><Icon name="check" /> Đã hoàn thành theo dữ liệu lịch</span>}
          </div>
          <h3>{session.title}</h3>
          {(session.location || session.instructor) && (
            <p>
              {session.instructor && <>Người hướng dẫn: {session.instructor}. </>}
              {session.location && <>Địa điểm: {session.location}</>}
            </p>
          )}
          {session.notes && <details className="v2-support-disclosure"><summary>Ghi chú buổi học <Icon name="expand_more" /></summary><div>{session.notes}</div></details>}
          <div className="v2-schedule-session-actions">
            <Button variant="secondary" onClick={() => onNavigate(destination(session))}>
              {session.lessonId && availableLessons.some((lesson) => lesson.id === session.lessonId)
                ? "Mở bài học" : session.sessionType === "tu-hoc" ? "Mở tự giải" : "Mở nội dung"}
              <Icon name="arrow_forward" />
            </Button>
            {editable && (
              <>
                <Button variant="ghost" aria-label={`Chỉnh sửa lịch: ${session.title}`} onClick={() => openEdit(session)}>
                  <Icon name="edit" />
                </Button>
                <Button variant="ghost" aria-label={`Xóa lịch: ${session.title}`} onClick={() => remove(session)}>
                  <Icon name="delete_outline" />
                </Button>
              </>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="v2-support-page v2-schedule-page">
      <SupportHeader
        eyebrow="Kế hoạch học trên thiết bị"
        title="Lịch học của em"
        description="Chọn thời gian học vừa sức, biết buổi nào sắp đến và chuẩn bị trước mỗi lần học."
        icon="calendar_today"
      >
        <Button className="v2-support-on-hero" onClick={() => openAdd()}>
          <Icon name="add" /> Thêm lịch học
        </Button>
      </SupportHeader>

      <section className="v2-support-panel v2-schedule-calendar" aria-label="Chọn ngày và chế độ xem">
        <div className="v2-support-panel-heading">
          <div>
            <p className="v2-support-eyebrow">Lịch lặp lại hằng tuần · Múi giờ Việt Nam</p>
            <h2>Tuần này</h2>
          </div>
          <div className="v2-support-actions">
            <Button variant="ghost" onClick={() => { setSelectedDay(currentDay); setView("daily"); }}>
              <Icon name="calendar_today" /> Hôm nay
            </Button>
            <Tabs
              value={view}
              onChange={setView}
              tabs={viewOptions}
              label="Chế độ xem lịch"
              variant="pill"
            />
          </div>
        </div>
        <div className="v2-schedule-days" role="group" aria-label="Ngày trong tuần">
          {week.map((day) => {
            const count = sessions.filter((session) => session.dayOfWeek === day.day).length;
            return (
              <Button
                key={day.day}
                variant="ghost"
                data-today={day.isToday}
                aria-pressed={selectedDay === day.day && view === "daily"}
                aria-label={`${day.full}, ngày ${day.date}, ${count} buổi học`}
                onClick={() => { setSelectedDay(day.day); setView("daily"); }}
              >
                <span>{day.short}</span>
                <strong>{day.date.slice(-2)}</strong>
                <small>{count} buổi</small>
              </Button>
            );
          })}
        </div>
      </section>

      {storageError && <div role="alert"><Alert tone="warning">{storageError}</Alert></div>}
      {notice && (
        <div className="v2-support-notice" role="status">
          <Icon name="check_circle" /> {notice}
          {deleted && <Button variant="ghost" onClick={undo}>Hoàn tác</Button>}
          <Button variant="ghost" aria-label="Ẩn thông báo" onClick={() => { setNotice(""); setDeleted(null); }}><Icon name="close" /></Button>
        </div>
      )}

      <div className="v2-support-grid v2-support-grid--schedule">
        <section className="v2-support-panel v2-schedule-agenda" aria-labelledby="v2-schedule-agenda-title">
          <div className="v2-support-panel-heading">
            <div>
              <p className="v2-support-eyebrow">
                {summary.count} buổi · {sessionDuration(summary.minutes)} đã lên lịch
              </p>
              <h2 id="v2-schedule-agenda-title">{view === "daily" ? selected.full : "Một tuần nhìn thật rõ"}</h2>
            </div>
            <Tabs
              label="Loại buổi học"
              value={filter}
              onChange={setFilter}
              tabs={filterOptions}
              variant="pill"
              className="v2-schedule-filters"
            />
          </div>
          {shown.length ? (
            view === "daily" ? (
              <div className="v2-schedule-timeline">{shown.map(renderSession)}</div>
            ) : (
              <div className="v2-schedule-week-list">
                {week.filter((day) => shown.some((session) => session.dayOfWeek === day.day)).map((day) => (
                  <section key={day.day} aria-label={`Lịch ${day.full}`}>
                    <Button variant="ghost" onClick={() => { setSelectedDay(day.day); setView("daily"); }}>
                      {day.full} · {day.date}<Icon name="arrow_forward" />
                    </Button>
                    {shown.filter((session) => session.dayOfWeek === day.day).map(renderSession)}
                  </section>
                ))}
              </div>
            )
          ) : (
            <div className="v2-support-empty">
              <Icon name="calendar_today" />
              <h3>Chưa có buổi học trong lựa chọn này</h3>
              <p>Em có thể thêm một buổi tự học hoặc chọn ngày khác.</p>
              <Button onClick={() => filter === "all" ? openAdd() : setFilter("all")}>
                {filter === "all" ? "Thêm lịch" : "Xem tất cả"}
              </Button>
            </div>
          )}
          <p className="v2-support-footnote">Lịch mẫu và lịch cá nhân được lưu trên trình duyệt; đây là thời khóa biểu lặp lại, không phải lịch kết nối Google Calendar.</p>
        </section>

        <aside className="v2-support-panel v2-schedule-upcoming" aria-label="Chuẩn bị buổi học tiếp theo">
          <div className="v2-support-panel-heading"><h2><Icon name="alarm" /> Buổi học gần nhất</h2></div>
          {upcoming ? (
            <>
              <span className="v2-support-pill">
                {upcoming.isOngoing ? "Đang trong giờ học" : upcoming.daysAway === 0 ? "Hôm nay" : upcoming.daysAway === 1 ? "Ngày mai" : DAYS_OF_WEEK.find((day) => day.day === upcoming.session.dayOfWeek)?.full}
              </span>
              <strong className="v2-schedule-upcoming-time">{upcoming.session.startTime}<small> – {upcoming.session.endTime}</small></strong>
              <h3>{upcoming.session.title}</h3>
              <p>{upcoming.session.subjectName}</p>
              {upcoming.session.notes && (
                <div className="v2-schedule-upcoming-note">
                  <Icon name="edit_note" /><span>{upcoming.session.notes}</span>
                </div>
              )}
              <Button onClick={() => onNavigate(destination(upcoming.session))}>
                Mở hoạt động <Icon name="arrow_forward" />
              </Button>
            </>
          ) : (
            <div className="v2-support-empty">
              <Icon name="wb_sunny" />
              <p>Chưa có buổi học sắp tới trong lịch hiện tại.</p>
              <Button onClick={() => openAdd()}>Lên lịch tự học</Button>
            </div>
          )}
          <div className="v2-schedule-upcoming-footer">
            <Icon name="info" />
            <p>Không tự đánh dấu hoàn thành bài học chỉ vì đã đến giờ hoặc hết thời gian.</p>
          </div>
        </aside>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Chỉnh sửa lịch học" : "Thêm lịch học"}
        description="Buổi học sẽ lặp lại mỗi tuần và chỉ được lưu trên thiết bị này."
        className="v2-support-editor-modal"
      >
        <form ref={formRef} className="v2-support-editor" onSubmit={save} noValidate>
          <Field label="Tên buổi học" error={errors.title}>
            <Input
              autoFocus
              value={draft.title}
              maxLength={180}
              placeholder="Em muốn học điều gì?"
              required
              onChange={(event) => changeDraft("title", event.target.value)}
              aria-invalid={!!errors.title}
            />
          </Field>
          <div className="v2-support-form-grid">
            <Field label="Môn học" error={errors.subjectName}>
              <Select value={draft.subjectName} onChange={(event) => changeDraft("subjectName", event.target.value)} aria-invalid={!!errors.subjectName}>
                {subjectOptions.map(([name]) => <option key={name} value={name}>{name}</option>)}
              </Select>
            </Field>
            <Field label="Loại buổi học" error={errors.sessionType}>
              <Select value={draft.sessionType} onChange={(event) => changeDraft("sessionType", event.target.value as SessionType)} aria-invalid={!!errors.sessionType}>
                {typeOptions.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
              </Select>
            </Field>
            <Field label="Thứ trong tuần" error={errors.dayOfWeek}>
              <Select value={draft.dayOfWeek} onChange={(event) => changeDraft("dayOfWeek", Number(event.target.value))} aria-invalid={!!errors.dayOfWeek}>
                {DAYS_OF_WEEK.map((day) => <option key={day.day} value={day.day}>{day.full}</option>)}
              </Select>
            </Field>
            <Field label="Giờ bắt đầu" error={errors.startTime}>
              <Input type="time" value={draft.startTime} required onChange={(event) => changeDraft("startTime", event.target.value)} aria-invalid={!!errors.startTime} />
            </Field>
            <Field label="Giờ kết thúc" error={errors.endTime}>
              <Input type="time" value={draft.endTime} required onChange={(event) => changeDraft("endTime", event.target.value)} aria-invalid={!!errors.endTime} />
            </Field>
            <Field label="Người hướng dẫn (không bắt buộc)">
              <Input value={draft.instructor ?? ""} maxLength={100} onChange={(event) => changeDraft("instructor", event.target.value)} />
            </Field>
            <Field label="Địa điểm (không bắt buộc)">
              <Input value={draft.location ?? ""} maxLength={150} onChange={(event) => changeDraft("location", event.target.value)} />
            </Field>
          </div>
          <Field label="Ghi chú chuẩn bị (không bắt buộc)">
            <Textarea
              rows={3}
              maxLength={1000}
              value={draft.notes ?? ""}
              onChange={(event) => changeDraft("notes", event.target.value)}
            />
          </Field>
          <div className="v2-support-form-actions">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit"><Icon name="save" /> {editing ? "Lưu thay đổi" : "Thêm buổi học"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
