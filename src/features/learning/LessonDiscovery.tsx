import { useId, useRef, useState } from "react";
import { AdaptiveText } from "../../components/AdaptiveText";
import { Button, Icon, Input } from "../../components/ui";
import type { Lesson, LessonExercise } from "../../types/content";
import {
  parabolaPoints,
  selectDiscovery,
  type DiscoveryModel,
} from "./lessonDiscovery";
import "../../styles/student-exploration.css";

export interface LessonDiscoveryProps {
  lesson: Lesson;
  compact?: boolean;
  onContinue?: () => void;
}

export function LessonDiscovery({
  lesson,
  compact = false,
  onContinue,
}: LessonDiscoveryProps) {
  const discovery = selectDiscovery(lesson);
  if (!discovery) return null;
  return (
    <DiscoveryActivity
      key={JSON.stringify([lesson.id, discovery])}
      {...discovery}
      compact={compact}
      onContinue={onContinue}
    />
  );
}

function DiscoveryActivity({
  exercise,
  model,
  compact,
  onContinue,
}: {
  exercise: LessonExercise;
  model?: DiscoveryModel;
  compact: boolean;
  onContinue?: () => void;
}) {
  const id = useId();
  const firstOptionRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = checked && selection === exercise.correctIndex;
  function retry() {
    setChecked(false);
    setSelection(null);
    requestAnimationFrame(() => firstOptionRef.current?.focus());
  }
  return (
    <section
      className={`lesson-discovery${compact ? " lesson-discovery--compact" : ""}`}
      aria-labelledby={`${id}-title`}
      data-exercise={exercise.id}
    >
      <header className="lesson-discovery__header">
        <span className="lesson-discovery__eyebrow">
          <Icon name="gesture" /> Chạm để hiểu
        </span>
        <h2 id={`${id}-title`}>
          {model?.title ?? "Thử một ý tưởng trước khi học"}
        </h2>
        <p>
          {model?.instruction ??
            "Chọn cách em đang nghĩ. Sau đó kiểm tra để khám phá vì sao."}
        </p>
      </header>
      <div className="lesson-discovery__body" data-has-model={Boolean(model)}>
        {model && <DiscoveryManipulative model={model} />}
        <div className="lesson-discovery__question">
          <fieldset disabled={checked}>
            <legend>
              <AdaptiveText text={exercise.prompt} />
            </legend>
            <div className="lesson-discovery__options">
              {exercise.options.map((option, index) => (
                <label
                  key={index}
                  className="lesson-discovery__option"
                  data-selected={selection === index}
                  data-result={
                    checked && selection === index
                      ? correct
                        ? "correct"
                        : "retry"
                      : undefined
                  }
                >
                  <Input
                    ref={index === 0 ? firstOptionRef : undefined}
                    type="radio"
                    name={`${id}-answer`}
                    value={index}
                    aria-label={`${String.fromCharCode(65 + index)}. ${option}`}
                    checked={selection === index}
                    onChange={() => setSelection(index)}
                  />
                  <span className="lesson-discovery__letter" aria-hidden="true">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>
                    <AdaptiveText text={option} />
                  </span>
                  {checked && selection === index && (
                    <Icon name={correct ? "check_circle" : "refresh"} />
                  )}
                </label>
              ))}
            </div>
          </fieldset>
          <div
            className="lesson-discovery__feedback"
            role="status"
            data-tone={correct ? "correct" : "retry"}
          >
            {checked && (
              <>
                <strong>
                  {correct ? "Em tìm ra rồi!" : "Một gợi ý để thử lại"}
                </strong>
                <p>
                  <AdaptiveText text={exercise.explanation} />
                </p>
              </>
            )}
          </div>
          <div className="lesson-discovery__actions">
            {!checked ? (
              <Button
                disabled={selection === null}
                onClick={() => setChecked(true)}
              >
                Kiểm tra ý tưởng <Icon name="arrow_forward" />
              </Button>
            ) : correct && onContinue ? (
              <Button onClick={onContinue}>
                Học tiếp từ đây <Icon name="arrow_forward" />
              </Button>
            ) : (
              <Button
                variant={correct ? "secondary" : "primary"}
                onClick={retry}
              >
                <Icon name="refresh" />{" "}
                {correct ? "Khám phá lại" : "Chọn lại đáp án"}
              </Button>
            )}
            <span>Một lần thử, thêm một điều hiểu.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function DiscoveryManipulative({ model }: { model: DiscoveryModel }) {
  const [value, setValue] = useState(model.initial);
  const id = useId();
  if (model.kind === "square-root-domain") {
    const area = value - model.offset;
    const side = Math.sqrt(Math.max(0, area)) * 48;
    return (
      <div className="lesson-discovery__model">
        <div className="lesson-discovery__paper">
          <span className="lesson-discovery__model-label">
            Diện tích hình vuông
          </span>
          <svg
            viewBox="0 0 320 212"
            role="img"
            aria-label={
              area < 0
                ? `Giá trị dưới căn là ${area}. Không có hình vuông mang diện tích âm.`
                : `Hình vuông có diện tích ${area} đơn vị vuông.`
            }
          >
            {area > 0 ? (
              <>
                <rect
                  className="lesson-discovery__square"
                  x={160 - side / 2}
                  y={98 - side / 2}
                  width={side}
                  height={side}
                  rx="3"
                />
                <text
                  className="lesson-discovery__area"
                  x="160"
                  y="102"
                  textAnchor="middle"
                >
                  S = {area}
                </text>
              </>
            ) : (
              <>
                <path
                  className="lesson-discovery__axis"
                  d="M115 98H205 M160 53V143"
                />
                <circle
                  className="lesson-discovery__origin"
                  cx="160"
                  cy="98"
                  r="4"
                />
                <text x="160" y="167" textAnchor="middle">
                  {area === 0 ? "Diện tích bằng 0" : "Diện tích âm?"}
                </text>
              </>
            )}
            {area > 0 && (
              <text x="160" y="182" textAnchor="middle">
                {area} đơn vị vuông
              </text>
            )}
          </svg>
          <div className="lesson-discovery__equation">
            <span>Phần dưới dấu căn</span>
            <strong>
              x − {model.offset} = {area}
            </strong>
          </div>
        </div>
        <div className="lesson-discovery__slider">
          <label htmlFor={id}>
            Thay đổi x <strong>x = {value}</strong>
          </label>
          <div className="lesson-discovery__slider-controls">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Giảm x"
              disabled={value <= model.min}
              onClick={() => setValue(value - 1)}
            >
              −
            </Button>
            <Input
              id={id}
              type="range"
              min={model.min}
              max={model.max}
              step={1}
              value={value}
              aria-valuetext={`x bằng ${value}, phần dưới dấu căn bằng ${area}`}
              onChange={(event) => setValue(Number(event.target.value))}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Tăng x"
              disabled={value >= model.max}
              onClick={() => setValue(value + 1)}
            >
              +
            </Button>
          </div>
          <span className="lesson-discovery__model-note">
            Kéo thanh trượt hoặc dùng phím mũi tên.
          </span>
        </div>
      </div>
    );
  }
  const points = parabolaPoints(value)
    .map(({ screenX, screenY }) => `${screenX},${screenY}`)
    .join(" ");
  return (
    <div className="lesson-discovery__model">
      <div className="lesson-discovery__paper">
        <span className="lesson-discovery__model-label">
          <AdaptiveText text={`$y = ${value}x^2$`} />
        </span>
        <svg
          viewBox="0 0 320 228"
          role="img"
          aria-label={`Đồ thị y bằng ${value} nhân x bình phương, cùng thang đo từ âm 12 đến 12 trên trục y.`}
        >
          {[-2, -1, 1, 2].map((x) => (
            <path
              key={`x${x}`}
              className="lesson-discovery__grid"
              d={`M${160 + x * 62} 12V216`}
            />
          ))}
          {[-12, -6, 6, 12].map((y) => (
            <g key={`y${y}`}>
              <path
                className="lesson-discovery__grid"
                d={`M24 ${114 - y * 8}H296`}
              />
              <text
                className="lesson-discovery__axis-label"
                x="166"
                y={110 - y * 8}
              >
                {y}
              </text>
            </g>
          ))}
          <path
            className="lesson-discovery__axis"
            d="M24 114H298 M160 12V216"
          />
          <polyline className="lesson-discovery__parabola" points={points} />
          <circle
            className="lesson-discovery__origin"
            cx="160"
            cy="114"
            r="4"
          />
          <text x="146" y="132">
            O
          </text>
          <text x="297" y="132">
            x
          </text>
          <text x="143" y="16">
            y
          </text>
          {[-2, -1, 1, 2].map((x) => (
            <text
              key={x}
              className="lesson-discovery__axis-label"
              x={160 + x * 62}
              y="132"
              textAnchor="middle"
            >
              {x}
            </text>
          ))}
        </svg>
      </div>
      <div
        className="lesson-discovery__coefficients"
        role="group"
        aria-label="Thay đổi hệ số a"
      >
        {model.coefficients.map((coefficient) => (
          <Button
            key={coefficient}
            variant="ghost"
            aria-pressed={value === coefficient}
            onClick={() => setValue(coefficient)}
          >
            a = {coefficient}
          </Button>
        ))}
      </div>
      <span className="lesson-discovery__model-note">
        Chọn hệ số để đồ thị chuyển động.
      </span>
    </div>
  );
}
