import { useRef, useState, type PointerEvent } from "react";
import { Button, Field, Icon, Input } from "../../components/ui";
import { RichMathText } from "../../components/MathLatex";
import type { PracticeProblem } from "../../types/content";
import { practicePolicy } from "./data";
import type { SketchPoint } from "./domain";
import { ParabolaStudy } from "./ParabolaStudy";

export function SketchPad({
  strokes,
  onChange,
}: {
  strokes: SketchPoint[][];
  onChange: (strokes: SketchPoint[][]) => void;
}) {
  const [drawing, setDrawing] = useState<SketchPoint[]>([]);
  const active = useRef(false);
  const points = useRef<SketchPoint[]>([]);
  const coordinate = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(
        800,
        Math.max(0, ((event.clientX - rect.left) / rect.width) * 800),
      ),
      y: Math.min(
        300,
        Math.max(0, ((event.clientY - rect.top) / rect.height) * 300),
      ),
    };
  };
  const finish = () => {
    if (!active.current) return;
    active.current = false;
    if (points.current.length)
      onChange(
        [...strokes, points.current].slice(-practicePolicy.sketchStrokeLimit),
      );
    points.current = [];
    setDrawing([]);
  };
  return (
    <div className="studio-tool-panel">
      <div className="studio-section-head">
        <div>
          <h3>Bút phác thảo</h3>
          <p>
            Dùng chuột, bút hoặc chạm để ghi nháp; nhập lời giải bên dưới để
            kiểm tra.
          </p>
        </div>
        <div className="studio-inline-actions">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Hoàn tác nét vẽ"
            disabled={!strokes.length}
            onClick={() => onChange(strokes.slice(0, -1))}
          >
            <Icon name="undo" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Xóa bản nháp"
            disabled={!strokes.length}
            onClick={() => onChange([])}
          >
            <Icon name="delete_outline" />
          </Button>
        </div>
      </div>
      <svg
        viewBox="0 0 800 300"
        preserveAspectRatio="none"
        role="img"
        aria-label="Vùng vẽ nháp bằng bút hoặc chuột"
        className="studio-sketch"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          active.current = true;
          points.current = [coordinate(event)];
          setDrawing(points.current);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (
            active.current &&
            points.current.length < practicePolicy.sketchPointLimit
          ) {
            points.current = [...points.current, coordinate(event)];
            setDrawing(points.current);
          }
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        <defs>
          <pattern
            id="studio-sketch-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="currentColor" opacity=".14" />
          </pattern>
        </defs>
        <rect width="800" height="300" fill="url(#studio-sketch-grid)" />
        {[...strokes, drawing]
          .filter((stroke) => stroke.length)
          .map((stroke, index) => (
            <polyline
              key={index}
              points={stroke.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
      </svg>
      <p className="studio-caption">
        Bản nháp được lưu trên thiết bị. Nét vẽ chưa được nhận dạng thành công
        thức.
      </p>
    </div>
  );
}

function QuadraticGraph({ problem }: { problem: PracticeProblem }) {
  const quadratic = problem.quadratic!;
  const [x, setX] = useState(0);
  const min = Math.min(...problem.graphXs),
    max = Math.max(...problem.graphXs);
  const f = (value: number) =>
    quadratic.a * value ** 2 + quadratic.b * value + quadratic.c;
  const vertex = -quadratic.b / (2 * quadratic.a);
  const ys = [...problem.graphXs.map(f), f(vertex), 0];
  const minY = Math.min(...ys) - 2,
    maxY = Math.max(...ys) + 2;
  const px = (value: number) => 36 + ((value - min) / (max - min)) * 528;
  const py = (value: number) => 245 - ((value - minY) / (maxY - minY)) * 218;
  const path = Array.from({ length: 121 }, (_, i) => {
    const value = min + ((max - min) * i) / 120;
    return `${i ? "L" : "M"} ${px(value)} ${py(f(value))}`;
  }).join(" ");
  return (
    <div className="studio-tool-panel">
      <div className="studio-section-head">
        <div>
          <h3>Parabol tương tác</h3>
          <p>Di chuyển điểm M để quan sát giá trị của đa thức.</p>
        </div>
        <span className="studio-chip">
          M({x}; {Number(f(x).toFixed(2))})
        </span>
      </div>
      <svg
        viewBox="0 0 600 270"
        className="studio-graph"
        role="img"
        aria-label="Đồ thị đa thức của bài tập với điểm M di chuyển theo x"
      >
        {problem.graphXs.map((value) => (
          <g key={value}>
            <path
              d={`M${px(value)} 20 V250`}
              stroke="currentColor"
              opacity=".07"
            />
            <text
              x={px(value)}
              y="266"
              textAnchor="middle"
              fontSize="12"
              fill="currentColor"
            >
              {value}
            </text>
          </g>
        ))}
        <path
          d={`M25 ${py(0)} H580 M${px(0)} 15 V250`}
          stroke="currentColor"
          opacity=".25"
        />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="3" />
        <path
          d={`M${px(x)} ${py(0)} V${py(f(x))}`}
          stroke="var(--color-accent-strong)"
          strokeDasharray="4 4"
        />
        <circle
          cx={px(x)}
          cy={py(f(x))}
          r="6"
          fill="var(--color-accent-strong)"
        />
      </svg>
      <Field label={`Hoành độ x = ${x}`}>
        <Input
          aria-label="Hoành độ điểm M"
          type="range"
          min={min}
          max={max}
          step="0.1"
          value={x}
          onChange={(event) => setX(Number(event.target.value))}
        />
      </Field>
    </div>
  );
}

export function GraphStudy({
  problem,
  unlocked,
}: {
  problem: PracticeProblem;
  unlocked: boolean;
}) {
  if (problem.quadratic) return <QuadraticGraph problem={problem} />;
  return (
    <div className="studio-tool-panel">
      <h3>Parabol & bảng giá trị</h3>
      {unlocked ? (
        <ParabolaStudy point={problem.point} graphXs={problem.graphXs} />
      ) : (
        <p className="studio-copy">
          Hoàn thành bài hoặc mở gợi ý cuối để xem đồ thị với hệ số em cần tìm.
        </p>
      )}
    </div>
  );
}

export function AlgebraTiles({ problem }: { problem: PracticeProblem }) {
  const [u, setU] = useState(0),
    [v, setV] = useState(0);
  if (!problem.quadratic)
    return <GraphStudy problem={problem} unlocked={false} />;
  const q = problem.quadratic;
  const matches = u + v === q.b && u * v === q.c;
  return (
    <section className="studio-tool-panel studio-algebra">
      <p className="studio-eyebrow">Chạm vào ý tưởng</p>
      <h3>Ghép hình để hiểu cách tách nhân tử</h3>
      <p className="studio-copy">
        Thay đổi u và v, rồi xem từng mảnh ghép biến đổi. Tổng và tích đã khớp
        chưa?
      </p>
      <div className="studio-tile-controls">
        <Field label="Giá trị u">
          <Input
            aria-label="Giá trị u"
            type="number"
            value={u}
            min={-20}
            max={20}
            onChange={(event) =>
              setU(Math.max(-20, Math.min(20, Number(event.target.value))))
            }
          />
        </Field>
        <Field label="Giá trị v">
          <Input
            aria-label="Giá trị v"
            type="number"
            value={v}
            min={-20}
            max={20}
            onChange={(event) =>
              setV(Math.max(-20, Math.min(20, Number(event.target.value))))
            }
          />
        </Field>
      </div>
      <div className="studio-tile-layout">
        <div
          className="studio-tiles"
          aria-label="Mô hình bốn hạng tử khi khai triển"
        >
          <div className="studio-tile studio-tile-main">
            <b>x²</b>
            <small>Hạng tử bậc hai</small>
          </div>
          <div className="studio-tile">
            <b>{v}x</b>
            <small>v × x</small>
          </div>
          <div className="studio-tile">
            <b>{u}x</b>
            <small>u × x</small>
          </div>
          <div className="studio-tile studio-tile-product">
            <b>
              {u * v >= 0 ? "+" : ""}
              {u * v}
            </b>
            <small>u × v</small>
          </div>
        </div>
        <div className="studio-tile-explanation">
          <p className="studio-eyebrow">Hai điều cần khớp</p>
          <RichMathText text={`$u+v=${u + v}$ · mục tiêu $${q.b}$`} />
          <RichMathText text={`$uv=${u * v}$ · mục tiêu $${q.c}$`} />
          <p className="studio-copy">
            Hai điều kiện phải cùng đúng. Sau đó cho từng nhân tử bằng 0 để tìm
            nghiệm.
          </p>
          <span
            className={`studio-chip ${matches ? "studio-chip-success" : ""}`}
            role="status"
          >
            <Icon name={matches ? "check_circle" : "lightbulb"} />
            {matches ? "Cả tổng và tích đều phù hợp" : "Thử một cặp số của em"}
          </span>
        </div>
      </div>
    </section>
  );
}
