# genAi Tutor — Adaptive Learning Workspace

## Mục tiêu và nguyên tắc

Ưu tiên vùng học/làm bài hơn navigation và thẻ thống kê. Bốn trụ cột Nhiệm vụ, Knowledge Universe, Focus Studio, Thinking Replay phải còn nguyên tính năng và chỉ hiển thị dữ liệu thực (hoặc trạng thái minh họa công khai).

- **Breakpoint viewport** dùng để quyết định loại navigation; **container width** mới quyết định số cột nội dung.
- Một lần chạm tới hành động học chính ở 390×844; không đặt CTA sau đồ họa trang trí.
- Không cắt hình, công thức, dấu nút hoặc bảng; nội dung rộng phải có tín hiệu cuộn/zoom đúng vùng.
- Đủ navigation bằng bàn phím, focus rõ ràng, Escape, focus return, reduced motion và safe area.
- Không thay đổi logic nghiệp vụ, ID của phiên học, dữ liệu kết quả, phần thưởng hoặc quy tắc kiểm tra đáp án khi thay đổi bố cục.

## Breakpoint

| CSS viewport | Shell học sinh | Nội dung |
| --- | --- | --- |
| 360–479px | Mobile header + 4 bottom tabs; drawer phụ | 1 cột, gutter 16px |
| 480–767px | Mobile header + 4 bottom tabs; drawer phụ | 1 cột, card co giãn |
| 768–1023px | Rail 72px, overlay 288px | 1 cột cho studio/replay |
| 1024–1279px | Rail 72px, overlay 288px | Container queries; không ép hai cột |
| 1280–1439px | Rail 72px, overlay 288px | Studio hai cột khi workspace ≥68rem |
| 1440–1919px | Rail 72/288px tùy người học ghim | Workspace thích ứng khi mở/đóng |
| ≥1920px | Rail 72/288px | Home tối đa 100rem; bài đọc tối đa 72.5rem |

Giáo viên / quản trị: drawer dưới 1024px; fixed sidebar từ 1024px. Không dùng rail của học sinh.

## Bố cục từng tính năng

| Tính năng | Khi hẹp | Khi đủ rộng |
| --- | --- | --- |
| Home | Nhiệm vụ, nút Bắt đầu, tương tác, tiến độ xếp dọc | Cột nhiệm vụ + nhịp học khi workspace ≥78rem |
| Knowledge Universe | Lộ trình mặc định; bản đồ mobile có full-screen và nút xem bài | Bản đồ + panel chủ đề khi workspace ≥72rem |
| Focus Studio | DOM: đề → editor/kiểm tra → gợi ý → tool dock → coach; tool dock mở theo yêu cầu | Editor + coach 320px khi workspace ≥68rem |
| Thinking Replay | Player → timeline → phân tích | Timeline + phân tích khi workspace ≥70rem |
| Bài học | 1 cột, stage tabs và điều hướng môn học bên trong | Khung đọc tối đa 72.5rem, TOC cạnh phải nếu đủ chỗ |
| Lịch học | Ngày tháng cuộn được; agenda theo ngày | Lịch tuần và phần nhắc tiếp theo theo container |
| Rewards | 1 cột mobile nhỏ; 2 cột từ 560px | 3 cột từ 1024px; 4 cột từ 1600px |
| Giáo viên | 2 KPI/cột; lớp và danh sách xếp dọc | 4 KPI và overview đa cột nếu container ≥68rem |
| Quản trị | User filters 1 cột; editor toàn rộng, nút lưu cố định đáy | Form 3 cột tại ≥48rem; panel xuất bản tại ≥70rem |

Nguồn CSS: `src/app/layout/shell.css`, `src/styles/student-home.css`, `student-discovery.css`, `student-studio.css`, `student-schedule.css`, và `workspace-responsive.css`.

## Kiểm thử và release gate

Chạy `bun run lint && bun run test && bun run build` và `npx playwright test`. Playwright dùng nguồn học liệu local để kết quả không lệ thuộc DB ngoài.

Viewport matrix chính: **360×800, 390×844, 430×932, 768×1024, 820×1180, 1024×768, 1280×800, 1440×900, 1920×1080**.

Tối thiểu kiểm tra:
1. Không overflow toàn trang ở các route chính và ba không gian; một H1 mỗi màn.
2. Bottom nav chỉ xuất hiện <768px; rail ở 768+; trên 768–1439px mở logo không đổi width workspace; Escape đóng và focus trở về logo.
3. Từ 1440px logo ghim/thu gọn sidebar, lưu lựa chọn, không làm vỡ input/canvas.
4. Map mobile mở toàn màn hình, đóng được bằng Escape và hoàn trả body scroll; zoom/pan/chọn node vẫn làm việc.
5. Mobile Focus Studio đề đứng trước editor; tool dock mở bốn công cụ, hint đúng đề đang làm; save/submit/replay không mất lịch sử.
6. Lịch tuần/ngày, biểu mẫu biên soạn và thao tác lưu/xuất bản không bị thanh điều hướng/keyboard che khuất.
7. Chuyển tablet dọc/ngang, reload, keyboard Tab/Shift+Tab, prefers-reduced-motion; không có trang lỗi console.
8. Regression hai hành trình: Hôm nay → Luyện tập → Nộp → Xem lại và Môn học → Bài → Hoàn thành.
9. UI/UX và WCAG serious/critical: kiểm tra tự động bằng axe cùng duyệt ảnh chụp 390, 820, 1440 và 1920px. Screenshot không thay thế visual review thủ công.

## Tiêu chí vận hành

Không merge main nếu lint, unit, build, E2E hoặc QA responsive fail. Trường hợp thiếu môi trường chạy hoặc bằng chứng visual chưa kiểm tra: giữ PR mở, báo rõ giới hạn. UI responsive không thay thế yêu cầu backend trước khi phát hành học sinh thật: Auth/RBAC phía server, lưu session theo user, duyệt học liệu và QA thực tế.
