import { useId, useState } from "react";
import { Button, Icon, Input } from "../../components/ui";
import type { Lesson } from "../../types/content";
import { parabolaPoints, selectDiscovery } from "../../features/learning/lessonDiscovery";

export function V2MiniLab({
  lesson,
  onOpen,
}: {
  lesson: Lesson;
  onOpen: () => void;
}) {
  const discovery = selectDiscovery(lesson);
  const available = discovery?.model?.kind === "parabola" ? discovery.model.coefficients : [];
  const [index, setIndex] = useState(
    Math.max(0, available.indexOf(1)),
  );
  const value = available[Math.min(index, available.length - 1)] ?? 1;
  const curve = parabolaPoints(value).map((point) => `${point.screenX},${point.screenY}`).join(" ");
  const baseline = parabolaPoints(1).map((point) => `${point.screenX},${point.screenY}`).join(" ");
  const id = useId().replaceAll(":", "");

  if (!available.length) return (
    <section className="v2-panel v2-mini-lab" aria-label="Góc khám phá">
      <header className="v2-panel-head"><h2><Icon name="science" /> Phòng khám phá</h2></header>
      <p>Chưa có mô hình tương tác phù hợp với bài học đã xuất bản.</p>
      <Button onClick={onOpen}>Xem bài học <Icon name="arrow_forward" /></Button>
    </section>
  );

  return (
    <section className="v2-panel v2-mini-lab" aria-label="Phòng khám phá Toán học">
      <header className="v2-panel-head">
        <h2><Icon name="science" /> Phòng khám phá</h2>
        <span className="v2-panel-tag">Toán lớp {lesson.gradeId}</span>
      </header>
      <h3>Điều gì làm parabol đổi hướng?</h3>
      <p className="v2-muted">
        Thử thay đổi hệ số <strong>a</strong> và quan sát đồ thị của y = ax².
      </p>
      <div className="v2-mini-graph">
        <svg
          viewBox="0 0 320 220"
          role="img"
          aria-label={`Đồ thị hàm số y = ${value}x², hướng mở ${value > 0 ? "lên" : "xuống"}`}
        >
          <defs>
            <pattern id={`${id}-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" stroke="var(--v2-border)" strokeWidth="0.8" />
            </pattern>
            <clipPath id={`${id}-clip`}><rect width="320" height="220" /></clipPath>
          </defs>
          <rect width="320" height="220" fill={`url(#${id}-grid)`} />
          <path d="M0 114H320M160 0V220" stroke="var(--color-sky-400)" strokeWidth="1.5" />
          <g clipPath={`url(#${id}-clip)`}>
            <polyline points={baseline} fill="none" stroke="var(--color-ice)" strokeWidth="2" strokeDasharray="5 6" opacity=".4" />
            <polyline points={curve} fill="none" stroke="var(--color-cyan)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <circle cx="160" cy="114" r="5" fill="var(--color-accent-soft)" />
          <text x="12" y="24" fill="var(--color-white)" fontSize="15" fontWeight="650">y = {value}x²</text>
          <text x="300" y="107" fill="var(--color-ice)" fontSize="12">x</text>
          <text x="170" y="15" fill="var(--color-ice)" fontSize="12">y</text>
        </svg>
        <div className="v2-mini-lab-control">
          <label htmlFor={id + "-coefficient"}>Hệ số a <strong>{value}</strong></label>
          <Input
            id={id + "-coefficient"}
            type="range"
            min={0}
            max={available.length - 1}
            step={1}
            value={index}
            aria-valuetext={`Hệ số a = ${value}`}
            onChange={(event) => setIndex(Number(event.target.value))}
          />
          <div className="v2-lab-scale"><span>{available[0]}</span><span>{available.at(-1)}</span></div>
        </div>
      </div>
      <p className="v2-lab-observation" role="status">
        <Icon name="lightbulb" /> Với a {value > 0 ? "dương, parabol mở lên" : "âm, parabol mở xuống"}. Đỉnh vẫn ở gốc tọa độ.
      </p>
      <Button className="v2-lab-cta" onClick={onOpen}>
        Khám phá bài học <Icon name="arrow_forward" />
      </Button>
      <small className="v2-lab-source">Mô hình từ bài đã xuất bản. Thao tác không tự cộng điểm.</small>
    </section>
  );
}
