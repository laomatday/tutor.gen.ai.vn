import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Alert, Badge, Button, Card, Field, Icon, Input, Select } from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import { useTutorAuth } from "./TutorAuthContext";
import {
  pilotRead, pilotRpc, readStudioPayload,
  type PilotAssignment, type PilotAssignmentTarget, type PilotCompletion,
  type PilotEnrollment, type PilotProfile, type PilotQuizAttempt,
  type PilotTeacherLink,
} from "./pilotApi";

interface TeacherData {
  links: PilotTeacherLink[];
  learners: PilotProfile[];
  enrollments: PilotEnrollment[];
  completions: PilotCompletion[];
  attempts: PilotQuizAttempt[];
  assignments: PilotAssignment[];
  targets: PilotAssignmentTarget[];
  snapshots: Array<{learner_id:string;problem_id:string;payload:unknown;updated_at:string}>;
}

export function PilotTeacherView() {
  const { getAccessToken, userId, profile } = useTutorAuth();
  const { lessons, subjects, contentSource } = useCurriculum();
  const [data,setData]=useState<TeacherData|null>(null);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);
  const [selected,setSelected]=useState<string[]>([]);
  const [title,setTitle]=useState("");
  const [lessonId,setLessonId]=useState("");
  const [due,setDue]=useState("");
  const [inspectLearner,setInspectLearner]=useState<string|null>(null);
  const reload=useCallback(async()=>{
    if(!userId) return;
    const token=await getAccessToken();
    const [links,learners,enrollments,completions,attempts,assignments,targets,snapshots]=await Promise.all([
      pilotRead<PilotTeacherLink[]>("tutor_teacher_links?select=teacher_id,learner_id,class_label",token),
      pilotRead<PilotProfile[]>("tutor_profiles?select=user_id,display_name,grade_id,role,consent_approved_at,active",token),
      pilotRead<PilotEnrollment[]>("tutor_enrollments?select=learner_id,grade_id,subject_id,active",token),
      pilotRead<PilotCompletion[]>("tutor_lesson_completions?select=learner_id,lesson_id,completed_at",token),
      pilotRead<PilotQuizAttempt[]>("tutor_quiz_attempts?select=id,learner_id,lesson_id,correct_count,question_count,submitted_at&order=submitted_at.desc&limit=300",token),
      pilotRead<PilotAssignment[]>("tutor_teacher_assignments?select=id,teacher_id,lesson_id,title,due_at,created_at&order=created_at.desc&limit=100",token),
      pilotRead<PilotAssignmentTarget[]>("tutor_assignment_targets?select=assignment_id,learner_id",token),
      pilotRead<TeacherData["snapshots"]>("tutor_studio_snapshots?select=learner_id,problem_id,payload,updated_at&order=updated_at.desc&limit=100",token),
    ]);
    setData({links,learners:learners.filter(p=>links.some(l=>l.learner_id===p.user_id)),
      enrollments,completions,attempts,assignments,targets,snapshots});
    setError("");
  },[userId,getAccessToken]);

  useEffect(()=>{
    let live=true;
    void reload().catch(e=>{if(live)setError(e instanceof Error?e.message:"Không đọc được dữ liệu lớp học.");});
    return()=>{live=false;};
  },[reload]);

  const published=useMemo(()=>lessons.filter(l=>l.status==="published"),[lessons]);
  const lesson=published.find(l=>l.id===lessonId)??published[0];
  const eligible=data?.learners.filter(p=>p.role==="student"&&p.active&&p.consent_approved_at &&
    data.enrollments.some(e=>e.learner_id===p.user_id&&e.active&&e.grade_id===lesson?.gradeId&&e.subject_id===lesson?.subjectId))??[];
  const grouped=data?.learners.map(p=>{
    const attempts=data.attempts.filter(x=>x.learner_id===p.user_id);
    const completions=data.completions.filter(x=>x.learner_id===p.user_id);
    const snapshots=data.snapshots.filter(x=>x.learner_id===p.user_id);
    return {profile:p,latest:attempts[0],attempts:attempts.length,completions:completions.length,
      notes:snapshots.reduce((total,s)=>total+readStudioPayload(s.payload).events.length,0),
      classLabel:data.links.find(l=>l.learner_id===p.user_id)?.class_label??""};
  })??[];
  const needReview=grouped.filter(p=>p.latest&&p.latest.correct_count<p.latest.question_count);

  const assign=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(!lesson||!title.trim()||selected.length===0){
      setError("Chọn bài học, tên bài giao và ít nhất một học sinh có quyền học.");
      return;
    }
    setBusy(true);
    try{
      const token=await getAccessToken();
      await pilotRpc<string>("tutor_assign_lesson",token,{
        p_lesson_id:lesson.id,
        p_title:title.trim(),
        p_learner_ids:selected,
        p_due_at:due?new Date(due+"T23:59:00+07:00").toISOString():null,
      });
      setNotice("Đã giao bài cho "+selected.length+" học sinh được liên kết; các em nhìn thấy bài giao khi đăng nhập.");
      setTitle("");setDue("");setSelected([]);setError("");
      await reload();
    }catch(e){setError(e instanceof Error?e.message:"Chưa giao được bài.");}
    finally{setBusy(false);}
  };

  return <div className="space-y-5 pilot-teacher">
    <header className="pilot-hero">
      <p className="text-sm font-semibold text-accent-strong">Không gian giáo viên · Dữ liệu đã phân quyền</p>
      <h1 className="text-2xl font-bold text-brand sm:text-3xl">Hỗ trợ học sinh đúng chỗ.</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-600">Xin chào {profile?.display_name}. Chỉ những học sinh được liên kết với tài khoản giáo viên mới xuất hiện dưới đây.</p>
      <div className="pilot-metrics">
        <div><strong>{grouped.length}</strong><span>Học sinh được cấp quyền</span></div>
        <div><strong>{needReview.length}</strong><span>Có lượt kiểm tra gần nhất chưa đạt</span></div>
        <div><strong>{data?.assignments.length??0}</strong><span>Bài đã giao</span></div>
      </div>
    </header>
    {error&&<Alert tone="danger">{error}</Alert>}
    {notice&&<Alert tone="success">{notice}</Alert>}
    {!data&&<Card className="p-6" role="status">Đang tải danh sách học sinh từ máy chủ…</Card>}
    {data&&<>
      <div className="pilot-study-layout">
        <section className="space-y-4 min-w-0">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-lg font-bold text-brand">Danh sách cần hỗ trợ</h2>
                <p className="mt-1 text-sm text-ink-600">Chỉ dùng bằng chứng từ bài kiểm tra đã lưu, không tự suy ra học sinh “yếu”.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={()=>void reload()}>Cập nhật</Button>
            </div>
            {needReview.length===0&&<p className="mt-4 text-sm text-ink-600">Chưa có lượt kiểm tra gần nhất chưa đạt của học sinh được liên kết.</p>}
            {needReview.map(row=><div key={row.profile.user_id} className="pilot-learner-row">
              <div className="min-w-0">
                <strong className="block">{row.profile.display_name}</strong>
                <p className="text-xs text-ink-600">{row.classLabel} · Bài gần nhất: {lessons.find(l=>l.id===row.latest?.lesson_id)?.title??"Bài học"}</p>
                <p className="text-xs">Đúng {row.latest?.correct_count}/{row.latest?.question_count} câu · {row.notes} thao tác tự giải đã lưu (chưa xác minh)</p>
              </div>
              <Button size="sm" variant="secondary" onClick={()=>setInspectLearner(row.profile.user_id)}>Xem chi tiết</Button>
            </div>)}
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-bold text-brand">Tất cả học sinh được liên kết</h2>
            {grouped.length===0?<p className="mt-3 text-sm text-ink-600">Chưa có học sinh được bộ phận quản trị liên kết. Không hiển thị hồ sơ mẫu.</p>:
              grouped.map(row=><div className="pilot-learner-row" key={row.profile.user_id}>
                <div>
                  <strong>{row.profile.display_name}</strong>
                  <p className="text-xs text-ink-600">{row.classLabel} · Lớp {row.profile.grade_id} · {row.completions} bài hoàn thành · {row.attempts} lượt kiểm tra</p>
                </div>
                <Button variant="ghost" size="sm" onClick={()=>setInspectLearner(row.profile.user_id)}>Nhật ký</Button>
              </div>)}
          </Card>
          {inspectLearner&&(()=>{
            const student=data.learners.find(p=>p.user_id===inspectLearner);
            const history=data.attempts.filter(a=>a.learner_id===inspectLearner);
            const notes=data.snapshots.filter(a=>a.learner_id===inspectLearner);
            return <Card className="p-5">
              <div className="flex justify-between gap-3">
                <h2 className="text-lg font-bold text-brand">{student?.display_name??"Nhật ký học"}</h2>
                <Button variant="ghost" size="sm" onClick={()=>setInspectLearner(null)}>Đóng</Button>
              </div>
              <h3 className="mt-3 font-semibold">Kiểm tra trên máy chủ</h3>
              {history.length?history.slice(0,12).map(a=><div className="pilot-learner-row" key={a.id}>
                <span className="text-sm">{lessons.find(l=>l.id===a.lesson_id)?.title??"Bài học"}</span>
                <Badge tone={a.correct_count===a.question_count?"success":"warning"}>{a.correct_count}/{a.question_count} câu</Badge>
              </div>):<p className="text-sm text-ink-600">Chưa có bài kiểm tra.</p>}
              <h3 className="mt-4 font-semibold">Bản nháp tự giải (chưa xác minh)</h3>
              {notes.length?notes.map(note=><details key={note.problem_id} className="mt-2 rounded-lg border border-ink-200 p-3">
                <summary className="cursor-pointer text-sm font-semibold">{note.problem_id} · {readStudioPayload(note.payload).events.length} sự kiện</summary>
                <ol className="mt-2 list-decimal pl-5 text-sm leading-6">
                  {readStudioPayload(note.payload).events.slice(-10).map(ev=><li key={ev.id}>{ev.detail}</li>)}
                </ol>
              </details>):<p className="text-sm text-ink-600">Chưa có nháp đồng bộ.</p>}
            </Card>;
          })()}
        </section>
        <aside className="space-y-4 min-w-0">
          <Card className="p-5">
            <h2 className="text-lg font-bold text-brand">Giao bài học đã xuất bản</h2>
            <p className="mt-1 text-sm text-ink-600">Giao cho học sinh thực sự có đăng ký và được liên kết với giáo viên. Không tạo hồ sơ giả.</p>
            {contentSource!=="database"?<Alert tone="warning" className="mt-3">Đang dùng nội dung dự phòng, không thể giao bài.</Alert>:
            <form className="mt-4 space-y-3" onSubmit={assign}>
              <Field label="Tên bài giao">
                <Input value={title} maxLength={180} onChange={e=>setTitle(e.target.value)} placeholder="Ôn tập phương trình bậc hai" required/>
              </Field>
              <Field label="Bài học">
                <Select className="ui-field w-full" value={lesson?.id??""} onChange={e=>{setLessonId(e.target.value);setSelected([]);}}>
                  {published.map(l=><option key={l.id} value={l.id}>
                    {subjects.find(s=>s.id===l.subjectId)?.name} {l.gradeId} · {l.title}
                  </option>)}
                </Select>
              </Field>
              <Field label="Hạn hoàn thành (tùy chọn)">
                <Input type="date" value={due} onChange={e=>setDue(e.target.value)}/>
              </Field>
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">Học sinh đủ điều kiện ({eligible.length})</legend>
                {eligible.length===0&&<p className="text-xs text-ink-600">Chưa có học sinh phù hợp môn/lớp của bài được chọn và đã chấp thuận tham gia.</p>}
                {eligible.map(p=><label key={p.user_id} className="pilot-radio-row">
                  <Input type="checkbox" checked={selected.includes(p.user_id)}
                    onChange={e=>setSelected(ids=>e.target.checked?[...ids,p.user_id]:ids.filter(id=>id!==p.user_id))}/>
                  <span>{p.display_name} · Lớp {p.grade_id}</span>
                </label>)}
              </fieldset>
              <Button type="submit" disabled={busy||!selected.length||!lesson||!title.trim()}>
                <Icon name="assignment"/> {busy?"Đang giao…":"Giao bài cho "+selected.length+" học sinh"}
              </Button>
            </form>}
          </Card>
          <Card className="p-5">
            <h2 className="font-bold text-brand">Bài đã giao</h2>
            {data.assignments.length?data.assignments.slice(0,10).map(a=><div className="mt-3 border-b border-ink-100 pb-2 text-sm" key={a.id}>
              <strong>{a.title}</strong>
              <p className="text-xs text-ink-600">
                {data.targets.filter(t=>t.assignment_id===a.id).length} học sinh · {a.due_at?new Date(a.due_at).toLocaleDateString("vi-VN"):"Chưa đặt hạn"}
              </p>
            </div>):<p className="mt-2 text-sm text-ink-600">Chưa có bài được giao trên máy chủ.</p>}
          </Card>
        </aside>
      </div>
    </>}
  </div>;
}
