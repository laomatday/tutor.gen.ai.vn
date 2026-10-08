export const roles = ["Học sinh", "Giáo viên", "Quản trị"] as const;
export type UserRole = (typeof roles)[number];
export type WorkspaceRole = Exclude<UserRole, "Học sinh">;

export const studentRoutes = [
  { id: "hom-nay", path: "/", label: "Hôm nay", icon: "wb_sunny", group: "Core", description: "Việc học tiếp theo" },
  { id: "hoc-bai", path: "/hoc-bai", label: "Môn học", icon: "menu_book", group: "Core", description: "Lớp · Môn · Chủ đề" },
  { id: "tu-giai", path: "/tu-giai", label: "Luyện tập", icon: "edit_square", group: "Core", description: "Tự giải và nhận phản hồi" },
  { id: "replay", path: "/replay", label: "Xem lại", icon: "history", group: "Core", description: "Lịch sử các bước giải" },
  { id: "tien-bo", path: "/tien-bo", label: "Tiến bộ", icon: "bar_chart", group: "Other", description: "Bài đã học và đánh giá" },
  { id: "thoi-khoa-bieu", path: "/thoi-khoa-bieu", label: "Lịch học", icon: "calendar_month", group: "Other", description: "Lịch học cá nhân" },
  { id: "doi-qua", path: "/doi-qua", label: "Phần thưởng", icon: "workspace_premium", group: "Other", description: "Điểm thưởng và huy hiệu" },
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
