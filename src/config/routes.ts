export const roles = ["Học sinh", "Giáo viên", "Quản trị"] as const;
export type UserRole = (typeof roles)[number];
export type WorkspaceRole = Exclude<UserRole, "Học sinh">;

export const studentRoutes = [
  { id: "hom-nay", path: "/", label: "Trang chủ", icon: "home", group: "Core", description: "AI Pulse & nhiệm vụ hôm nay" },
  { id: "hoc-bai", path: "/hoc-bai", label: "Knowledge Map", icon: "hub", group: "Core", description: "Vũ trụ tri thức" },
  { id: "tu-giai", path: "/tu-giai", label: "Focus Studio", icon: "edit_square", group: "Core", description: "Giải bài cùng AI" },
  { id: "replay", path: "/replay", label: "Thinking Replay", icon: "history", group: "Core", description: "Xem lại tư duy" },
  { id: "thi-thu", path: "/thi-thu", label: "Bài tập & Đề thi", icon: "assignment", group: "Khác", description: "Đánh giá & luyện thi" },
  { id: "thoi-khoa-bieu", path: "/thoi-khoa-bieu", label: "Lịch học", icon: "calendar_month", group: "Khác", description: "Lịch & buổi Tutor" },
  { id: "tien-bo", path: "/tien-bo", label: "Thống kê", icon: "bar_chart", group: "Khác", description: "Năng lực & tiến bộ" },
  { id: "doi-qua", path: "/doi-qua", label: "Thành tựu", icon: "workspace_premium", group: "Khác", description: "Mastery & phần thưởng" },
] as const;
export type NavTab = (typeof studentRoutes)[number]["id"];

export const workspaceRoutes = {
  "Giáo viên": [
    { id: "overview", path: "/giao-vien", label: "Tổng quan", icon: "dashboard", description: "Nhịp học của các lớp" },
    { id: "classes", path: "/giao-vien/lop-hoc", label: "Lớp học", icon: "groups", description: "Học sinh & Tiến độ" },
    { id: "assignments", path: "/giao-vien/bai-tap", label: "Bài tập", icon: "assignment", description: "Giao bài & Theo dõi" },
  ],
  "Quản trị": [
    { id: "overview", path: "/quan-tri", label: "Tổng quan", icon: "space_dashboard", description: "Hoạt động của nền tảng" },
    { id: "users", path: "/quan-tri/nguoi-dung", label: "Người dùng", icon: "manage_accounts", description: "Tài khoản & Vai trò" },
    { id: "content", path: "/quan-tri/hoc-lieu", label: "Chương trình học", icon: "account_tree", description: "Lớp · Môn · Chủ đề · Bài" },
  ],
} as const;

export const roleHome: Record<UserRole, string> = {
  "Học sinh": studentRoutes[0].path,
  "Giáo viên": workspaceRoutes["Giáo viên"][0].path,
  "Quản trị": workspaceRoutes["Quản trị"][0].path,
};

export const rolePresentation = {
  "Học sinh": { label: "Learning OS", icon: "school", group: "Học tập", hintTitle: "", hintText: "" },
  "Giáo viên": {
    label: "Không gian giáo viên", icon: "school", group: "Giảng dạy",
    hintTitle: "Đồng hành cùng học sinh",
    hintText: "Theo sát tiến độ, nhận diện khó khăn và giao bài phù hợp cho từng lớp.",
  },
  "Quản trị": {
    label: "Không gian quản trị", icon: "shield_person", group: "Quản lý",
    hintTitle: "Chất lượng từ từng bài học",
    hintText: "Tổ chức học liệu theo lớp, môn và chủ đề. Hoàn thiện từng bài trước khi xuất bản.",
  },
} as const;

export const routePath = (id: NavTab) => studentRoutes.find((item) => item.id === id)!.path;
export const workspacePath = (role: WorkspaceRole, section: string) =>
  workspaceRoutes[role].find((item) => item.id === section)?.path ?? roleHome[role];
