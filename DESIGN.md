# genAi Tutor — UX contract (MVP học sinh)

**Một nguồn quy định duy nhất.** Giao diện dành cho học sinh lớp 9 sử dụng dữ liệu học tập có thể kiểm chứng. Những màn Giáo viên/Quản trị hiện là bản demo nội bộ, không được mô tả là hệ thống vận hành đầy đủ.

## 1. Thông tin thật và tính chính trực học thuật
- Không mô tả nội dung hoặc phản hồi là “AI” khi chưa có API AI thực thi, đo lường và kiểm thử. Không dùng streak, mastery, dự phóng điểm, tốc độ học hay log giả.
- “Tiến độ hoàn thành” = số bài học đã hoàn thành / tổng bài đã xuất bản của các môn đăng ký, tính bằng `getCourseProgress`. Không đồng nhất với năng lực hay mastery.
- Một bài luyện tập có một `problemId`; đề, gợi ý, kiểm tra và lịch sử phải cùng ID. Không hiện sẵn đáp án. Replay chỉ dùng sự kiện ghi nhận thực tế.
- Chỉ hiển thị các môn học đã đăng ký; dữ liệu cục bộ và bài kiểm tra mẫu phải được ghi “Minh họa”.

## 2. Information Architecture
- Một sidebar có nhãn cho học sinh: Trang chủ, Lộ trình, Luyện tập, Xem lại bài làm, Tiến bộ, Lịch học, Thành tựu. Không có icon rail, “Gần đây”, “Đã ghim” hoặc nav trùng trong header.
- Desktop sidebar rộng 264px, có thể ẩn/hiện bằng nút header; nội dung/header dịch tương ứng, không overlay. Mobile sidebar là drawer rộng tối đa 320px, đóng bằng Escape/backdrop, khóa scroll và quản lý focus.
- Deep link cũ phải còn chạy, đặc biệt /hoc-bai?grade=…&subject=… và /thi-thu (alias /tien-bo). Tìm kiếm trả về danh mục bài học thật theo từ khóa; có trạng thái rỗng.
- Trang chủ ưu tiên “Tiếp tục học” và CTA trong vùng đầu 390×844. Một màn có một H1, không lồng thẻ main.

## 3. Design tokens & tương tác
- Dùng design tokens hiện có trong `src/index.css` và `design-tokens.json`, font Plus Jakarta Sans, màu thương hiệu genAi. Không tạo bản sao palette theo từng feature.
- Nút thao tác ít nhất 44×44px; nút chính 48px. Phân cấp CTA primary/secondary/ghost; không hiển thị nút không có chức năng.
- Focus `:focus-visible` rõ, scrollbar hiển thị, error/empty/loading/success có nhãn. Không dùng chỉ màu sắc để thể hiện trạng thái. Tôn trọng `prefers-reduced-motion`.
- Học liệu có công thức Math dùng KaTeX khi cần; tiếng Anh/đọc hiểu không ép LaTeX. Hình ảnh thương hiệu tự host; avatar có fallback chữ cái đầu.

## 4. Quality gate trước merge
- `npm run lint`, `npm run test`, `npm run build` và `npm run check:icons` pass. Icon không khai báo phải làm fail CI.
- E2E: Home → Luyện tập → Nộp bài → Xem lại; Lộ trình → Bài học → Hoàn thành. Visual regression tại 390×844 và 1440×900, kèm kiểm tra overflow 360px và axe serious/critical trên các route.
- PR đổi shell đính kèm ảnh trước/sau mobile + desktop, mô tả dữ liệu demo/production và xóa CSS/DOM cũ. Không merge khi có regression.
