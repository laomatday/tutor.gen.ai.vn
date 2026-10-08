import { RichMathText } from "../../components/MathLatex";
import { Icon } from "../../components/ui";
import type { Lesson, PracticeProblem } from "../../types/content";

export function LessonPreview({
  lesson,
  problem,
}: {
  lesson: Lesson;
  problem?: PracticeProblem;
}) {
  const example = lesson.examples[0];
  const expressions = example?.prompt.match(/\$([^$]+)\$/g)?.slice(0, 3) ?? [];
  const point =
    problem?.kind === "parabola-coefficient" ? problem.point : undefined;
  return (
    <div className="mission-preview">
      <div className="discovery-section-heading">
        <span className="discovery-eyebrow">Xem trước bài học</span>
        <span className="discovery-chip">Lớp {lesson.gradeId}</span>
      </div>
      <div className="mission-paper">
        <span className="discovery-label">
          {example?.title ?? "Điểm xuất phát"}
        </span>
        <div className="mission-preview__prompt">
          <RichMathText text={example?.prompt ?? lesson.summary} />
        </div>
        {expressions.length > 0 && (
          <div className="mission-preview__formula">
            <RichMathText text={expressions.join(" · ")} />
          </div>
        )}
        <div className="mission-preview__hint">
          <Icon name="lightbulb" />
          <div>
            <strong>Câu hỏi dẫn đường</strong>
            <p>
              {lesson.theory[0]?.heading
                ? `Em sẽ vận dụng kiến thức về ${lesson.theory[0].heading.toLocaleLowerCase("vi")} như thế nào?`
                : "Em đã biết điều gì, và cần tìm điều gì trong bài này?"}
            </p>
          </div>
        </div>
      </div>
      <div className="mission-preview__visual">
        {point ? (
          <>
            <span className="discovery-label">Vị trí điểm trong đề bài</span>
            <svg
              viewBox="0 0 320 150"
              role="img"
              aria-label={`Điểm M có tọa độ ${point.x}, ${point.y}`}
            >
              <path
                className="discovery-chart-grid"
                d="M25 120H295 M160 15V140 M25 70H295 M90 15V140 M230 15V140"
              />
              <path
                className="discovery-chart-axis"
                d="M25 120H295 M160 15V140"
              />
              <path
                className="discovery-chart-dash"
                d={`M${160 + Math.sign(point.x) * 75} 120V40H160`}
              />
              <circle
                className="discovery-chart-point"
                cx={160 + Math.sign(point.x) * 75}
                cy="40"
                r="5"
              />
              <text x={160 + Math.sign(point.x) * 75 + 12} y="33">
                M({point.x}; {point.y})
              </text>
              <text x="285" y="137">
                x
              </text>
              <text x="170" y="22">
                y
              </text>
              <text x="168" y="135">
                O
              </text>
            </svg>
          </>
        ) : (
          <>
            <span className="discovery-label">Từ hiểu bài đến tự vận dụng</span>
            <div className="mission-preview__path">
              {[
                { icon: "menu_book", label: "Hiểu" },
                { icon: "lightbulb", label: "Liên hệ" },
                { icon: "edit_square", label: "Vận dụng" },
              ].map((step) => (
                <div key={step.label}>
                  <span>
                    <Icon name={step.icon} />
                  </span>
                  <small>{step.label}</small>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="mission-preview__footer">
        <Icon name="verified_user" />
        <span>Tự giải từng bước</span>
        <span>{lesson.exercises.length} câu luyện tập</span>
      </div>
    </div>
  );
}

export type RadarAxis = {
  id: string;
  label: string;
  completed: number;
  total: number;
};
export function ProgressRadar({ axes }: { axes: RadarAxis[] }) {
  const items = axes.slice(0, 6);
  const position = (index: number, fraction: number) => {
    const angle = (Math.PI * 2 * index) / items.length - Math.PI / 2;
    return [
      150 + Math.cos(angle) * 92 * fraction,
      130 + Math.sin(angle) * 92 * fraction,
    ];
  };
  if (items.length < 3)
    return (
      <div className="discovery-radar-empty">
        <Icon name="account_tree" />
        <p>Hoàn thành bài học để thấy tiến độ của từng chủ đề tại đây.</p>
      </div>
    );
  const scores = items.map((item, index) =>
    position(index, item.total ? item.completed / item.total : 0),
  );
  return (
    <div className="discovery-radar">
      <svg
        viewBox="0 0 300 264"
        role="img"
        aria-label="Biểu đồ tiến độ hoàn thành theo chủ đề"
      >
        {[0.25, 0.5, 0.75, 1].map((fraction) => (
          <polygon
            key={fraction}
            className="discovery-radar__grid"
            points={items
              .map((_, index) => position(index, fraction).join(","))
              .join(" ")}
          />
        ))}
        {items.map((item, index) => (
          <path
            key={item.id}
            className="discovery-radar__grid"
            d={`M150 130L${position(index, 1).join(" ")}`}
          />
        ))}
        <polygon
          className="discovery-radar__area"
          points={scores.map((point) => point.join(",")).join(" ")}
        />
        {items.map((item, index) => {
          const [x, y] = position(index, 1.15);
          return (
            <g key={item.id}>
              <circle
                className="discovery-chart-point"
                cx={scores[index][0]}
                cy={scores[index][1]}
                r="3.5"
              />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="middle">
                {Math.round((item.completed / Math.max(1, item.total)) * 100)}%
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="discovery-radar__key">
        {items.map((item, index) => (
          <li key={item.id}>
            <span>
              {index + 1}. {item.label}
            </span>
            <strong>
              {item.completed}/{item.total}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
