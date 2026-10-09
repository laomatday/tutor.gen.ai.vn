import { useState } from "react";
import { Button, Icon, Modal, Progress } from "../../components/ui";
import { StudentAvatar } from "../../components/student/StudentAvatar";
import { useCurriculum } from "../../context/CurriculumContext";
import { getCourseProgress, studentProfile } from "../../features/curriculum";
import { initialBadges } from "../../features/gamification/badges";
import "./support-ui.css";

interface Props {
  open: boolean;
  onClose: () => void;
  gpBalance: number;
}

type BadgeFilter = "all" | "unlocked" | "locked";

export function V2ProfileModal({ open, onClose, gpBalance }: Props) {
  const { lessons, topics, subjects, completedLessonIds } = useCurriculum();
  const [filter, setFilter] = useState<BadgeFilter>("all");
  const progress = getCourseProgress(lessons, topics, completedLessonIds);
  const enrolledSubjects = studentProfile.enrollments.map((enrollment) => {
    const subject = subjects.find((item) => item.id === enrollment.subjectId);
    return subject ? `${subject.name} · Lớp ${enrollment.gradeId}` : `Lớp ${enrollment.gradeId}`;
  });
  const badges = initialBadges.filter((badge) =>
    filter === "all" || (filter === "unlocked" ? badge.unlocked : !badge.unlocked),
  );
  const demoUnlocked = initialBadges.filter((badge) => badge.unlocked).length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hồ sơ học tập"
      description="Thông tin lớp/môn và huy hiệu minh họa; tiến độ cùng GP được lấy từ trình duyệt này."
      className="v2-profile-dialog"
    >
      <div className="v2-profile-overview">
        <StudentAvatar
          name={studentProfile.name}
          src={studentProfile.avatarUrl}
          className="v2-profile-avatar"
        />
        <div>
          <span className="v2-support-eyebrow">Hồ sơ học sinh minh họa</span>
          <h3>{studentProfile.name}</h3>
          <p>Lớp {studentProfile.className}</p>
          <p>{enrolledSubjects.join(" · ") || "Chưa có môn được đăng ký"}</p>
        </div>
      </div>

      <div className="v2-profile-metrics">
        <div><span>Điểm trên thiết bị</span><strong>{gpBalance} GP</strong></div>
        <div><span>Bài đã hoàn thành</span><strong>{progress.completed}/{progress.total}</strong></div>
        <div><span>Huy hiệu mẫu đã mở</span><strong>{demoUnlocked}/{initialBadges.length}</strong></div>
      </div>
      <div className="v2-profile-progress">
        <label>Tiến độ bài học trong môn đang đăng ký</label>
        <Progress label="Tiến độ bài học của hồ sơ" value={progress.completed} max={progress.total} tone="accent" />
      </div>

      <section className="v2-profile-badges" aria-labelledby="v2-badges-title">
        <div className="v2-support-panel-heading">
          <div>
            <span className="v2-support-eyebrow">Chỉ để minh họa giao diện</span>
            <h3 id="v2-badges-title">Bộ sưu tập huy hiệu mẫu</h3>
          </div>
          <div className="v2-support-filters" role="group" aria-label="Lọc huy hiệu mẫu">
            <Button variant="ghost" size="sm" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Tất cả</Button>
            <Button variant="ghost" size="sm" aria-pressed={filter === "unlocked"} onClick={() => setFilter("unlocked")}>Đã mở</Button>
            <Button variant="ghost" size="sm" aria-pressed={filter === "locked"} onClick={() => setFilter("locked")}>Chưa mở</Button>
          </div>
        </div>
        <ul className="v2-profile-badge-list">
          {badges.map((badge) => (
            <li key={badge.id} data-unlocked={badge.unlocked}>
              <span className="v2-profile-badge-icon"><Icon name={badge.unlocked ? badge.icon : "lock"} /></span>
              <div>
                <strong>{badge.title}</strong>
                <p>{badge.description}</p>
                <small>{badge.unlocked ? "Đã mở trong dữ liệu mẫu" : "Chưa mở trong dữ liệu mẫu"}</small>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <p className="v2-support-integrity"><Icon name="info" /> Không có tài khoản học sinh thật, đồng bộ đa thiết bị, thành tích xếp hạng hoặc chứng nhận mức độ thành thạo trong hồ sơ mẫu này.</p>
    </Modal>
  );
}
