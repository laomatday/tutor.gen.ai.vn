import { useId, useState } from "react";
import { Button, Icon, Input } from "../../components/ui";
import type { Lesson } from "../../types/content";
import { selectDiscovery } from "../../features/learning/lessonDiscovery";
import {
  formatQuadratic,
  quadraticPlot,
  type QuadraticCoefficients,
} from "../../features/microLabs/domain";

const choices = [-3, -2, -1, 1, 2, 3] as const;
const experiments = [
  { title: "Hướng mở", coefficient: { a: 1, b: 0, c: 0 }, description: "Đổi dấu hệ số a để quan sát chiều mở." },
  { title: "Trục đối xứng", coefficient: { a: 1, b: -2, c: 0 }, description: "Điều chỉnh b và quan sát trục đối xứng." },
  { title: "Tịnh tiến", coefficient: { a: 1, b: 0, c: -1 }, description: "Thay đổi c để quan sát vị trí đồ thị." },
] as const;

/** Published lesson guard; exploration is deterministic and never records GP. */
export function V2MiniLab({ lesson, onOpen }: { lesson: Lesson; onOpen: () => void }) {
  const selected = selectDiscovery(lesson);
  const valid = selected?.model?.kind === "parabola";
  const id = useId().replaceAll(":", "");
  const [stage, setStage] = useState(0);
  const [coefficients, setCoefficients] = useState<QuadraticCoefficients>({ ...experiments[0].coefficient });
  const [touched, setTouched] = useState(false);
  if (!valid) {
    return (
      <section className="v2-panel v2-mini-lab" aria-label="Phòng khám phá">
        <header className="v2-panel-head"><h2><Icon name="science" /> Phòng khám phá</h2></header>
        <p>Chưa có mô hình đã duyệt cho bài học này.</p>
        <Button onClick={onOpen}>Xem bài học <Icon name="arrow_forward" /></Button>
      </section>
    );
  }

  const points = quadraticPlot(coefficients);
  const original = quadraticPlot({ a: 1, b: 0, c: 0 });
  const polyline = (values: ReturnType<typeof quadraticPlot>) =>
    values.map((point) => `${point.screenX.toFixed(2)},${point.screenY.toFixed(2)}`).join(" ");
  const vertexX = -coefficients.b / (2 * coefficients.a);
  const vertexY = coefficients.a * vertexX ** 2 + coefficients.b * vertexX + coefficients.c;
  const vertexPX = 26 + (vertexX + 4) / 8 * 428;
  const vertexPY = 138 - vertexY / 12 * 120;

  function chooseStage(index: number) {
    setStage(index);
    setCoefficients({ ...experiments[index].coefficient });
    setTouched(false);
  }

  function change(key: keyof QuadraticCoefficients, next: number) {
    setCoefficients((current) => ({ ...current, [key]: next }));
    setTouched(true);
  }

  return (
    <section className="v2-panel v2-mini-lab" data-mission-lab aria-label="Phòng khám phá Toán 9">
      <header className="v2-panel-head">
        <h2><Icon name="science" /> Phòng thí nghiệm</h2>
        <Button variant="ghost" onClick={onOpen} className="v2-lab-quick">
          Thử ngay <Icon name="arrow_forward" />
        </Button>
      </header>
      <h3>Khám phá parabol theo cách mới</h3>
      <p className="v2-muted">Tương tác với đồ thị để hiểu rõ hơn ảnh hưởng của các hệ số.</p>

      <div className="v2-lab-workspace">
        <div className="v2-mini-graph">
          <div className="v2-lab-equation" aria-live="polite">{formatQuadratic(coefficients)}</div>
          <svg
            viewBox="0 0 480 276"
            role="img"
            aria-label={`Đồ thị hàm số ${formatQuadratic(coefficients)}; đỉnh (${vertexX.toFixed(1)}; ${vertexY.toFixed(1)})`}
          >
            <defs>
              <pattern id={`${id}-grid`} width="26.75" height="20" patternUnits="userSpaceOnUse">
                <path d="M26.75 0H0V20" fill="none" stroke="var(--v2-border)" strokeWidth="0.75" />
              </pattern>
              <clipPath id={`${id}-clip`}>
                <rect x="26" y="18" width="428" height="240" />
              </clipPath>
            </defs>
            <rect x="26" y="18" width="428" height="240" rx="10" fill={`url(#${id}-grid)`} />
            <path d="M26 138H454M240 18V258" stroke="var(--color-sky-300)" strokeWidth="1.25" opacity=".78" />
            <g clipPath={`url(#${id}-clip)`}>
              <polyline points={polyline(original)} stroke="var(--color-ice)" strokeWidth="2" opacity=".2" fill="none" strokeDasharray="6 5" />
              <polyline points={polyline(points)} stroke="var(--color-cyan)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {Math.abs(vertexX) <= 4 && Math.abs(vertexY) <= 12 && (
                <circle cx={vertexPX} cy={vertexPY} r="6" fill="var(--color-white)" stroke="var(--color-brand)" strokeWidth="3" />
              )}
            </g>
            <text x="460" y="134" className="v2-lab-axis-label">x</text>
            <text x="247" y="15" className="v2-lab-axis-label">y</text>
          </svg>
          <div className="v2-lab-graph-tooltip">
            <Icon name="touch_app" /> Kéo thanh trượt để thay đổi đồ thị!
          </div>
        </div>
        <div className="v2-lab-controls" aria-label="Thay đổi hệ số của parabol">
          <label>
            <span>Hệ số a <strong>{coefficients.a}</strong></span>
            <Input
              type="range"
              aria-label="Hệ số a"
              min={0}
              max={choices.length - 1}
              step={1}
              value={choices.indexOf(coefficients.a as typeof choices[number])}
              aria-valuetext={`Hệ số a = ${coefficients.a}`}
              onChange={(event) => change("a", choices[Number(event.target.value)])}
            />
          </label>
          <label>
            <span>Hệ số b <strong>{coefficients.b}</strong></span>
            <Input
              type="range"
              aria-label="Hệ số b"
              min={-4}
              max={4}
              step={1}
              value={coefficients.b}
              onChange={(event) => change("b", Number(event.target.value))}
            />
          </label>
          <label>
            <span>Hệ số c <strong>{coefficients.c}</strong></span>
            <Input
              type="range"
              aria-label="Hệ số c"
              min={-4}
              max={4}
              step={1}
              value={coefficients.c}
              onChange={(event) => change("c", Number(event.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="v2-lab-bottom">
        <div className="v2-lab-stages" role="group" aria-label="Chọn khám phá hệ số">
          {experiments.map((item, index) => (
            <Button
              key={item.title}
              variant="ghost"
              size="icon"
              aria-label={`Thử nghiệm ${index + 1}: ${item.title}`}
              aria-pressed={stage === index}
              onClick={() => chooseStage(index)}
            >
              <span />
            </Button>
          ))}
        </div>
        <p className="v2-lab-observation" role="status">
          {touched
            ? `Với a ${coefficients.a > 0 ? "dương" : "âm"}, parabol mở ${coefficients.a > 0 ? "lên" : "xuống"}; đỉnh thay đổi khi b hoặc c đổi.`
            : experiments[stage].description}
        </p>
      </div>
      <small className="v2-lab-source">
        Mở rộng tương tác của bài Toán 9 đã xuất bản. Hệ số b, c là kiến thức khám phá thêm; không cộng GP hoặc đánh dấu hoàn thành bài.
      </small>
    </section>
  );
}
