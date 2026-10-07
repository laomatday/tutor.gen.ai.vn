import { RichMathText } from "../../components/MathLatex";
import { Alert, Badge, Button, Card, Icon } from "../../components/ui";
import { assessmentSummary, sampleAssessment } from "./data";
import {
  CurriculumAction,
  ErrorAnalysis,
  SkillGroup,
} from "./AssessmentDetails";

interface ExamIntelligenceViewProps {
  onNavigate: (tab: string) => void;
  onOpenBadges?: () => void;
}

function AssessmentOverview() {
  const summary = assessmentSummary(sampleAssessment);
  return (
    <div className="grid items-stretch gap-5 lg:grid-cols-5">
      <Card className="p-5 sm:p-6 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Điểm bài thi mẫu</h2>
          <Badge>
            {sampleAssessment.durationMinutes} phút ·{" "}
            {sampleAssessment.questionCount} câu
          </Badge>
        </div>
        <div className="my-6 flex items-baseline gap-2">
          <span className="text-5xl font-bold tracking-tight text-primary">
            {sampleAssessment.score}
          </span>
          <span className="text-xl text-on-surface-variant">
            /{sampleAssessment.maximumScore}
          </span>
        </div>
        <progress
          className="ui-progress w-full accent-primary"
          value={sampleAssessment.score}
          max={sampleAssessment.maximumScore}
          aria-label="Điểm bài thi mẫu"
        />
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt>Điểm mất ở các lỗi đã phân tích</dt>
            <dd className="font-bold text-secondary">
              {summary.recoverablePoints}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Nếu sửa được các lỗi này</dt>
            <dd className="font-bold text-primary">
              {summary.reviewedScore}/{sampleAssessment.maximumScore}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Mục tiêu ôn tập</dt>
            <dd className="font-semibold">
              {sampleAssessment.targetScore}/{sampleAssessment.maximumScore}
            </dd>
          </div>
        </dl>
      </Card>
      <Card className="space-y-5 p-5 sm:p-6 lg:col-span-3">
        <div>
          <h2 className="font-semibold">Phân bổ thời gian</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Quan sát nhịp làm bài để dành đủ thời gian kiểm tra và hoàn thành
            câu cuối.
          </p>
        </div>
        <div
          className="flex h-3 gap-1 overflow-hidden rounded-full"
          aria-hidden="true"
        >
          {sampleAssessment.timeline.map((segment) => (
            <div
              key={segment.from}
              className="bg-primary"
              style={{
                flex: segment.to - segment.from,
                opacity:
                  (segment.to - segment.from) /
                    sampleAssessment.durationMinutes +
                  0.45,
              }}
            />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {sampleAssessment.timeline.map((segment) => (
            <section
              key={segment.from}
              className="rounded-xl bg-surface-container-low p-4"
            >
              <Badge tone={segment.tone}>
                {segment.from}–{segment.to} phút
              </Badge>
              <h3 className="mt-3 font-semibold">{segment.label}</h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {segment.description}
              </p>
            </section>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StudyPlan({ onNavigate }: ExamIntelligenceViewProps) {
  const summary = assessmentSummary(sampleAssessment);
  return (
    <Card id="tutor-action" className="scroll-mt-24 space-y-6 p-5 sm:p-6">
      <div>
        <Badge tone="success">Lộ trình tham khảo</Badge>
        <h2 className="mt-4 text-xl font-bold text-primary">
          Kế hoạch củng cố trong {summary.planDays} ngày
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Ôn đúng nội dung còn thiếu, sau đó tự kiểm tra lại kết quả.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sampleAssessment.plan.map((step) => (
          <section
            key={step.fromDay}
            className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-4"
          >
            <p className="text-sm font-semibold text-secondary">
              Ngày {step.fromDay}
              {step.toDay !== step.fromDay ? `–${step.toDay}` : ""}
            </p>
            <h3 className="font-semibold">{step.title}</h3>
            <p className="flex-1 text-sm leading-7 text-on-surface-variant">
              <RichMathText text={step.description} />
            </p>
            <p className="text-xs text-on-surface-variant">
              {step.minutesPerDay} phút/ngày
            </p>
            <CurriculumAction
              lessonId={step.lessonId}
              onNavigate={onNavigate}
            />
          </section>
        ))}
      </div>
    </Card>
  );
}

export function ExamIntelligenceView({
  onNavigate,
  onOpenBadges,
}: ExamIntelligenceViewProps) {
  const summary = assessmentSummary(sampleAssessment);
  const showPlan = () => {
    const section = document.getElementById("tutor-action");
    section?.scrollIntoView({ behavior: "smooth" });
    section?.setAttribute("tabindex", "-1");
    section?.focus({ preventScroll: true });
  };
  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{sampleAssessment.course}</Badge>
            <Badge>Bài thi mẫu #{sampleAssessment.id}</Badge>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Phân tích kết quả học tập
          </h1>
          <p className="mt-3 text-sm text-on-surface-variant">
            {sampleAssessment.title} · Nhận diện lỗi và lên kế hoạch ôn tập.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onOpenBadges && (
            <Button
              variant="secondary"
              onClick={onOpenBadges}
              className="font-semibold text-secondary"
            >
              <Icon name="military_tech" />
              Huy hiệu mốc
            </Button>
          )}
          <Button variant="secondary" onClick={() => window.print()}>
            <Icon name="print" />
            In / Lưu PDF
          </Button>
          <Button onClick={showPlan}>
            <Icon name="arrow_downward" />
            Lộ trình {summary.planDays} ngày
          </Button>
        </div>
      </header>
      <Alert tone="info">
        Báo cáo minh họa từ dữ liệu bài thi mẫu. Các chỉ số bên dưới chưa được
        tính từ hoạt động học thực tế của bạn.
      </Alert>
      <AssessmentOverview />
      <ErrorAnalysis onNavigate={onNavigate} />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <SkillGroup
          title="Nội dung đã vững"
          description="Duy trì độ chính xác khi làm bài."
          skills={summary.masteredSkills}
          onNavigate={onNavigate}
          isMastered
        />
        <SkillGroup
          title="Nội dung cần củng cố"
          description="Ưu tiên ôn lại kiến thức trước khi luyện thêm đề."
          skills={summary.developingSkills}
          onNavigate={onNavigate}
        />
      </div>
      <StudyPlan onNavigate={onNavigate} />
    </div>
  );
}
