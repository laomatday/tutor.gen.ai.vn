import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Alert,
  Badge,
  Button,
  Field,
  Icon,
  Input,
  Modal,
  Select,
  Tabs,
  Textarea,
} from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import { appConfig } from "../../config/app";
import { routePath } from "../../config/routes";
import { localDayOfWeek } from "../../lib/dates";
import {
  lessonHref,
  ownedPublishedLessons,
  studentProfile,
} from "../curriculum";
import {
  getNextScheduleSession,
  getScheduleWeek,
  selectScheduleSessions,
  summarizeSchedule,
  validateScheduleDraft,
  type ScheduleDraft,
} from "./domain";
import { DAYS_OF_WEEK, type ScheduleSession, type SessionType } from "./types";
import { useSchedule } from "./useSchedule";
import "../../styles/student-schedule.css";

const sessionTypes = [
  { id: "chinh-khoa", label: "Chính khóa", icon: "school" },
  { id: "tutor", label: "Tutor", icon: "support_agent" },
  { id: "tu-hoc", label: "Tự học", icon: "edit_square" },
  { id: "thi-thu", label: "Thi thử", icon: "quiz" },
] as const;
const filterTabs = [
  { id: "all", label: "Tất cả", icon: "calendar_today" },
  ...sessionTypes,
] as const;
const viewTabs = [
  { id: "daily", label: "Theo ngày" },
  { id: "weekly", label: "Cả tuần" },
] as const;
const shortDate = (date: string) =>
  new Intl.DateTimeFormat(appConfig.locale, {
    timeZone: appConfig.timeZone,
    day: "numeric",
    month: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
const durationLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} giờ${rest ? ` ${rest} phút` : ""}` : `${rest} phút`;
};

export function TimetableScheduleView({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const { subjects, lessons, topics } = useCurriculum();
  const { sessions, setSessions, storageError } = useSchedule();
  const [now, setNow] = useState(() => new Date());
  const currentDay = localDayOfWeek(now);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [filterType, setFilterType] = useState<SessionType | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleSession | null>(null);
  const [deleted, setDeleted] = useState<ScheduleSession | null>(null);
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<
    ReturnType<typeof validateScheduleDraft>
  >({});
  const formRef = useRef<HTMLFormElement>(null);
  const days = getScheduleWeek(now);
  const selected = days.find((day) => day.day === selectedDay)!;
  const upcoming = getNextScheduleSession(sessions, now);
  const scope = selectScheduleSessions(
    sessions,
    viewMode === "daily" ? { day: selectedDay } : {},
  );
  const shown = selectScheduleSessions(scope, { type: filterType });
  const summary = summarizeSchedule(shown);
  const availableLessons = ownedPublishedLessons(lessons, topics);
  const subjectOptions = Array.from(
    new Map([
      ...subjects.map((subject) => [subject.name, subject.icon] as const),
      ...sessions.map(
        (session) => [session.subjectName, session.subjectIcon] as const,
      ),
    ]).entries(),
  );
  const defaultSubject =
    subjects.find(
      (subject) => subject.id === studentProfile.enrollments[0]?.subjectId,
    )?.name ??
    subjectOptions[0]?.[0] ??
    "";
  const createDraft = (day: number): ScheduleDraft => ({
    title: "",
    subjectName: defaultSubject,
    dayOfWeek: day,
    sessionType: "tu-hoc",
    startTime: "19:30",
    endTime: "20:00",
    instructor: "",
    location: "",
    notes: "",
  });
  const [draft, setDraft] = useState<ScheduleDraft>(() =>
    createDraft(selectedDay),
  );

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const changeDraft = <K extends keyof ScheduleDraft>(
    key: K,
    value: ScheduleDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const openAdd = () => {
    setEditing(null);
    setDraft(createDraft(selectedDay));
    setErrors({});
    setModalOpen(true);
  };
  const openEdit = (session: ScheduleSession) => {
    setEditing(session);
    setDraft({ ...session });
    setErrors({});
    setModalOpen(true);
  };
  const saveSession = (event: FormEvent) => {
    event.preventDefault();
    const validation = validateScheduleDraft(draft);
    setErrors(validation);
    if (Object.keys(validation).length) {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    const entry: ScheduleSession = {
      ...editing,
      ...draft,
      id: editing?.id ?? `session-${crypto.randomUUID()}`,
      title: draft.title.trim(),
      subjectName: draft.subjectName.trim(),
      subjectIcon:
        subjectOptions.find(([name]) => name === draft.subjectName)?.[1] ??
        "school",
      location: draft.location?.trim() ?? "",
      instructor: draft.instructor?.trim() ?? "",
      notes: draft.notes?.trim() ?? "",
      status: editing?.status ?? "upcoming",
    };
    setSessions((current) =>
      editing
        ? current.map((session) =>
            session.id === editing.id ? entry : session,
          )
        : [...current, entry],
    );
    setSelectedDay(entry.dayOfWeek);
    setViewMode("daily");
    setFilterType("all");
    setNotice(editing ? "Đã cập nhật lịch học." : "Đã thêm lịch học của em.");
    setDeleted(null);
    setModalOpen(false);
  };
  const deleteSession = (session: ScheduleSession) => {
    setSessions((current) =>
      current.filter((entry) => entry.id !== session.id),
    );
    setDeleted(session);
    setNotice(`Đã xóa “${session.title}”.`);
  };
  const undoDelete = () => {
    if (!deleted) return;
    setSessions((current) =>
      current.some((entry) => entry.id === deleted.id)
        ? current
        : [...current, deleted],
    );
    setDeleted(null);
    setNotice("Đã khôi phục lịch học.");
  };
  const sessionAction = (session: ScheduleSession) => {
    const lesson = availableLessons.find(
      (entry) => entry.id === session.lessonId,
    );
    if (lesson)
      return {
        label: "Mở bài học",
        path: lessonHref(lesson),
        icon: "menu_book",
      };
    if (session.sessionType === "tu-hoc")
      return {
        label: "Mở tự giải",
        path: routePath("tu-giai"),
        icon: "edit_square",
      };
    if (session.sessionType === "thi-thu")
      return {
        label: "Xem bài thi mẫu",
        path: routePath("tien-bo"),
        icon: "quiz",
      };
    return {
      label: "Xem môn học",
      path: routePath("hoc-bai"),
      icon: "menu_book",
    };
  };

  const renderSession = (session: ScheduleSession, compact = false) => {
    const kind = sessionTypes.find((type) => type.id === session.sessionType)!;
    const action = sessionAction(session);
    const isNext =
      upcoming?.session.id === session.id &&
      upcoming.date === days.find((day) => day.day === session.dayOfWeek)?.date;
    const custom = session.id.startsWith("session-");
    return (
      <article
        key={session.id}
        data-session-id={session.id}
        data-kind={session.sessionType}
        data-next={isNext}
        className={`schedule-session ${compact ? "schedule-session--compact" : ""}`}
        aria-label={session.title}
      >
        <div className="schedule-session-time">
          <time>{session.startTime}</time>
          <span>{session.endTime}</span>
          <i aria-hidden="true" />
        </div>
        <div className="schedule-session-body">
          <div className="schedule-session-topline">
            <span className="schedule-subject">
              <Icon name={session.subjectIcon} />
              {session.subjectName}
            </span>
            <span className="schedule-kind">
              <Icon name={kind.icon} />
              {kind.label}
            </span>
            {session.status === "completed" && (
              <span className="schedule-completed">
                <Icon name="check" />
                Đã hoàn thành
              </span>
            )}
            {isNext && (
              <span className="schedule-next-label">
                {upcoming.isOngoing ? "Đang diễn ra" : "Tiếp theo"}
              </span>
            )}
          </div>
          <h3>{session.title}</h3>
          {(session.instructor || session.location) && (
            <div className="schedule-session-meta">
              {session.instructor && (
                <span>
                  <Icon name="person" />
                  {session.instructor}
                </span>
              )}
              {session.location && (
                <span>
                  <Icon name="room" />
                  {session.location}
                </span>
              )}
            </div>
          )}
          <div className="schedule-session-bottom">
            {session.notes && (
              <details className="schedule-session-notes">
                <summary>
                  <Icon name="edit_note" />
                  Chuẩn bị cho buổi học
                  <Icon name="expand_more" />
                </summary>
                <p>{session.notes}</p>
              </details>
            )}
            <div className="schedule-session-actions">
              {custom && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Chỉnh sửa lịch: ${session.title}`}
                    title="Chỉnh sửa lịch"
                    onClick={() => openEdit(session)}
                  >
                    <Icon name="edit" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Xóa lịch: ${session.title}`}
                    title="Xóa lịch"
                    onClick={() => deleteSession(session)}
                  >
                    <Icon name="delete_outline" />
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate(action.path)}
              >
                {action.label}
                <Icon name="arrow_forward" />
              </Button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="schedule-desk">
      <header className="schedule-heading">
        <div>
          <p className="schedule-eyebrow">
            <Icon name="calendar_today" />
            Một tuần theo nhịp của em
          </p>
          <h1>Lịch học của mình</h1>
          <p>Biết lúc nào học, sẵn sàng cho điều tiếp theo.</p>
        </div>
        <Button onClick={openAdd}>
          <Icon name="add" />
          Thêm lịch
        </Button>
      </header>

      <section className="schedule-calendar" aria-label="Chọn ngày học">
        <div className="schedule-calendar-bar">
          <div className="schedule-week-caption">
            <strong>Tuần này</strong>
            <span>
              {shortDate(days[0].date)} – {shortDate(days[6].date)}
            </span>
          </div>
          <div className="schedule-calendar-controls">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDay(currentDay);
                setViewMode("daily");
              }}
            >
              <Icon name="calendar_today" />
              Hôm nay
            </Button>
            <Tabs
              tabs={viewTabs}
              value={viewMode}
              onChange={setViewMode}
              label="Chế độ xem lịch"
              variant="pill"
            />
          </div>
        </div>
        <div
          className="schedule-days"
          role="group"
          aria-label="Ngày trong tuần"
        >
          {days.map((day) => {
            const count = sessions.filter(
              (session) => session.dayOfWeek === day.day,
            ).length;
            return (
              <Button
                key={day.day}
                variant="ghost"
                aria-pressed={selectedDay === day.day && viewMode === "daily"}
                onClick={() => {
                  setSelectedDay(day.day);
                  setViewMode("daily");
                }}
                className="schedule-day"
                data-today={day.isToday}
              >
                <span className="sr-only">
                  {day.full}, ngày {shortDate(day.date)}.{" "}
                </span>
                <span className="schedule-day-name">{day.short}</span>
                <strong>{Number(day.date.slice(-2))}</strong>
                <span className="schedule-day-count">{count} buổi</span>
                <span className="schedule-today-marker">
                  {day.isToday && (
                    <>
                      <span className="schedule-today-full">Hôm nay</span>
                      <span className="schedule-today-short">Nay</span>
                    </>
                  )}
                </span>
              </Button>
            );
          })}
        </div>
      </section>

      {storageError && <Alert tone="warning">{storageError}</Alert>}
      {notice && (
        <div className="schedule-notice" role="status">
          <Icon name="check_circle" />
          <span>{notice}</span>
          {deleted && (
            <Button variant="ghost" size="sm" onClick={undoDelete}>
              Hoàn tác
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ẩn thông báo"
            onClick={() => {
              setNotice("");
              setDeleted(null);
            }}
          >
            <Icon name="close" />
          </Button>
        </div>
      )}

      <div className="schedule-layout" data-view={viewMode}>
        <section className="schedule-agenda" aria-label="Các buổi học">
          <div className="schedule-agenda-heading">
            <div>
              <h2>
                {viewMode === "daily"
                  ? `${selected.full}, ${shortDate(selected.date)}`
                  : "Một tuần nhìn thật rõ"}
              </h2>
              <p>
                {summary.count} buổi học
                {summary.count > 0 && (
                  <> · {durationLabel(summary.minutes)} đã lên lịch</>
                )}
              </p>
            </div>
            {viewMode === "daily" && selected.isToday && (
              <Badge tone="success">Hôm nay</Badge>
            )}
          </div>
          <Tabs
            tabs={filterTabs}
            value={filterType}
            onChange={setFilterType}
            label="Loại buổi học"
            className="schedule-filters"
          />
          {shown.length ? (
            viewMode === "daily" ? (
              <div className="schedule-timeline">
                {shown.map((session) => renderSession(session))}
              </div>
            ) : (
              <div className="schedule-week-grid">
                {days
                  .filter((day) =>
                    shown.some((session) => session.dayOfWeek === day.day),
                  )
                  .map((day) => {
                    const daySessions = shown.filter(
                      (session) => session.dayOfWeek === day.day,
                    );
                    return (
                      <section
                        className="schedule-week-day"
                        key={day.day}
                        aria-label={`Lịch ${day.full}`}
                      >
                        <Button
                          variant="ghost"
                          className="schedule-week-day-heading"
                          onClick={() => {
                            setSelectedDay(day.day);
                            setViewMode("daily");
                          }}
                        >
                          <span>
                            <strong>{day.full}</strong>
                            <small>
                              {shortDate(day.date)}
                              {day.isToday ? " · Hôm nay" : ""}
                            </small>
                          </span>
                          <span>
                            {daySessions.length} buổi
                            <Icon name="arrow_forward" />
                          </span>
                        </Button>
                        {daySessions.map((session) =>
                          renderSession(session, true),
                        )}
                      </section>
                    );
                  })}
              </div>
            )
          ) : (
            <div className="schedule-empty">
              <span>
                <Icon name="calendar_today" />
              </span>
              <h3>
                {filterType !== "all"
                  ? "Chưa có buổi học thuộc nhóm này"
                  : "Một khoảng trống cho kế hoạch của em"}
              </h3>
              <p>
                {filterType !== "all"
                  ? "Thử xem tất cả buổi học hoặc chọn một ngày khác nhé."
                  : "Thêm một buổi tự học nhỏ, hoặc dành thời gian để nghỉ ngơi."}
              </p>
              <Button
                variant="secondary"
                onClick={
                  filterType !== "all" ? () => setFilterType("all") : openAdd
                }
              >
                {filterType !== "all" ? "Xem tất cả" : "Thêm lịch"}
                <Icon name={filterType !== "all" ? "arrow_forward" : "add"} />
              </Button>
            </div>
          )}
          <p className="schedule-data-note">
            <Icon name="info" />
            <span>
              Lịch mẫu lặp lại hằng tuần. Lịch riêng được lưu trên thiết bị này.
            </span>
          </p>
        </section>

        <aside
          className="schedule-sidebar"
          aria-label="Chuẩn bị buổi học tiếp theo"
        >
          {upcoming ? (
            <>
              <section
                className="schedule-upnext"
                data-kind={upcoming.session.sessionType}
              >
                <div className="schedule-upnext-heading">
                  <span>
                    <Icon name={upcoming.isOngoing ? "play_arrow" : "alarm"} />
                    {upcoming.isOngoing
                      ? "Đang trong giờ học"
                      : "Buổi học gần nhất"}
                  </span>
                  <Icon name={upcoming.session.subjectIcon} />
                </div>
                <p className="schedule-upnext-date">
                  {upcoming.daysAway === 0
                    ? "Hôm nay"
                    : upcoming.daysAway === 1
                      ? "Ngày mai"
                      : DAYS_OF_WEEK.find(
                          (day) => day.day === upcoming.session.dayOfWeek,
                        )?.full}{" "}
                  · {shortDate(upcoming.date)}
                </p>
                <div className="schedule-upnext-time">
                  <strong>{upcoming.session.startTime}</strong>
                  <span>— {upcoming.session.endTime}</span>
                </div>
                <span className="schedule-upnext-kind">
                  {
                    sessionTypes.find(
                      (kind) => kind.id === upcoming.session.sessionType,
                    )?.label
                  }
                </span>
                <h2>{upcoming.session.title}</h2>
                <div className="schedule-upnext-meta">
                  {upcoming.session.instructor && (
                    <span>
                      <Icon name="person" />
                      {upcoming.session.instructor}
                    </span>
                  )}
                  {upcoming.session.location && (
                    <span>
                      <Icon name="room" />
                      {upcoming.session.location}
                    </span>
                  )}
                </div>
                <Button
                  className="ui-btn-on-brand"
                  onClick={() =>
                    onNavigate(sessionAction(upcoming.session).path)
                  }
                >
                  <Icon name={sessionAction(upcoming.session).icon} />
                  {sessionAction(upcoming.session).label}
                  <Icon name="arrow_forward" />
                </Button>
              </section>
              {upcoming.session.notes && (
                <section className="schedule-preparation">
                  <span className="schedule-preparation-icon">
                    <Icon name="edit_note" />
                  </span>
                  <div>
                    <h2>Chuẩn bị một chút</h2>
                    <p>{upcoming.session.notes}</p>
                  </div>
                </section>
              )}
            </>
          ) : (
            <section className="schedule-upnext schedule-upnext--empty">
              <Icon name="wb_sunny" />
              <h2>Lịch phía trước đang trống</h2>
              <p>Chọn một khoảng thời gian phù hợp để học điều em muốn.</p>
              <Button className="ui-btn-on-brand" onClick={openAdd}>
                <Icon name="add" />
                Thêm lịch
              </Button>
            </section>
          )}
          <section className="schedule-personal-plan">
            <Icon name="edit_square" />
            <h2>Một chút thời gian cho mình</h2>
            <p>Tự chọn môn, thời gian và điều muốn hiểu rõ hơn.</p>
            <Button variant="ghost" onClick={openAdd}>
              Lên lịch tự học
              <Icon name="arrow_forward" />
            </Button>
          </section>
        </aside>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Chỉnh sửa lịch học" : "Thêm lịch học"}
        description="Chọn một khoảng thời gian vừa sức. Lịch này sẽ lặp lại mỗi tuần."
        className="schedule-editor-dialog"
      >
        <form
          ref={formRef}
          onSubmit={saveSession}
          className="schedule-editor"
          noValidate
        >
          <Field label="Tên buổi học" error={errors.title}>
            <Input
              autoFocus
              value={draft.title}
              maxLength={180}
              onChange={(event) => changeDraft("title", event.target.value)}
              placeholder="Em muốn học điều gì?"
              required
            />
          </Field>
          <div className="schedule-form-grid">
            <Field label="Môn học" error={errors.subjectName}>
              <Select
                value={draft.subjectName}
                onChange={(event) =>
                  changeDraft("subjectName", event.target.value)
                }
              >
                {subjectOptions.map(([name]) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Loại buổi học" error={errors.sessionType}>
              <Select
                value={draft.sessionType}
                onChange={(event) =>
                  changeDraft("sessionType", event.target.value as SessionType)
                }
              >
                {sessionTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="schedule-form-time">
            <Field label="Thứ trong tuần" error={errors.dayOfWeek}>
              <Select
                value={draft.dayOfWeek}
                onChange={(event) =>
                  changeDraft("dayOfWeek", Number(event.target.value))
                }
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.day} value={day.day}>
                    {day.full}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Bắt đầu" error={errors.startTime}>
              <Input
                type="time"
                value={draft.startTime}
                onChange={(event) =>
                  changeDraft("startTime", event.target.value)
                }
                required
              />
            </Field>
            <Field label="Kết thúc" error={errors.endTime}>
              <Input
                type="time"
                value={draft.endTime}
                onChange={(event) => changeDraft("endTime", event.target.value)}
                required
              />
            </Field>
          </div>
          <div className="schedule-form-grid">
            <Field label="Người hướng dẫn" hint="Không bắt buộc">
              <Input
                value={draft.instructor ?? ""}
                maxLength={100}
                onChange={(event) =>
                  changeDraft("instructor", event.target.value)
                }
                placeholder="Tên giáo viên hoặc tutor"
              />
            </Field>
            <Field label="Địa điểm" hint="Không bắt buộc">
              <Input
                value={draft.location ?? ""}
                maxLength={160}
                onChange={(event) =>
                  changeDraft("location", event.target.value)
                }
                placeholder="Ở nhà, phòng học…"
              />
            </Field>
          </div>
          <Field
            label="Ghi chú"
            hint="Điều cần chuẩn bị hoặc mục tiêu nhỏ cho buổi học."
          >
            <Textarea
              value={draft.notes ?? ""}
              maxLength={600}
              onChange={(event) => changeDraft("notes", event.target.value)}
              rows={3}
              placeholder="Ví dụ: chuẩn bị vở nháp và câu hỏi muốn giải đáp."
            />
          </Field>
          <div className="schedule-editor-footer">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">
              <Icon name="calendar_add_on" />
              Lưu lịch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
