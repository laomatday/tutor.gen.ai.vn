import { useId, useMemo, useState } from "react";
import { Button, Icon, Input } from "../../components/ui";
import type { Lesson } from "../../types/content";
import { selectDiscovery } from "../../features/learning/lessonDiscovery";

const steps = [-3, -2, -1, 1, 2, 3] as const;

function formula(a: number, b: number, c: number) {
  const termA = a === 1 ? "x²" : a === -1 ? "−x²" : `${a}x²`;
  const part = (value: number, suffix: string) => value
    ? ` ${value < 0 ? "−" : "+"} ${Math.abs(value) === 1 && suffix ? "" : Math.abs(value)}${suffix}`
    : "";
  return `y = ${termA}${part(b, "x")}${part(c, "")}`;
}

function curve(a: number, b: number, c: number) {
  return Array.from({ length: 161 }, (_, index) => {
    const x = -4 + index * .05;
    const y = a * x * x + b * x + c;
    return `${(160 + x * 36).toFixed(2)},${(100 - y * 10).toFixed(2)}`;
  }).join(" ");
}

/**
 * A genuine interactive preview bound to an authored, published parabola
 * lesson. Coefficients b/c are labelled as additional exploration rather
 * than being passed off as required Grade 9 attainment.
 */
export function V2MiniLab({ lesson, onOpen }: { lesson: Lesson; onOpen: () => void }) {
  const discovery = selectDiscovery(lesson);
  const supported = discovery?.model?.kind === "parabola";
  const [a, setA] = useState(1);
  const [b, setB] = useState(-2);
  const [c, setC] = useState(-1);
  const id = useId().replaceAll(":", "");
  const points = useMemo(() => curve(a, b, c), [a, b, c]);
  const original = useMemo(() => curve(1, 0, 0), []);

  if (!supported) {
    return (
      <section className="v2-panel v2-mini-lab" aria-label="Góc khám phá">
        <header className="v2-panel-head"><h2><Icon name="science" /> Phòng khám phá</h2></header>
        <p>Chưa có thí nghiệm tương tác gắn với học liệu đã xuất bản.</p>
        <Button onClick={onOpen}>Xem bài học <Icon name="arrow_forward" /></Button>
      </section>
    );
  }

  return (
    <section className="v2-panel v2-mini-lab" aria-label="Phòng khám phá Toán học">
      <header className="v2-panel-head">
        <h2><Icon name="science" /> Phòng thí nghiệm Toán</h2>
        <Button variant="ghost" className="v2-lab-header-cta" onClick={onOpen}>
          Thử ngay <Icon name="arrow_forward" />
        </Button>
      </header>
      <div className="v2-mini-lab-intro">
        <h3>Khám phá parabol theo cách mới</h3>
        <p className="v2-muted">Thay đổi các hệ số và tự quan sát hình dạng đồ thị.</p>
      </div>

      <div className="v2-mini-graph">
        <div className="v2-mini-lab-plot">
          <svg
            viewBox="0 0 320 200"
            role="img"
            aria-label={`Đồ thị hàm số ${formula(a, b, c)} trên hệ trục cố định`}
          >
            <defs>
              <pattern id={`${id}-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0V20" stroke="var(--v2-border)" strokeWidth=".85" fill="none"/>
              </pattern>
              <clipPath id={`${id}-clip`}><rect width="320" height="200" rx="10"/></clipPath>
            </defs>
            <rect width="320" height="200" fill={`url(#${id}-grid)`} />
            <path d="M0 100H320M160 0V200" stroke="var(--color-sky-400)" strokeOpacity=".8" strokeWidth="1.3"/>
            <g clipPath={`url(#${id}-clip)`}>
              <polyline points={original} fill="none" stroke="var(--color-ice)" strokeOpacity=".35" strokeWidth="1.8" strokeDasharray="5 6" />
              <polyline points={points} fill="none" stroke="var(--color-cyan)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <text x="12" y="24" fill="var(--color-ice)" fontSize="13">{formula(a, b, c)}</text>
            <text x="300" y="93" fill="var(--color-ice)" fontSize="11">x</text>
            <text x="170" y="14" fill="var(--color-ice)" fontSize="11">y</text>
          </svg>
        </div>
        <div className="v2-mini-lab-controls" aria-label="Điều chỉnh hệ số">
          <p className="v2-lab-controls-caption">Kéo thanh trượt để thay đổi đồ thị</p>
          <label htmlFor={id + "-a"}>
            <span>a = <strong>{a}</strong></span>
            <Input id={id + "-a"} type="range" min={0} max={steps.length - 1} step={1}
              value={steps.indexOf(a as typeof steps[number])}
              aria-label="Hệ số a" aria-valuetext={`Hệ số a bằng ${a}`}
              onChange={(event) => setA(steps[Number(event.target.value)])} />
          </label>
          <label htmlFor={id + "-b"}>
            <span>b = <strong>{b}</strong></span>
            <Input id={id + "-b"} type="range" min={-4} max={4} step={1}
              value={b} aria-label="Hệ số b" aria-valuetext={`Hệ số b bằng ${b}`}
              onChange={(event) => setB(Number(event.target.value))} />
          </label>
          <label htmlFor={id + "-c"}>
            <span>c = <strong>{c}</strong></span>
            <Input id={id + "-c"} type="range" min={-4} max={4} step={1}
              value={c} aria-label="Hệ số c" aria-valuetext={`Hệ số c bằng ${c}`}
              onChange={(event) => setC(Number(event.target.value))} />
          </label>
          <Button variant="ghost" className="v2-lab-reset" onClick={() => { setA(1); setB(0); setC(0); }}>
            <Icon name="refresh" /> Đặt lại
          </Button>
        </div>
      </div>
      <div className="v2-mini-lab-footer">
        <p role="status">Quan sát: đồ thị <strong>{a > 0 ? "mở lên" : "mở xuống"}</strong>{b || c ? "; b và c là phần khám phá mở rộng." : " và đối xứng qua trục tung."}</p>
        <span className="v2-lab-dots" aria-hidden="true"><i/><i/><i/></span>
      </div>
      <small className="v2-lab-source">Thí nghiệm gắn bài đã xuất bản; không cộng GP hay tự hoàn thành.</small>
    </section>
  );
}
