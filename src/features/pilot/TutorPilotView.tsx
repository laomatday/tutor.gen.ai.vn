import { useState, type FormEvent } from "react";
import { Alert, Button, Card, Field, Icon, Input } from "../../components/ui";
import { appConfig } from "../../config/app";
import { useTutorAuth } from "./TutorAuthContext";
import { PilotStudentView } from "./PilotStudentView";
import { PilotTeacherView } from "./PilotTeacherView";
import { PilotAdminView } from "./PilotAdminView";
import "./pilot.css";

function PilotLogin() {
  const {signIn}=useTutorAuth();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    setLoading(true);setError("");
    try {await signIn(email,password);setPassword("");}
    catch(e){setError(e instanceof Error?e.message:"Không thể đăng nhập.");}
    finally{setLoading(false);}
  };
  return <div className="pilot-auth">
    <Card className="p-6 sm:p-8">
      <p className="text-sm font-semibold text-accent-strong">Không gian học tập có tài khoản</p>
      <h1 className="mt-2 text-2xl font-bold text-brand">Đăng nhập genAi Tutor Pilot</h1>
      <p className="mt-2 text-sm leading-6 text-ink-600">
        Không gian thử nghiệm với dữ liệu học tập được bảo vệ và đồng bộ giữa thiết bị. Chỉ tài khoản được điều phối viên cấp mới tham gia. Học sinh cần được chấp thuận phù hợp trước khi sử dụng.
      </p>
      {error&&<Alert tone="danger" className="my-4">{error}</Alert>}
      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Email đã được cấp quyền">
          <Input type="email" value={email} onChange={event=>setEmail(event.target.value)}
            autoComplete="username" required maxLength={254} placeholder="email@example.com"/>
        </Field>
        <Field label="Mật khẩu">
          <Input type="password" value={password} onChange={event=>setPassword(event.target.value)}
            autoComplete="current-password" required minLength={6}/>
        </Field>
        <Button type="submit" className="w-full justify-center" disabled={loading}>
          {loading?"Đang xác minh…":"Đăng nhập bảo mật"}
        </Button>
      </form>
      <p className="mt-4 text-xs text-ink-600">Không hỗ trợ tự tạo tài khoản; quyền truy cập và dữ liệu học tập được kiểm tra phía máy chủ.</p>
    </Card>
  </div>;
}

export function TutorPilotView() {
  const {status,profile,signOut}=useTutorAuth();
  return <div className="pilot-page min-h-screen bg-ink-50 text-ink-900">
    <header className="pilot-header">
      <a href="/" className="inline-flex items-center gap-3 font-bold text-brand" aria-label="Về bản trải nghiệm Tutor">
        <img src={appConfig.brand.logoUrl} width={36} height={36} alt="" />
        <span>{appConfig.brand.name}</span>
      </a>
      <nav className="flex items-center gap-3" aria-label="Điều hướng khu học thử">
        <a className="text-sm font-medium text-brand" href="/">Bản trải nghiệm</a>
        {(status==="ready"||status==="blocked")&&
          <Button size="sm" variant="secondary" onClick={()=>void signOut()}>Đăng xuất</Button>}
      </nav>
    </header>
    <main className="pilot-main">
      {status==="checking"&&<Card role="status" className="p-6">Đang kiểm tra phiên đăng nhập và quyền học tập…</Card>}
      {status==="anonymous"&&<PilotLogin/>}
      {status==="blocked"&&<Card className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-bold text-brand">Tài khoản chưa đủ điều kiện tham gia</h1>
        <p className="mt-3 text-sm leading-7">Tài khoản chưa được cấp vai trò Tutor, đã bị vô hiệu hóa hoặc chưa có xác nhận tham gia của học sinh. Vui lòng liên hệ điều phối viên để kiểm tra. Không có dữ liệu mẫu nào được thay thế cho hồ sơ của em.</p>
        <Button className="mt-4" onClick={()=>void signOut()}>Đăng xuất</Button>
      </Card>}
      {status==="ready"&&profile?.role==="student"&&<PilotStudentView key={profile.user_id}/>}
      {status==="ready"&&profile?.role==="teacher"&&<PilotTeacherView key={profile.user_id}/>}
      {status==="ready"&&profile?.role==="admin"&&<PilotAdminView key={profile.user_id}/>}
    </main>
  </div>;
}
