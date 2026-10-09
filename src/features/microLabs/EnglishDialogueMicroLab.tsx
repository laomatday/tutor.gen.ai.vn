import { useEffect, useId, useRef, useState } from "react";
import { Button, Icon, Input } from "../../components/ui";
import type { BoundDialogueLab } from "./domain";
import "../../styles/micro-labs.css";

export function EnglishDialogueMicroLab({
  lab,
  compact = false,
  onContinue,
}: {
  lab: BoundDialogueLab;
  compact?: boolean;
  onContinue?: () => void;
}) {
  const id = useId();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [selection, setSelection] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [restoreFocus, setRestoreFocus] = useState(false);
  const firstChoice = useRef<HTMLInputElement>(null);
  const scene = lab.steps[sceneIndex];
  const correct = checked && selection === scene.exercise.correctIndex;

  useEffect(() => {
    if (restoreFocus && !checked) {
      firstChoice.current?.focus();
      setRestoreFocus(false);
    }
  }, [restoreFocus, checked]);

  function retry() {
    setChecked(false);
    setSelection(null);
    setRestoreFocus(true);
  }

  function advance() {
    if (sceneIndex < lab.steps.length - 1) {
      setSceneIndex((current) => current + 1);
      setChecked(false);
      setSelection(null);
      setRestoreFocus(true);
    } else if (onContinue) {
      onContinue();
    } else {
      setSceneIndex(0);
      setSelection(null);
      setChecked(false);
      setRestoreFocus(true);
    }
  }

  return (
    <section
      className={`lesson-discovery lesson-dialogue${compact ? " lesson-discovery--compact" : ""}`}
      data-micro-lab={lab.id}
      data-exercise={scene.exercise.id}
      aria-labelledby={`${id}-title`}
    >
      <div className="lesson-dialogue__heading">
        <div>
          <p className="micro-lab__eyebrow">
            <Icon name="question_answer" /> Micro-lab · Tiếng Anh 9
          </p>
          <h2 id={`${id}-title`}>{lab.title}</h2>
          <p>{lab.objective}</p>
        </div>
        <span className="micro-lab__stage">
          Tình huống {sceneIndex + 1}/{lab.steps.length}
        </span>
      </div>
      <div className="lesson-dialogue__workspace">
        <div className="lesson-dialogue__conversation" aria-label={scene.scene}>
          <p className="lesson-dialogue__scene">{scene.scene}</p>
          <div className="lesson-dialogue__bubble lesson-dialogue__bubble--partner">
            <span>{scene.partner}</span>
            <p lang="en">{scene.partnerLine}</p>
          </div>
          <div className="lesson-dialogue__bubble lesson-dialogue__bubble--student">
            <span>Em</span>
            <p>{scene.studentInstruction}</p>
          </div>
          {correct && (
            <div className="lesson-dialogue__bubble lesson-dialogue__bubble--partner">
              <span>{scene.partner}</span>
              <p lang="en">{scene.partnerReply}</p>
            </div>
          )}
        </div>
        <div className="lesson-dialogue__exercise">
          <fieldset disabled={correct}>
            <legend lang="en">{scene.exercise.prompt}</legend>
            <div className="lesson-dialogue__options">
              {scene.exercise.options.map((option, index) => (
                <label
                  key={index}
                  className="lesson-dialogue__option"
                  data-selected={selection === index}
                >
                  <Input
                    type="radio"
                    ref={index === 0 ? firstChoice : undefined}
                    name={`${id}-dialogue-answer`}
                    value={index}
                    checked={selection === index}
                    aria-label={option}
                    onChange={() => {
                      setSelection(index);
                      setChecked(false);
                    }}
                  />
                  <span lang="en">{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {checked && (
            <div
              role="status"
              className="micro-lab__feedback"
              data-correct={correct}
            >
              <strong>{correct ? "Phản hồi phù hợp tình huống!" : "Thử một cách diễn đạt khác"}</strong>
              <p>{correct ? scene.exercise.explanation : scene.hint}</p>
            </div>
          )}
          <div className="micro-lab__actions">
            {!checked && (
              <Button
                disabled={selection === null}
                onClick={() => setChecked(true)}
              >
                Kiểm tra lời đáp <Icon name="arrow_forward" />
              </Button>
            )}
            {checked && !correct && (
              <Button onClick={retry}>
                <Icon name="refresh" /> Thử câu khác
              </Button>
            )}
            {correct && (
              <Button onClick={advance}>
                {sceneIndex < lab.steps.length - 1
                  ? "Tiếp tục hội thoại"
                  : onContinue
                    ? "Học tiếp từ đây"
                    : "Luyện lại hội thoại"}
                <Icon name="arrow_forward" />
              </Button>
            )}
          </div>
          <p className="micro-lab__disclaimer">
            Hội thoại tình huống theo học liệu đã xuất bản, không gọi AI hoặc ghi nhận điểm.
          </p>
        </div>
      </div>
    </section>
  );
}
