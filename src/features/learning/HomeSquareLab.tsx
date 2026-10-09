import { useId, useState } from "react";
import { Button, Icon, Input } from "../../components/ui";

/**
 * Deterministic geometry model for the reviewed Grade 9 square-root lesson.
 * This is an exploration preview, NOT AI feedback or completion evidence.
 */
export function HomeSquareLab({
  onOpenLesson,
  onOpenExercises,
}: {
  onOpenLesson: () => void;
  onOpenExercises: () => void;
}) {
  const [side, setSide] = useState(3);
  const id = useId().replaceAll(":", "");
  const area = Number((side * side).toFixed(2));
  const squareSize = 42 + (side - 1) * 28;
  const squareX = 170 - squareSize / 2;
  const squareY = 120 - squareSize / 2;

  return (
    <div className="home-next-square-lab" data-home-square-lab>
      <div className="home-next-square-head">
        <span>
          <Icon name="grid_view" />
          Mô hình biến thiên diện tích · S = x²
        </span>
        <strong aria-live="polite">
          x = {side} cm · S = {area} cm²
        </strong>
      </div>
      <div className="home-next-square-stage">
        <svg
          viewBox="0 0 340 240"
          role="img"
          aria-label={`Hình vuông cạnh ${side} centimét có diện tích ${area} centimét vuông`}
        >
          <defs>
            <pattern
              id={`${id}-dots`}
              patternUnits="userSpaceOnUse"
              width="16"
              height="16"
            >
              <circle cx="2" cy="2" r="1" className="home-next-square-dot" />
            </pattern>
          </defs>
          <rect width="340" height="240" fill={`url(#${id}-dots)`} />
          <rect
            className="home-next-square-shape"
            x={squareX}
            y={squareY}
            width={squareSize}
            height={squareSize}
            rx="8"
          />
          <text x="170" y={squareY - 9} textAnchor="middle" className="home-next-square-dimension">
            cạnh x = {side} cm
          </text>
          <text
            x="170"
            y="126"
            textAnchor="middle"
            className="home-next-square-area"
          >
            {area} cm²
          </text>
          <text x="170" y="145" textAnchor="middle" className="home-next-square-formula">
            S = x²
          </text>
        </svg>
      </div>
      <div className="home-next-square-slider">
        <label htmlFor={id + "-slider"}>
          <span>Thay đổi độ dài cạnh</span>
          <strong>x = {side} cm</strong>
        </label>
        <Input
          type="range"
          id={id + "-slider"}
          min={1}
          max={6}
          step={0.5}
          value={side}
          aria-valuetext={`${side} centimét, diện tích ${area} centimét vuông`}
          onChange={(event) => setSide(Number(event.target.value))}
        />
        <div className="home-next-square-scale" aria-hidden="true">
          <span>1 cm</span>
          <span>√S = x</span>
          <span>6 cm</span>
        </div>
      </div>
      <div className="home-next-square-insight">
        <Icon name="lightbulb" />
        <p>
          <strong>Nhận xét từ mô hình:</strong> Diện tích S = x².
          Khi cạnh tăng gấp đôi, diện tích tăng gấp bốn.
          Vì x dương, √S = x.
        </p>
      </div>
      <div className="home-next-square-footer">
        <Button variant="secondary" onClick={onOpenLesson}>
          <Icon name="menu_book" />
          Học về căn bậc hai
        </Button>
        <Button variant="primary" onClick={onOpenExercises}>
          Bắt đầu tự luyện <Icon name="arrow_forward" />
        </Button>
      </div>
    </div>
  );
}
