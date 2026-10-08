import { useRef, useState } from "react";
import { MathLatex, RichMathText } from "../../components/MathLatex";
import {
  Alert,
  Badge,
  Button,
  Card,
  DemoDataNotice,
  Icon,
} from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import { canStudy, lessonHref } from "../curriculum";
import { sampleAssessment, type AssessmentError } from "./data";

export function CurriculumAction({
  lessonId,
  onNavigate,
  label = "Mở bài học",
}: {
  lessonId: string | null;
  onNavigate: (tab: string) => void;
  label?: string;
}) {
  const { lessons } = useCurriculum();
  const lesson = lessons.find(
    (item) =>
      item.id === lessonId &&
      item.status === "published" &&
      canStudy(item.gradeId, item.subjectId),
  );
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => onNavigate(lesson ? lessonHref(lesson) : "hoc-bai")}
    >
      <Icon name="menu_book" />
      {lesson ? label : "Xem môn học"}
    </Button>
  );
}

export function ErrorAnalysis({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) {
  const [selectedError, setSelectedError] = useState<AssessmentError | null>(
    null,
  );
  const hintRef = useRef<HTMLDivElement>(null);
  const openHint = (error: AssessmentError) => {
    setSelectedError(error);
    requestAnimationFrame(() => {
      hintRef.current?.focus({ preventScroll: true });
      hintRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };
  return (
    <section className="space-y-5" aria-labelledby="assessment-errors">
      <div>
        <DemoDataNotice className="mb-4" />
        <h2 id="assessment-errors" className="text-xl font-bold">
          Nội dung cần củng cố
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          {sampleAssessment.errors.length} điểm cần chú ý trong bài thi.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {sampleAssessment.errors.map((error) => (
          <Card key={error.id} className="flex min-w-0 flex-col gap-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <Badge tone="primary">Câu {error.id}</Badge>
              <span className="font-semibold text-error">
                −{error.lostPoints} điểm
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold">{error.title}</h3>
              <div className="mt-2">
                <Badge tone="warning">{error.category}</Badge>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl bg-surface-container-low p-3 text-sm">
              <p className="mb-2 text-xs text-on-surface-variant">
                Lời giải tham khảo
              </p>
              <div className="text-error line-through">
                <MathLatex formula={error.wrong} />
              </div>
              <p className="mb-1 mt-3 text-xs text-on-surface-variant">
                Đối chiếu
              </p>
              <div className="text-secondary">
                <MathLatex formula={error.correct} />
              </div>
            </div>
            <p className="flex-1 text-sm leading-7 text-on-surface-variant">
              <RichMathText text={error.description} />
            </p>
            <Button
              variant="secondary"
              onClick={() => openHint(error)}
              aria-expanded={selectedError?.id === error.id}
              aria-controls="assessment-error-hint"
            >
              Xem gợi ý sửa lỗi
              <Icon name="arrow_forward" />
            </Button>
          </Card>
        ))}
      </div>
      {selectedError && (
        <div
          ref={hintRef}
          id="assessment-error-hint"
          tabIndex={-1}
          className="scroll-mt-24"
        >
          <Alert tone="info">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-semibold">
                  Gợi ý sửa lỗi câu {selectedError.id}
                </h3>
                <p className="mt-2 text-sm leading-7">
                  <RichMathText text={selectedError.hint} />
                </p>
              </div>
              <div className="shrink-0">
                <CurriculumAction
                  lessonId={selectedError.lessonId}
                  onNavigate={onNavigate}
                />
              </div>
            </div>
          </Alert>
        </div>
      )}
    </section>
  );
}

export function SkillGroup({
  title,
  description,
  skills,
  onNavigate,
  isMastered = false,
}: {
  title: string;
  description: string;
  skills: ReadonlyArray<(typeof sampleAssessment.skills)[number]>;
  onNavigate: (tab: string) => void;
  isMastered?: boolean;
}) {
  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-2 text-sm text-on-surface-variant">{description}</p>
        </div>
        <Badge tone={isMastered ? "success" : "primary"}>
          {skills.length} chủ đề
        </Badge>
      </div>
      {skills.map((skill) => {
        const progress = Math.round((skill.earned / skill.maximum) * 100);
        return (
          <div
            key={skill.id}
            className="space-y-3 rounded-xl bg-surface-container-low p-4"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="font-semibold">{skill.title}</h3>
              <span className="text-sm font-semibold text-secondary">
                {progress}%
              </span>
            </div>
            <progress
              className="ui-progress w-full accent-secondary"
              value={skill.earned}
              max={skill.maximum}
              aria-label={`Mức thành thạo mẫu: ${skill.title}`}
            />
            <p className="text-sm leading-7 text-on-surface-variant">
              {skill.description}
            </p>
            {!isMastered && (
              <CurriculumAction
                lessonId={skill.lessonId}
                onNavigate={onNavigate}
                label="Ôn lại chủ đề"
              />
            )}
          </div>
        );
      })}
    </Card>
  );
}
