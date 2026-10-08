import { useEffect, useState } from "react";
import { Alert, Button, Card } from "../../components/ui";
import { useTutorAuth } from "./TutorAuthContext";
import { pilotRpc } from "./pilotApi";

interface PilotOverview {
  learners: number;
  teachers: number;
  enrollments: number;
  quizAttempts: number;
  completedLessons: number;
  studioDrafts: number;
  publishedLessons: number;
}
export function PilotAdminView() {
  const {getAccessToken,profile}=useTutorAuth();
  const [overview,setOverview]=useState<PilotOverview|null>(null);
  const [error,setError]=useState("");
  useEffect(()=>{
    let live=true;
    getAccessToken().then(token=>pilotRpc<PilotOverview>("tutor_admin_pilot_overview",token,{}))
      .then(value=>{if(live)setOverview(value);})
      .catch(e=>{if(live)setError(e instanceof Error?e.message:"Không tải được báo cáo.");});
    return()=>{live=false;};
  },[getAccessToken]);
  return <div className="space-y-5">
    <header className="pilot-hero">
      <p className="text-sm font-semibold text-accent-strong">Quản trị thử nghiệm · Chỉ dữ liệu thật</p>
      <h1 className="text-2xl font-bold text-brand sm:text-3xl">Chất lượng từ mỗi bài học.</h1>
      <p className="mt-2 text-sm text-ink-600">Tài khoản: {profile?.display_name}. Chỉ người dùng được cấp vai trò quản trị Tutor mới được xem thống kê phía máy chủ.</p>
    </header>
    {error&&<Alert tone="danger">{error}</Alert>}
    {overview?<div className="pilot-skills-grid">
      {[
        ["Học sinh đủ điều kiện",overview.learners],["Giáo viên",overview.teachers],
        ["Đăng ký môn",overview.enrollments],["Lượt kiểm tra",overview.quizAttempts],
        ["Bài hoàn thành",overview.completedLessons],["Bản nháp tự giải",overview.studioDrafts],
        ["Bài đã xuất bản",overview.publishedLessons],
      ].map(([label,count])=><Card key={String(label)} className="p-5">
        <p className="text-sm text-ink-600">{label}</p>
        <strong className="mt-2 block text-3xl text-brand">{count}</strong>
      </Card>)}
    </div>:<Card role="status" className="p-5">Đang tải số liệu từ cơ sở dữ liệu…</Card>}
    <Card className="p-5">
      <h2 className="font-bold text-brand">Quy trình kiểm duyệt và cấp tài khoản</h2>
      <p className="mt-2 text-sm leading-7 text-ink-600">
        Trong giai đoạn pilot, tài khoản, sự đồng ý tham gia và liên kết giáo viên–học sinh được cấp qua quy trình quản trị kiểm soát tại Supabase. Không cho phép học sinh tự cấp quyền, và giao diện này không giả lập thao tác xuất bản hay tạo tài khoản.
      </p>
      <p className="mt-3 text-sm leading-7 text-ink-600">
        Điều kiện phát hành: nội dung được giáo viên duyệt, bài kiểm tra máy chủ đạt QA, báo cáo học sinh/giáo viên đúng dữ liệu, và kiểm tra quyền truy cập dưới nhiều tài khoản.
      </p>
      <Button className="mt-4" variant="secondary" onClick={()=>window.location.reload()}>Tải lại số liệu</Button>
    </Card>
  </div>;
}
