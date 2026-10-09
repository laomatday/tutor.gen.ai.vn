import { useId, useState } from "react";
import { Button, Icon, Input } from "../../components/ui";
import type { MathLabConfig, QuadraticCoefficients } from "./domain";
import {
  formatQuadratic,
  hasRunExperiment,
  quadraticPlot,
} from "./domain";
import "../../styles/micro-labs.css";

const aValues = [-3, -2, -1, 1, 2, 3] as const;

export function QuadraticMicroLab({ lab }: { lab: MathLabConfig }) {
  const [stageIndex, setStageIndex] = useState(0);
  const stage = lab.stages[stageIndex];
  const [coefficients, setCoefficients] = useState<QuadraticCoefficients>(
    () => ({ ...stage.baseline }),
  );
  const [prediction, setPrediction] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const graphId = useId().replace(/:/g, "");
  const success = checked && prediction === stage.correctIndex;
  const experimented = hasRunExperiment(stage, coefficients);
  const baselinePoints = quadraticPlot(stage.baseline);
  const currentPoints = quadraticPlot(coefficients);
  const toPolyline = (points: ReturnType<typeof quadraticPlot>) =>
    points.map(({ screenX, screenY }) => `${screenX},${screenY}`).join(" ");

  function change(key: keyof QuadraticCoefficients, value: number) {
    setCoefficients((current) => ({ ...current, [key]: value }));
    setChecked(false);
  }

  function next() {
    const index = stageIndex === lab.stages.length - 1 ? 0 : stageIndex + 1;
    setStageIndex(index);
    setCoefficients({ ...lab.stages[index].baseline });
    setPrediction(null);
    setChecked(false);
  }

  return (
    <section
      className="micro-lab micro-lab--math"
      data-micro-lab={lab.id}
      aria-label={lab.title}
    >
      <header className="micro-lab__header">
        <div>
          <p className="micro-lab__eyebrow">
            <Icon name="timeline" /> Thí nghiệm tương tác · Toán 9
          </p>
          <h3>{lab.title}</h3>
          <p>{lab.objective}</p>
        </div>
        <span className="micro-lab__stage">
          Bước {stageIndex + 1}/{lab.stages.length}
        </span>
      </header>

      <div className="micro-lab__math-grid">
        <div className="micro-lab__canvas">
          <div className="micro-lab__graph-title">
            <strong>{formatQuadratic(coefficients)}</strong>
            <span>Cùng hệ trục, cùng tỉ lệ</span>
          </div>
          <svg
            className="micro-lab__graph"
            viewBox="0 0 480 276"
            role="img"
            aria-label={`Đồ thị ${formatQuadratic(coefficients)} so với đồ thị ban đầu ${formatQuadratic(stage.baseline)}`}
          >
            <defs>
              <clipPath id={graphId}>
                <rect x="26" y="18" width="428" height="240" />
              </clipPath>
            </defs>
            {[-3, -2, -1, 1, 2, 3].map((n) => (
              <path
                key={n}
                d={`M${240 + n * 53.5} 18 V258`}
                className="micro-lab__grid-line"
              />
            ))}
            {[-10, -5, 5, 10].map((n) => (
              <path
                key={n}
                d={`M26 ${138 - (n / 12) * 120} H454`}
                className="micro-lab__grid-line"
              />
            ))}
            <path d="M26 138 H454 M240 18 V258" className="micro-lab__axis" />
            <g clipPath={`url(#${graphId})`}>
              <polyline
                points={toPolyline(baselinePoints)}
                className="micro-lab__curve micro-lab__curve--base"
              />
              <polyline
                points={toPolyline(currentPoints)}
                className="micro-lab__curve micro-lab__curve--active"
              />
            </g>
            <text x="458" y="153" className="micro-lab__axis-label">x</text>
            <text x="248" y="24" className="micro-lab__axis-label">y</text>
            <text x="248" y="153" className="micro-lab__axis-label">O</text>
          </svg>
          <div className="micro-lab__legend">
            <span><i data-curve="base" /> Đồ thị ban đầu</span>
            <span><i data-curve="current" /> Sau khi thay đổi</span>
          </div>
          <div className="micro-lab__controls" aria-label="Thay đổi hệ số">
            <div className="micro-lab__control" data-focus={stage.focus === "a"}>
              <span className="micro-lab__control-label">Hệ số a = {coefficients.a}</span>
              <div className="micro-lab__a-options">
                {aValues.map((value) => (
                  <Button
                    key={value}
                    variant="surface"
                    size="sm"
                    aria-pressed={coefficients.a === value}
                    onClick={() => change("a", value)}
                  >
                    a = {value}
                  </Button>
                ))}
              </div>
            </div>
            {(["b", "c"] as const).map((key) => (
              <label key={key} className="micro-lab__control" data-focus={stage.focus === key}>
                <span className="micro-lab__control-label">
                  Hệ số {key} = {coefficients[key]}
                </span>
                <Input
                  type="range"
                  min={-4}
                  max={4}
                  step={1}
                  value={coefficients[key]}
                  aria-label={`Hệ số ${key}`}
                  onChange={(event) => change(key, Number(event.target.value))}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="micro-lab__inquiry">
          <p className="micro-lab__eyebrow">Dự đoán → thử nghiệm → giải thích</p>
          <h4>{stage.title}</h4>
          <fieldset>
            <legend>{stage.prompt}</legend>
            <div className="micro-lab__choices">
              {stage.choices.map((option, index) => (
                <label key={option} className="micro-lab__choice" data-selected={prediction === index}>
                  <Input
                    type="radio"
                    name={`${graphId}-prediction`}
                    checked={prediction === index}
                    aria-label={option}
                    onChange={() => {
                      setPrediction(index);
                      setChecked(false);
                    }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="micro-lab__prompt">
            <Icon name="lightbulb" />
            <span>
              Giữ hai hệ số còn lại như ban đầu. Hãy {stage.direction === "negative" ? "giảm" : "tăng"} hệ số {stage.focus}, rồi kiểm tra dự đoán.
            </span>
          </div>
          <div className="micro-lab__actions">
            {!success && (
              <Button
                disabled={prediction === null || !experimented}
                onClick={() => setChecked(true)}
              >
                Kiểm tra dự đoán <Icon name="arrow_forward" />
              </Button>
            )}
            {success && (
              <Button onClick={next}>
                {stageIndex === lab.stages.length - 1 ? "Khám phá lại" : "Bước tiếp theo"}
                <Icon name="arrow_forward" />
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setCoefficients({ ...stage.baseline });
                setPrediction(null);
                setChecked(false);
              }}
            >
              <Icon name="refresh" /> Đặt lại
            </Button>
          </div>
          {checked && (
            <div className="micro-lab__feedback" data-correct={success} role="status">
              <strong>{success ? "Em đã lý giải được!" : "Còn một điều cần quan sát"}</strong>
              <p>{success ? stage.explanation : stage.hint}</p>
            </div>
          )}
          <p className="micro-lab__disclaimer">{lab.description} Thao tác không cộng GP hoặc hoàn thành bài.</p>
        </div>
      </div>
    </section>
  );
}
