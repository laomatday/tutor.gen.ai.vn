import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdaptiveText } from "../../components/AdaptiveText";
import { LessonContentRenderer } from "../../components/LessonContentRenderer";
import { RichMathText } from "../../components/MathLatex";
import { Alert, Badge, Button, Card, Field, Icon, Input, Progress, Select, Tabs, Textarea } from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import { getPracticeProblems } from "../practice/data";
import { verifyPracticeAnswer } from "../practice/domain";
import { SketchPad, GraphStudy, AlgebraTiles } from "../practice/StudyTools";
import { useTutorAuth } from "./TutorAuthContext";
import {
  pilotRead, pilotRpc, pilotWrite, readStudioPayload,
  type PilotCompletion, type PilotEnrollment, type PilotQuizAttempt,
  type PilotQuizResult, type PilotRewardEvent, type PilotSkill,
  type PilotSkillEvidence, type PilotStudioPayload, type PilotStudioEvent,
} from "./pilotApi";
import "../../styles/student-studio.css";

interface StudentPilotData {
  enrollments: PilotEnrollment[];
  completions: PilotCompletion[];
  attempts: PilotQuizAttempt[];
  ledger: PilotRewardEvent[];
  skills: PilotSkill[];
  evidence: PilotSkillEvidence[];
  assignments: Array<{
    id: string; title: string; lesson_id: string;
    due_at: string | null; teacher_name: string; completed: boolean;
  }>;
  snapshots: Array<{
    learner_id: string; problem_id: string;
    payload: unknown; updated_at: string;
  }>;
}
type StudentTab = "lesson" | "studio" | "replay" | "skills";
type StudioTool = "formulas" | "sketch" | "graph" | "tiles";

export function PilotStudentView() {
  const { profile, userId, getAccessToken } = useTutorAuth();
  const { lessons, subjects, topics, contentSource, contentLoading } = useCurriculum();
  const [data, setData] = useState<StudentPilotData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<StudentTab>("lesson");
  const [lessonId, setLessonId] = useState("");
  const [problemId, setProblemId] = useState("");
  const [answers, setAnswers] = useState<Record<string,number>>({});
  const [quizResult, setQuizResult] = useState<PilotQuizResult | null>(null);
  const [studio, setStudio] = useState<PilotStudioPayload>(() => readStudioPayload(null));
  const [dirty, setDirty] = useState(false);
  const [tool, setTool] = useState<StudioTool>("formulas");
  const [notice, setNotice] = useState("");

  const reload = useCallback(async () => {
    if (!userId) return;
    const token = await getAccessToken();
    const [
      enrollments, completions, attempts, ledger,
      skills, evidence, assignments, snapshots,
    ] = await Promise.all([
      pilotRead<PilotEnrollment[]>("tutor_enrollments?select=learner_id,grade_id,subject_id,active&active=eq.true",token),
      pilotRead<PilotCompletion[]>("tutor_lesson_completions?select=learner_id,lesson_id,completed_at",token),
      pilotRead<PilotQuizAttempt[]>("tutor_quiz_attempts?select=id,learner_id,lesson_id,correct_count,question_count,submitted_at&order=submitted_at.desc&limit=150",token),
      pilotRead<PilotRewardEvent[]>("tutor_reward_ledger?select=id,amount,source,source_id,created_at",token),
      pilotRead<PilotSkill[]>("tutor_skills?select=id,label,description,grade_id,subject_id&status=eq.published",token),
      pilotRead<PilotSkillEvidence[]>("tutor_skill_evidence?select=learner_id,skill_id,lesson_id,created_at",token),
      pilotRpc<StudentPilotData["assignments"]>("tutor_my_assignments", token, {}),
      pilotRead<StudentPilotData["snapshots"]>("tutor_studio_snapshots?select=learner_id,problem_id,payload,updated_at",token),
    ]);
    setData({enrollments,completions,attempts,ledger,skills,evidence,assignments,snapshots});
    setLoadError("");
  }, [getAccessToken,userId]);

  useEffect(() => {
    let live = true;
    setLoadError("");
    void reload().catch(error => {
      if (live) setLoadError(error instanceof Error ? error.message : "Không tải được dữ liệu học tập.");
    });
    return () => { live = false; };
  }, [reload]);

  const availableLessons = useMemo(() => lessons
    .filter(lesson => lesson.status === "published" && data?.enrollments.some(e =>
      e.active && e.grade_id === lesson.gradeId && e.subject_id === lesson.subjectId &&
      topics.some(t => t.id === lesson.topicId && t.subjectId === lesson.subjectId && t.gradeId === lesson.gradeId)))
    .sort((a,b) => a.order - b.order),[lessons,data?.enrollments,topics]);
  const activeLesson = availableLessons.find(l => l.id === lessonId) ?? availableLessons[0];
  const completed = new Set(data?.completions.map(row => row.lesson_id) ?? []);
  const nextLesson = availableLessons.find(l => !completed.has(l.id));
  const gpBalance = data?.ledger.reduce((total,row)=> total + row.amount,0) ?? 0;
  const availableProblems = useMemo(() => getPracticeProblems().filter(p =>
    data?.enrollments.some(e => e.active && e.grade_id === p.gradeId && e.subject_id === p.subjectId)),
  [data?.enrollments]);
  const problem = availableProblems.find(p => p.id === problemId) ?? availableProblems[0];
  const storedSnapshot = data?.snapshots.find(s => s.problem_id === problem?.id);
  const selectedTopic = topics.find(t => t.id === activeLesson?.topicId);
  const skillCount = new Set(data?.evidence.map(e => e.skill_id) ?? []).size;

  useEffect(() => {
    setStudio(readStudioPayload(storedSnapshot?.payload));
    setDirty(false);
    setNotice("");
  },[problem?.id,storedSnapshot?.updated_at]);

  const modifyStudio = (change: (current: PilotStudioPayload) => PilotStudioPayload) => {
    setStudio(current => change(current));
    setDirty(true);
  };

  const saveStudio = async (payload: PilotStudioPayload) => {
    if (!userId || !problem) return;
    setBusy(true);
    try {
      const token = await getAccessToken();
      await pilotWrite<unknown>(
        "tutor_studio_snapshots?on_conflict=learner_id,problem_id",
        token,
        [{learner_id:userId,problem_id:problem.id,payload,updated_at:new Date().toISOString()}],
        "POST",
        "resolution=merge-duplicates,return=representation",
      );
      setDirty(false);
      setNotice("Đã đồng bộ bản nháp và lịch sử thao tác lên tài khoản.");
      await reload();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Chưa lưu được bài làm.");
    } finally {
      setBusy(false);
    }
  };

  const checkStudio = async () => {
    if (!problem || !studio.input.trim()) return;
    const result = verifyPracticeAnswer(studio.input,problem);
    const event: PilotStudioEvent = {
      id: crypto.randomUUID(), kind:"check", at:Date.now(),
      detail:result.message, input:studio.input, valid:result.valid,
    };
    const next={...studio, events:[...studio.events,event].slice(-100)};
    setStudio(next);
    setNotice(result.valid
      ? "Phép tính khớp với bộ kiểm tra của bài mẫu. Chưa phải điểm đánh giá năng lực."
      : "Đã ghi nhận lần thử và phản hồi. Em có thể điều chỉnh bài làm.");
    await saveStudio(next);
  };

  const openHint = async (id:number) => {
    if (!problem) return;
    if (studio.openedHints.includes(id)) return;
    const hint=problem.hints.find(h=>h.id===id);
    if (!hint) return;
    const next: PilotStudioPayload={
      ...studio,
      openedHints:[...studio.openedHints,id],
      events:[...studio.events,{
        id:crypto.randomUUID(),kind:"hint",at:Date.now(),
        detail:"Mở gợi ý "+id+": "+hint.title,
      }].slice(-100),
    };
    setStudio(next);
    await saveStudio(next);
  };

  const submitQuiz = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeLesson || !activeLesson.exercises.every(ex => answers[ex.id] !== undefined)) {
      setLoadError("Hãy chọn đáp án cho tất cả câu hỏi trước khi kiểm tra.");
      return;
    }
    setBusy(true);
    try {
      const token=await getAccessToken();
      const result=await pilotRpc<PilotQuizResult>("tutor_submit_lesson_quiz",token,{
        p_lesson_id:activeLesson.id,p_answers:answers,
      });
      setQuizResult(result);
      setLoadError("");
      await reload();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Chưa kiểm tra được bài.");
    } finally {
      setBusy(false);
    }
  };

  if (contentLoading || !data) return (
    <Card className="p-6" role="status">
      {loadError ? <Alert tone="danger">{loadError}</Alert> : "Đang tải dữ liệu học tập từ máy chủ…"}
    </Card>
  );
  if (contentSource !== "database") return (
    <Alert tone="warning">
      Không tải được học liệu đã xuất bản từ máy chủ. Không thể kiểm tra hoặc xác nhận bài học bằng dữ liệu dự phòng.
    </Alert>
  );

  const tabs = [
    {id:"lesson",label:"Bài học",icon:"menu_book"},
    {id:"studio",label:"Tự giải",icon:"edit_square"},
    {id:"replay",label:"Xem lại",icon:"history"},
    {id:"skills",label:"Kết quả học",icon:"bar_chart"},
  ] as const;

  return (
    <div className="pilot-student space-y-5">
      <header className="pilot-hero">
        <p className="text-sm font-semibold text-accent-strong">Hành trình học tập có tài khoản</p>
        <h1 className="text-2xl font-bold text-brand sm:text-3xl">
          Chào {profile?.display_name ?? "em"}, bắt đầu từ một bước nhỏ.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
          Bài làm và kết quả kiểm tra đã xác nhận được lưu riêng cho em. Hệ thống không suy ra “thành thạo” chỉ từ một bài kiểm tra.
        </p>
        <div className="pilot-metrics">
          <div><strong>{data.completions.length}/{availableLessons.length}</strong><span>Bài đã đạt</span></div>
          <div><strong>{data.attempts.length}</strong><span>Lượt kiểm tra trên máy chủ</span></div>
          <div><strong>{gpBalance} GP</strong><span>Điểm được xác nhận</span></div>
        </div>
        {nextLesson && (
          <Button onClick={() => {setLessonId(nextLesson.id);setAnswers({});setQuizResult(null);setTab("lesson");}}>
            <Icon name="arrow_forward"/> Tiếp tục: {nextLesson.title}
          </Button>
        )}
      </header>
      {loadError && <Alert tone="danger">{loadError}</Alert>}
      {data.assignments.length>0 && (
        <Card className="p-4 sm:p-5">
          <h2 className="mb-3 font-bold text-brand">Bài giáo viên giao</h2>
          <div className="space-y-2">
            {data.assignments.slice(0,5).map(item=><div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-3 last:border-0" key={item.id}>
              <div className="min-w-0">
                <strong className="block text-sm">{item.title}</strong>
                <p className="text-xs text-ink-600">GV {item.teacher_name}{item.due_at?" · Hạn: "+new Date(item.due_at).toLocaleDateString("vi-VN"):""}</p>
              </div>
              <Button size="sm" variant={item.completed?"secondary":"primary"} onClick={()=>{
                setLessonId(item.lesson_id);setAnswers({});setQuizResult(null);setTab("lesson");
              }}>{item.completed?"Xem lại":"Học bài này"}</Button>
            </div>)}
          </div>
        </Card>
      )}
      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Không gian học tập có tài khoản" variant="pill" className="pilot-tabs"/>
      {tab==="lesson" && (
        <div className="pilot-study-layout">
          <section className="space-y-4 min-w-0" aria-label="Bài học hiện tại">
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-ink-600">Lộ trình lớp {profile?.grade_id} · {selectedTopic?.title??"Chủ đề"}</p>
                  <h2 className="mt-1 text-xl font-bold text-brand">{activeLesson?.title??"Chưa có bài học được duyệt"}</h2>
                </div>
                {activeLesson && <Badge tone={completed.has(activeLesson.id)?"success":"neutral"}>
                  {completed.has(activeLesson.id)?"Đã hoàn thành":"Chưa hoàn thành"}
                </Badge>}
              </div>
              {activeLesson && <p className="mt-2 text-sm text-ink-600">{activeLesson.summary}</p>}
              <Field label="Chọn bài học đã xuất bản" className="mt-4">
                <Select className="ui-field w-full" value={activeLesson?.id??""} onChange={event=>{
                  setLessonId(event.target.value);setAnswers({});setQuizResult(null);
                }}>
                  {availableLessons.map(lesson=><option key={lesson.id} value={lesson.id}>
                    {subjects.find(s=>s.id===lesson.subjectId)?.name} · {lesson.title}
                  </option>)}
                </Select>
              </Field>
            </Card>
            {activeLesson && (
              <>
                <Card className="p-5 sm:p-7">
                  <h2 className="text-lg font-bold text-brand mb-4">Khám phá kiến thức</h2>
                  {activeLesson.contentBlocks?.length
                    ? <LessonContentRenderer blocks={activeLesson.contentBlocks}/>
                    : <div className="space-y-4">{activeLesson.theory.map((part,index)=><div key={index}>
                        <h3 className="font-semibold">{part.heading}</h3>
                        <p className="text-sm leading-7"><AdaptiveText text={part.text}/></p>
                      </div>)}</div>}
                </Card>
                {activeLesson.examples.length>0 && <Card className="p-5">
                  <h2 className="text-lg font-bold text-brand">Ví dụ có hướng dẫn</h2>
                  {activeLesson.examples.map((example,index)=><details key={index} className="mt-3 rounded-xl border border-ink-200 p-4">
                    <summary className="cursor-pointer font-semibold">{example.title} · Mở cách giải</summary>
                    <div className="mt-3 space-y-2 text-sm leading-7">
                      <p><AdaptiveText text={example.prompt}/></p>
                      <ol className="list-decimal pl-5">{example.steps.map((step,i)=><li key={i}><AdaptiveText text={step}/></li>)}</ol>
                      <p className="font-semibold"><AdaptiveText text={example.answer}/></p>
                    </div>
                  </details>)}
                </Card>}
                <Card className="p-5 sm:p-7">
                  <h2 className="text-lg font-bold text-brand">Tự kiểm tra bài học</h2>
                  <p className="mt-1 text-xs text-ink-600">Đáp án được kiểm tra trên máy chủ. Chỉ tất cả câu đúng mới ghi nhận hoàn thành bài.</p>
                  <form onSubmit={submitQuiz} className="mt-4 space-y-5">
                    {activeLesson.exercises.map((exercise,index)=><fieldset key={exercise.id} className="space-y-3">
                      <legend className="mb-2 font-semibold text-sm">Câu {index+1}. <AdaptiveText text={exercise.prompt}/></legend>
                      {exercise.options.map((option,i)=><label key={i} className="pilot-radio-row">
                        <Input type="radio" name={"quiz-"+exercise.id} value={i}
                          checked={answers[exercise.id]===i}
                          onChange={() => {setAnswers(cur=>({...cur,[exercise.id]:i}));setQuizResult(null);}}
                          aria-label={"Câu "+(index+1)+", phương án "+String.fromCharCode(65+i)+": "+option}/>
                        <span className="min-w-0"><strong className="mr-2">{String.fromCharCode(65+i)}.</strong><AdaptiveText text={option}/></span>
                      </label>)}
                    </fieldset>)}
                    <Button type="submit" disabled={busy||!activeLesson.exercises.length||!activeLesson.exercises.every(ex=>answers[ex.id]!==undefined)}>
                      <Icon name="fact_check"/> {busy?"Đang kiểm tra…":"Kiểm tra trên máy chủ"}
                    </Button>
                  </form>
                  {quizResult && <Alert className="mt-4" tone={quizResult.completed?"success":"info"}>
                    <strong>{quizResult.correct}/{quizResult.total} câu đúng.</strong>{" "}
                    {quizResult.completed
                      ? quizResult.newlyCompleted
                        ? "Đã ghi nhận hoàn thành"+(quizResult.awardedGp>0?" và cộng "+quizResult.awardedGp+" GP.":".")
                        : "Bài này đã hoàn thành trước đó, không cộng GP lại."
                      : "Em có thể xem lại lý thuyết và thử tiếp. Không ghi nhận hoàn thành khi còn câu sai."}
                  </Alert>}
                </Card>
              </>
            )}
          </section>
          <aside className="space-y-4" aria-label="Lộ trình đang học">
            <Card className="p-5">
              <h2 className="font-bold text-brand">Lộ trình của em</h2>
              <Progress value={availableLessons.filter(l=>completed.has(l.id)).length} max={Math.max(1,availableLessons.length)}
                label="Bài đã hoàn thành trên máy chủ" className="mt-3"/>
              <div className="mt-4 space-y-2">
                {availableLessons.map(lesson=><Button variant="surface" key={lesson.id} type="button"
                  className="pilot-lesson-row" aria-current={lesson.id===activeLesson?.id?"step":undefined}
                  onClick={()=>{setLessonId(lesson.id);setAnswers({});setQuizResult(null);}}>
                  <Icon name={completed.has(lesson.id)?"check_circle":"menu_book"}/>
                  <span>{lesson.title}</span>
                </Button>)}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-bold text-brand">Góc tự giải</h2>
              <p className="my-3 text-sm text-ink-600">Thử trình bày cách giải, kiểm tra theo quy tắc và xem lại những lần điều chỉnh.</p>
              <Button variant="secondary" className="w-full" onClick={()=>setTab("studio")}>Mở bàn tự giải <Icon name="arrow_forward"/></Button>
            </Card>
          </aside>
        </div>
      )}
      {tab==="studio" && (
        <section className="space-y-4 min-w-0" aria-label="Bàn tự giải đồng bộ">
          <Card className="p-5">
            <h2 className="text-xl font-bold text-brand">Focus Studio — luyện tập có lưu</h2>
            <p className="mt-1 text-sm text-ink-600">Bản nháp được đồng bộ lên tài khoản. Kết quả kiểm tra của hai bài mẫu chỉ mang tính hỗ trợ, chưa xác nhận năng lực.</p>
            <Field label="Chọn dạng toán" className="mt-4">
              <Select className="ui-field w-full" value={problem?.id??""} onChange={e=>{setProblemId(e.target.value);setTool("formulas");}}>
                {availableProblems.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
              </Select>
            </Field>
          </Card>
          {problem ? <div className="pilot-study-layout">
            <div className="space-y-4 min-w-0">
              <Card className="p-5 sm:p-7">
                <p className="text-xs text-accent-strong">{problem.course}</p>
                <h3 className="mt-2 text-lg font-bold"><RichMathText text={problem.statement}/></h3>
                <Field label="Trình bày phép biến đổi từng bước" className="mt-4" hint="Kết luận bằng nghiệm/hệ số. Bài làm chưa lưu sẽ được đánh dấu.">
                  <Textarea rows={7} value={studio.input} maxLength={4000} onChange={event=>{
                    modifyStudio(cur=>({...cur,input:event.target.value}));
                  }} placeholder="Em thử bắt đầu bằng điều mình biết…"/>
                </Field>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={checkStudio} disabled={busy||!studio.input.trim()}>
                    <Icon name="fact_check"/> Kiểm tra bước giải
                  </Button>
                  <Button variant="secondary" disabled={busy||!dirty} onClick={()=>void saveStudio(studio)}>
                    <Icon name="save"/> {dirty?"Lưu bản nháp":"Đã lưu"}
                  </Button>
                  <Button variant="ghost" onClick={()=>setTab("replay")}>
                    <Icon name="history"/> Xem lịch sử
                  </Button>
                </div>
                {notice && <Alert tone="info" className="mt-4">{notice}</Alert>}
              </Card>
              <Card className="p-5">
                <Tabs tabs={[
                  {id:"formulas",label:"Công thức"},{id:"sketch",label:"Phác thảo"},
                  {id:"graph",label:"Đồ thị"},{id:"tiles",label:"Ghép hình"},
                ] as const} value={tool} onChange={setTool} label="Công cụ tự giải" variant="pill" className="pilot-tool-tabs"/>
                {tool==="formulas" && <p className="mt-4 text-sm">Gợi ý cách viết: <code>x^2</code>, <code>(x-2)(x-3)=0</code>, <code>x=2</code>.</p>}
                {tool==="sketch" && <div className="mt-4">
                  <SketchPad strokes={studio.sketch} onChange={sketch=>modifyStudio(cur=>({...cur,sketch}))}/>
                  <p className="text-xs text-ink-600">Nhấn “Lưu bản nháp” để đồng bộ nét vẽ. Nét vẽ không được chấm tự động.</p>
                </div>}
                {tool==="graph" && <div className="mt-4"><GraphStudy problem={problem} unlocked={studio.openedHints.length===problem.hints.length||studio.events.some(e=>e.valid)}/></div>}
                {tool==="tiles" && <div className="mt-4"><AlgebraTiles problem={problem}/></div>}
              </Card>
            </div>
            <aside className="space-y-3" aria-label="Gợi ý từng bước">
              <Card className="p-5">
                <h3 className="font-bold text-brand">Câu hỏi gợi mở</h3>
                <p className="mt-1 text-sm text-ink-600">Đọc từng gợi ý khi cần, không trừ GP chỉ vì em xin trợ giúp.</p>
                {problem.hints.map(hint=><div key={hint.id} className="mt-3 rounded-xl border border-ink-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm">{hint.id}. {hint.title}</strong>
                    <Button size="sm" variant="secondary" disabled={busy||studio.openedHints.includes(hint.id)}
                      onClick={()=>void openHint(hint.id)}>
                      {studio.openedHints.includes(hint.id)?"Đã mở":"Mở gợi ý"}
                    </Button>
                  </div>
                  {studio.openedHints.includes(hint.id)&&<p className="mt-2 text-sm leading-7"><RichMathText text={hint.text}/></p>}
                </div>)}
              </Card>
            </aside>
          </div> : <Alert tone="info">Môn học đã đăng ký chưa có dạng bài Focus Studio được duyệt.</Alert>}
        </section>
      )}
      {tab==="replay" && <section className="pilot-study-layout">
        <Card className="p-5 sm:p-7">
          <h2 className="text-lg font-bold text-brand">Thinking Replay — lịch sử thao tác đã lưu</h2>
          <p className="mt-2 text-sm text-ink-600">Chỉ phát lại các lần mở gợi ý và kiểm tra đã được ghi trong bản nháp. Không suy đoán toàn bộ quá trình suy nghĩ của học sinh.</p>
          <div className="mt-4 space-y-3">
            {studio.events.length ? studio.events.map((event,index)=><div className="pilot-event" key={event.id}>
              <span className="text-xs font-semibold text-accent-strong">{index+1}. {event.kind==="check"?"Kiểm tra bước":"Mở gợi ý"}</span>
              <time className="text-xs text-ink-600">{new Date(event.at).toLocaleString("vi-VN")}</time>
              <p className="mt-2 text-sm">{event.detail}</p>
              {event.input && <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-ink-50 p-3 text-sm">{event.input}</pre>}
            </div>) : <p className="py-6 text-sm text-ink-600">Chưa có lần kiểm tra hay gợi ý được lưu. Mở Focus Studio để bắt đầu.</p>}
          </div>
          <Button variant="secondary" className="mt-4" onClick={()=>setTab("studio")}>Quay lại tự giải</Button>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-brand">Chọn bài để xem lịch sử</h3>
          <div className="mt-3 space-y-2">
            {availableProblems.map(p=><Button variant="surface" type="button" key={p.id} className="pilot-lesson-row" aria-current={p.id===problem?.id?"step":undefined}
              onClick={()=>setProblemId(p.id)}>{p.title}</Button>)}
          </div>
        </Card>
      </section>}
      {tab==="skills" && <section className="space-y-4">
        <Card className="p-5 sm:p-7">
          <h2 className="text-lg font-bold text-brand">Những kỹ năng đã có hoạt động học</h2>
          <p className="mt-2 text-sm text-ink-600">
            {skillCount} kỹ năng có bài trắc nghiệm đã hoàn thành. Đây là kết quả hoạt động, chưa phải thang đo thành thạo hay dự đoán điểm thi.
          </p>
          <div className="pilot-skills-grid mt-5">
            {data.skills.filter(s=>data.enrollments.some(e=>e.grade_id===s.grade_id&&e.subject_id===s.subject_id)).map(skill=>{
              const evidence=data.evidence.filter(e=>e.skill_id===skill.id);
              return <Card key={skill.id} className="p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="font-semibold">{skill.label}</h3>
                  <Badge tone={evidence.length?"success":"neutral"}>{evidence.length?"Đã có kết quả":"Chưa có kết quả"}</Badge>
                </div>
                <p className="mt-2 text-sm text-ink-600">{skill.description}</p>
                <p className="mt-2 text-xs text-ink-600">{evidence.length} bài đã đạt liên quan đến kỹ năng</p>
              </Card>;
            })}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-brand">Lịch sử kiểm tra gần đây</h2>
          <div className="mt-3 space-y-2">{data.attempts.slice(0,12).map(a=><div key={a.id} className="flex flex-wrap justify-between gap-3 border-b border-ink-100 py-2 text-sm">
            <span>{lessons.find(l=>l.id===a.lesson_id)?.title??"Bài học"}</span>
            <span>{a.correct_count}/{a.question_count} · {new Date(a.submitted_at).toLocaleDateString("vi-VN")}</span>
          </div>)}</div>
          {!data.attempts.length && <p className="mt-3 text-sm text-ink-600">Chưa có lượt kiểm tra trên máy chủ.</p>}
        </Card>
      </section>}
    </div>
  );
}
