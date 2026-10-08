import React, { useState, useEffect } from "react";
import { Button, Icon, Modal, Input, Select } from "../../components/ui";
import { StudentPageHeader, StudentSignalStrip } from "../../components/student/StudentExperience";
import {
  DAYS_OF_WEEK,
  initialScheduleSessions,
  type ScheduleSession,
  type SessionType,
} from "./types";
import { browserStorage } from "../../lib/browserStorage";
import { storageKeys } from "../../config/storage";
import { studentProfile } from "../learning/data/student";
import { courseHref } from "../curriculum";

interface TimetableScheduleViewProps {
  onNavigate: (tab: string) => void;
}

export const TimetableScheduleView: React.FC<TimetableScheduleViewProps> = ({
  onNavigate,
}) => {
  // Determine current day of week (in JS: 0 is Sun, 1 is Mon... in VN: 2 is Mon, 8 is Sun)
  const todayJs = new Date().getDay();
  const currentVnDay = todayJs === 0 ? 8 : todayJs + 1;

  const [selectedDay, setSelectedDay] = useState<number>(currentVnDay);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [filterType, setFilterType] = useState<SessionType | "all">("all");

  const [sessions, setSessions] = useState<ScheduleSession[]>(() => {
    try {
      const stored = browserStorage.read(storageKeys.studentSchedule);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return initialScheduleSessions;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Toán học");
  const [newDay, setNewDay] = useState(selectedDay);
  const [newStartTime, setNewStartTime] = useState("19:30");
  const [newEndTime, setNewEndTime] = useState("20:30");
  const [newSessionType, setNewSessionType] = useState<SessionType>("tutor");
  const [newLocation, setNewLocation] = useState(
    "Phòng học trực tuyến Live Tutor",
  );
  const [newInstructor, setNewInstructor] = useState("Tutor Đồng Hành");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    try {
      browserStorage.write(
        storageKeys.studentSchedule,
        JSON.stringify(sessions),
      );
    } catch {
      // ignore
    }
  }, [sessions]);

  const filteredSessions = sessions.filter((s) => {
    const matchesDay =
      viewMode === "weekly" ? true : s.dayOfWeek === selectedDay;
    const matchesType =
      filterType === "all" ? true : s.sessionType === filterType;
    return matchesDay && matchesType;
  });

  // Sort by start time
  const sortedSessions = [...filteredSessions].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );

  // Next upcoming session
  const upcomingTutorSessions = sessions.filter(
    (s) => s.sessionType === "tutor" && s.status !== "completed",
  );
  const nextSession =
    sessions.find(
      (s) => s.dayOfWeek === selectedDay && s.status === "upcoming",
    ) ??
    upcomingTutorSessions[0] ??
    sessions[0];

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const iconMap: Record<string, string> = {
      "Toán học": "functions",
      "Tiếng Anh": "translate",
      "Ngữ văn": "menu_book",
      "Vật lý": "bolt",
      "Hóa học": "science",
      "Sinh học": "biotech",
      "Tutor Đồng Hành": "support_agent",
      "Tự học thông minh": "psychology",
    };

    const newSessionItem: ScheduleSession = {
      id: `session-${Date.now()}`,
      dayOfWeek: Number(newDay),
      title: newTitle.trim(),
      subjectName: newSubject,
      subjectIcon: iconMap[newSubject] || "school",
      startTime: newStartTime,
      endTime: newEndTime,
      sessionType: newSessionType,
      location: newLocation.trim() || "Phòng học",
      instructor: newInstructor.trim() || "Giáo viên / Tutor",
      notes: newNotes.trim(),
      status: "upcoming",
    };

    setSessions((prev) => [...prev, newSessionItem]);
    setNewTitle("");
    setNewNotes("");
    setIsAddModalOpen(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const sessionTypeBadges: Record<
    SessionType,
    { label: string; className: string }
  > = {
    "chinh-khoa": {
      label: "Lớp chính khóa",
      className: "bg-primary/10 text-primary",
    },
    tutor: { label: "Buổi Tutor", className: "bg-secondary/20 text-primary" },
    "tu-hoc": { label: "Tự học", className: "bg-secondary/15 text-primary" },
    "thi-thu": {
      label: "Thi thử",
      className: "bg-surface-container text-on-surface-variant",
    },
  };

  return (
    <div className="learning-os-page">
      <StudentPageHeader
        eyebrow="Learning rhythm"
        icon="calendar_month"
        title={`Nhịp học tuần này của lớp ${studentProfile.className}`}
        description="Thời khóa biểu minh họa được lưu trên thiết bị; lịch học thật cần được cập nhật theo trường và giáo viên."
        meta={
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/8 px-3 py-1.5 text-xs font-semibold text-accent-strong">
            <Icon name="auto_awesome" />
            Phiên học gần nhất
          </span>
        }
        actions={
          <>
            <div className="ui-segmented" role="group" aria-label="Chế độ xem lịch">
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={viewMode === "daily"}
                onClick={() => setViewMode("daily")}
                className="ui-segment"
              >
                Theo ngày
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={viewMode === "weekly"}
                onClick={() => setViewMode("weekly")}
                className="ui-segment"
              >
                Cả tuần
              </Button>
            </div>
            <Button
              onClick={() => {
                setNewDay(selectedDay);
                setIsAddModalOpen(true);
              }}
            >
              <Icon name="add" />
              Thêm lịch
            </Button>
          </>
        }
      />

      <StudentSignalStrip
        items={[
          { icon: "schedule", label: "Phiên hôm nay", value: `${sessions.filter((s) => s.dayOfWeek === currentVnDay).length} phiên` },
          { icon: "psychology", label: "Buổi Tutor", value: `${sessions.filter((s) => s.sessionType === "tutor").length} phiên` },
          { icon: "target", label: "Đang xem", value: viewMode === "daily" ? DAYS_OF_WEEK.find((d) => d.day === selectedDay)?.full ?? "Hôm nay" : "Cả tuần" },
          { icon: "auto_awesome", label: "Next up", value: nextSession ? `${nextSession.startTime} · ${nextSession.subjectName}` : "Chưa có lịch" },
        ]}
      />

      {/* Next Upcoming Highlight Banner */}
      {nextSession && (
        <section className="signal-card signal-card--accent overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-0.5 text-xs font-bold text-white shadow-xs">
                  <Icon name="alarm" className="text-sm" />
                  {nextSession.sessionType === "tutor"
                    ? "BUỔI CỐ VẤN TUTOR"
                    : "BUỔI HỌC SẮP TỚI"}
                </span>
                <span className="text-xs font-semibold text-primary">
                  {
                    DAYS_OF_WEEK.find((d) => d.day === nextSession.dayOfWeek)
                      ?.full
                  }{" "}
                  · {nextSession.startTime} – {nextSession.endTime}
                </span>
              </div>
              <h2 className="text-xl font-bold text-primary sm:text-2xl">
                {nextSession.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-1">
                  <Icon name="person" className="text-base text-secondary" />
                  {nextSession.instructor}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="room" className="text-base text-secondary" />
                  {nextSession.location}
                </span>
                {nextSession.notes && (
                  <span className="inline-flex items-center gap-1 text-secondary font-medium">
                    <Icon name="info" className="text-base" />
                    {nextSession.notes}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {nextSession.sessionType === "tutor" ? (
                <Button
                  variant="primary"
                  onClick={() => onNavigate(courseHref("9", "toan"))}
                  className="rounded-full font-bold text-xs"
                >
                  <Icon name="videocam" className="text-lg" />
                  Vào phòng học trực tuyến
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => onNavigate(courseHref("9", "toan"))}
                  className="rounded-full font-bold text-xs"
                >
                  <Icon name="play_lesson" className="text-lg" />
                  Vào ôn bài học
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Day Selector (if in daily mode) */}
      {viewMode === "daily" && (
        <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-1">
          {DAYS_OF_WEEK.map((d) => {
            const isToday = d.day === currentVnDay;
            const isSelected = d.day === selectedDay;
            const daySessionCount = sessions.filter(
              (s) => s.dayOfWeek === d.day,
            ).length;

            return (
              <Button
                key={d.day}
                variant="surface"
                onClick={() => setSelectedDay(d.day)}
                className={`group relative flex flex-col items-center rounded-2xl border p-3 text-center transition-all h-auto ${
                  isSelected
                    ? "border-primary bg-primary text-white shadow-md ring-2 ring-primary/20"
                    : "border-outline-variant/70 bg-white hover:border-secondary/50 hover:bg-secondary/5 text-on-surface"
                }`}
              >
                {isToday && (
                  <span
                    className={`absolute -top-2 rounded-full px-2 py-0.5 text-xs font-extrabold uppercase ${
                      isSelected
                        ? "bg-secondary text-white"
                        : "bg-secondary text-white"
                    }`}
                  >
                    Hôm nay
                  </span>
                )}
                <span className="text-xs font-semibold">
                  {d.short}
                </span>
                <span className="mt-1 text-sm sm:text-base font-bold">
                  {d.label}
                </span>
                <span
                  className={`mt-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-surface-container text-on-surface-variant group-hover:bg-secondary/15 group-hover:text-secondary"
                  }`}
                >
                  {daySessionCount} tiết
                </span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Filter Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={filterType === "all" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterType("all")}
            className="rounded-full text-xs"
          >
            Tất cả ({filteredSessions.length})
          </Button>
          <Button
            variant={filterType === "tutor" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterType("tutor")}
            className="rounded-full text-xs"
          >
            <Icon name="support_agent" className="text-sm" />
            Buổi Tutor
          </Button>
          <Button
            variant={filterType === "chinh-khoa" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterType("chinh-khoa")}
            className="rounded-full text-xs"
          >
            <Icon name="school" className="text-sm" />
            Chính khóa
          </Button>
          <Button
            variant={filterType === "tu-hoc" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterType("tu-hoc")}
            className="rounded-full text-xs"
          >
            <Icon name="psychology" className="text-sm" />
            Tự học
          </Button>
          <Button
            variant={filterType === "thi-thu" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterType("thi-thu")}
            className="rounded-full text-xs"
          >
            <Icon name="quiz" className="text-sm" />
            Thi thử
          </Button>
        </div>

        <p className="text-xs text-on-surface-variant">
          {viewMode === "daily"
            ? `${DAYS_OF_WEEK.find((d) => d.day === selectedDay)?.full} · ${sortedSessions.length} phiên học`
            : `Toàn bộ tuần · ${sortedSessions.length} phiên học`}
        </p>
      </div>

      {/* Schedule Items Grid / Cards */}
      {viewMode === "daily" ? (
        <div className="space-y-3.5">
          {sortedSessions.map((session) => {
            const badgeMeta = sessionTypeBadges[session.sessionType];
            const isTutor = session.sessionType === "tutor";

            return (
              <div
                key={session.id}
                className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border p-5 transition-all ${
                  isTutor
                    ? "border-secondary/40 bg-secondary/5 hover:border-secondary shadow-xs"
                    : session.status === "completed"
                      ? "border-outline-variant/50 bg-surface-container-low/60 opacity-80"
                      : "border-outline-variant/80 bg-white hover:border-primary/40 hover:shadow-xs"
                }`}
              >
                {/* Left: Time & Icon & Details */}
                <div className="flex items-start gap-4">
                  {/* Time box */}
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-outline-variant/60 px-3.5 py-2.5 text-center shadow-2xs shrink-0 w-20">
                    <span className="text-sm font-extrabold text-primary">
                      {session.startTime}
                    </span>
                    <span className="text-xs text-outline">
                      {session.endTime}
                    </span>
                  </div>

                  {/* Icon */}
                  <span
                    className={`hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      isTutor
                        ? "bg-secondary text-white shadow-xs"
                        : "bg-surface-container text-primary"
                    }`}
                  >
                    <Icon name={session.subjectIcon} className="text-2xl" />
                  </span>

                  {/* Content */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-secondary">
                        {session.subjectName}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeMeta.className}`}
                      >
                        {badgeMeta.label}
                      </span>
                      {session.status === "completed" && (
                        <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                          Đã hoàn thành
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-primary group-hover:text-secondary transition-colors">
                      {session.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                      <span className="inline-flex items-center gap-1">
                        <Icon
                          name="person"
                          className="text-sm text-secondary"
                        />
                        {session.instructor}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon
                          name="meeting_room"
                          className="text-sm text-outline"
                        />
                        {session.location}
                      </span>
                    </div>

                    {session.notes && (
                      <p className="mt-1 text-xs text-on-surface-variant/90 italic bg-white/70 p-1.5 px-2.5 rounded-lg border border-outline-variant/40">
                        {session.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {session.id.startsWith("session-") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Xóa lịch học"
                      onClick={(e) => deleteSession(session.id, e)}
                      className="text-outline hover:text-secondary h-8 w-8"
                    >
                      <Icon name="delete_outline" className="text-base" />
                    </Button>
                  )}

                  {session.sessionType === "tutor" ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onNavigate(courseHref("9", "toan"))}
                      className="rounded-full font-bold shadow-xs text-xs"
                    >
                      <Icon name="videocam" className="text-sm" />
                      Vào phòng học
                    </Button>
                  ) : session.sessionType === "tu-hoc" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate("/tu-giai")}
                      className="rounded-full text-xs font-semibold"
                    >
                      Tự giải ngay
                      <Icon name="arrow_forward" className="text-xs" />
                    </Button>
                  ) : session.sessionType === "thi-thu" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate("/thi-thu")}
                      className="rounded-full text-xs font-semibold"
                    >
                      Vào thi thử
                      <Icon name="arrow_forward" className="text-xs" />
                    </Button>
                  ) : (
                    <Button
                      variant="surface"
                      size="sm"
                      onClick={() => onNavigate(courseHref("9", "toan"))}
                      className="rounded-full border border-outline-variant text-xs font-semibold hover:bg-surface-container-low"
                    >
                      Xem bài học
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {sortedSessions.length === 0 && (
            <div className="rounded-3xl border border-dashed border-outline-variant p-8 text-center bg-white">
              <Icon name="event_busy" className="text-4xl text-outline mb-2" />
              <h3 className="text-base font-bold text-primary">
                Chưa có lịch học cho ngày này
              </h3>
              <p className="mt-1 text-xs text-on-surface-variant">
                Bạn có thể thêm lịch học cá nhân hoặc phiên cố vấn cùng Tutor.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setNewDay(selectedDay);
                  setIsAddModalOpen(true);
                }}
                className="mt-4 rounded-full text-xs"
              >
                <Icon name="add" className="text-base" />
                Thêm lịch học
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Weekly Full Grid Overview */
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DAYS_OF_WEEK.map((d) => {
            const daySessions = sessions
              .filter((s) => s.dayOfWeek === d.day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const isToday = d.day === currentVnDay;

            return (
              <div
                key={d.day}
                className={`rounded-3xl border p-4.5 bg-white transition-all ${
                  isToday
                    ? "border-secondary/50 ring-2 ring-secondary/20 shadow-xs"
                    : "border-outline-variant/70"
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/50">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                        isToday
                          ? "bg-secondary text-white"
                          : "bg-surface-container text-primary"
                      }`}
                    >
                      {d.short}
                    </span>
                    <h3 className="text-sm font-bold text-primary">{d.full}</h3>
                  </div>
                  <span className="text-xs text-outline font-medium">
                    {daySessions.length} tiết
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {daySessions.map((s) => (
                    <div
                      key={s.id}
                      className={`rounded-xl p-2.5 text-xs transition-colors border ${
                        s.sessionType === "tutor"
                          ? "bg-secondary/10 border-secondary/30 text-secondary"
                          : "bg-surface-container-low/60 border-outline-variant/40 text-on-surface"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="truncate pr-1">{s.title}</span>
                        <span className="shrink-0 text-xs opacity-80">
                          {s.startTime}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-on-surface-variant">
                        <span>{s.instructor}</span>
                        <span>{s.location}</span>
                      </div>
                    </div>
                  ))}
                  {daySessions.length === 0 && (
                    <p className="py-4 text-center text-xs text-outline italic">
                      Không có lịch học
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Schedule Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm lịch học / Phiên học mới"
        description="Thêm buổi học chính khóa, phiên cố vấn Tutor hoặc ca tự học vào thời khóa biểu"
      >
        <form onSubmit={handleAddSession} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Tiêu đề buổi học
            </label>
            <Input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="VD: Toán 9: Luyện tập rút gọn căn thức..."
              required
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Môn học
              </label>
              <Select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              >
                <option value="Toán học">Toán học</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Ngữ văn">Ngữ văn</option>
                <option value="Vật lý">Vật lý</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Sinh học">Sinh học</option>
                <option value="Tutor Đồng Hành">Tutor Đồng Hành</option>
                <option value="Tự học thông minh">Tự học thông minh</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Thứ trong tuần
              </label>
              <Select
                value={newDay}
                onChange={(e) => setNewDay(Number(e.target.value))}
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.day} value={d.day}>
                    {d.full}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Loại hình
              </label>
              <Select
                value={newSessionType}
                onChange={(e) =>
                  setNewSessionType(e.target.value as SessionType)
                }
              >
                <option value="tutor">Buổi Tutor</option>
                <option value="chinh-khoa">Chính khóa</option>
                <option value="tu-hoc">Tự học</option>
                <option value="thi-thu">Thi thử</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Giờ bắt đầu
              </label>
              <Input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Giờ kết thúc
              </label>
              <Input
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Giáo viên / Tutor
              </label>
              <Input
                type="text"
                value={newInstructor}
                onChange={(e) => setNewInstructor(e.target.value)}
                placeholder="VD: Tutor Mai Anh..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Phòng học / Địa điểm
              </label>
              <Input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="VD: Phòng 9A2 / Trực tuyến..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Ghi chú chuẩn bị
            </label>
            <Input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="VD: Đọc trước bài 3, chuẩn bị câu hỏi thắc mắc..."
              className="w-full"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              <Icon name="calendar_add_on" className="text-base" />
              Lưu vào thời khóa biểu
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
