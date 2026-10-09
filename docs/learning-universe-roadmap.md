# genAi Learning Universe — roadmap thực thi

Tài liệu kế hoạch (không phải thông báo đã phát hành). Tuân thủ `DESIGN.md`, `docs/ui-components.md` và `docs/product-differentiators.md`. Mọi kết quả học tập dùng dữ liệu có nguồn.

## Kết quả audit từ codebase (2026-10)

- React / Vite / TypeScript / Tailwind, thiết kế dùng token genAi và UI component nội bộ. Không đổi framework.
- Home đã có lựa chọn Học mới / Luyện một bài / Xem lại; Knowledge Universe, Focus Studio, Thinking Replay đều đã có luồng cơ bản và nguồn dữ liệu bài học.
- Học liệu đọc DB-first với fallback JSON; học liệu mẫu địa phương không phải dữ liệu production.
- README xác nhận giáo viên và quản trị còn sử dụng một phần dữ liệu minh họa hoặc localStorage, không có server Auth/RBAC hoàn chỉnh.
- LessonDiscovery đã có mô hình hệ số parabol, miền xác định căn thức, câu hỏi tương tác ràng buộc với bài đã xuất bản.
- CI có lint/typecheck, unit test, format, build và Playwright E2E; không nhận định là pass nếu workflow chưa chạy.

## Chiến lược khác biệt: hoạt động học gắn với dấu vết tư duy

Giả thuyết sản phẩm cần kiểm chứng: người học có xu hướng hiểu và tự sửa tốt hơn khi **nhìn thấy hệ quả của thao tác** trong bài học, có gợi ý theo bước, và xem lại lỗi bằng những sự kiện thực đã ghi nhận.

Đối thủ có các tính năng riêng lẻ tương tự; không quảng bá là duy nhất. Khác biệt cần kiểm chứng nằm ở **liên thông** Explore → Try → Understand → Replay → Mastery trên cùng lessonId/problemId/sessionId.

## P0 — Mission Control + design foundation (PR đầu)

Owner: frontend + QA. Phụ thuộc: bài published, `selectDiscovery`, `getCourseProgress`, session đã lưu.

- Một vùng nhiệm vụ thống trị phía trên, CTA dễ tìm, tiến độ và nhịp học xuống vùng phụ.
- Reuse `LessonDiscovery` trong preview thay vì dựng ví dụ giả; không thay kết quả bài học hoặc cộng GP.
- Sửa toàn bộ global CSS ẩn scrollbar, giữ điều khiển bàn phím và dấu hiệu cuộn.
- Giữ 3 chế độ học, định tuyến, Learning Path, Teacher/Admin nguyên vẹn.
- Acceptance: 390×844 thấy hành động đầu tiên; 360px không tràn ngang; hai journey chính còn chạy; preview không thay tiến độ; loading/empty/error rõ ràng.
- Risk: thay đổi CSS toàn cục có thể lộ scrollbar ở các bề mặt trước đây ẩn; cần visual regression.

## P1 — Focus Studio + micro-lab chuyên môn

Owner: frontend + Toán 9/Anh 9 academic reviewer + QA.
Phụ thuộc: đặc tả kỹ năng, `problemId`/lessonId, content approval, nguồn kết quả phép toán.

- Toán 9: prototype đồ thị `y=ax²+bx+c` với vùng thao tác và câu hỏi dự đoán trước khi quan sát. Giữ công cụ mô hình `y=ax²` đang có.
- Tiếng Anh 9: lab hội thoại có mục tiêu giao tiếp, lựa chọn ngữ cảnh và phản hồi theo rubric; không hứa voice nếu chưa có hạ tầng audio.
- Focus Studio: đề → tự làm → gợi ý theo bậc → xác minh bước → phản hồi → sửa; tránh lộ đáp án.
- Acceptance: ít nhất 2 micro-labs được học thuật duyệt, dùng nội dung published, mọi thay đổi có kiểm thử logic, học sinh hoàn thành flow mobile không cần hỗ trợ.
- Risks: giải đúng đa dạng hình thức, model hallucination, năng lực thiết bị yếu, chi phí suy luận; khởi đầu bằng logic tất định và test học thuật.

## P2 — Knowledge Universe + Thinking Replay

Owner: frontend + learning analytics + QA.
Phụ thuộc: dữ liệu liên kết thật, session event schema, RBAC production khi có tài khoản thật.

- Map/Journey/List cùng nguồn chủ đề published; chỉ nối prerequisite khi có biên soạn và xác nhận.
- Replay sự kiện thật: seek, pause, speed, attempts, corrections, hints; hiện empty state khi chưa có dữ liệu.
- Không dựng radar nhận thức, điểm dự đoán, thời gian tập trung, AI reasoning reconstruction nếu chưa có bằng chứng.
- Acceptance: topic map được điều khiển qua bàn phím/mobile, replay không trộn `problemId`, không tạo session khi chỉ xem trang.

## P3 — Teacher/Admin + production readiness

Owner: backend + academic operations + security + QA.
Phụ thuộc: Auth/RBAC, RLS Supabase, persistence user-level, content approval, kiểm toán dữ liệu.

- Đồng bộ assignments, learner events và duyệt học liệu thật; tách demo khỏi production.
- Audit RLS bằng role thực (student, teacher, admin) ở server; xóa policy broad access trước phát hành học sinh.
- Chỉ sau khi có dữ liệu tin cậy mới định nghĩa mastery và recommendation.
- Acceptance: test deny-by-default, data ownership, audit trail, rollback migration, test end-to-end theo role.

## KPI pilot / thiết kế nghiên cứu

Đây là ngưỡng mục tiêu cần baseline, không phải kết quả thực nghiệm:

| KPI | Công thức đề xuất | Mục tiêu pilot |
| --- | --- | --- |
| Xác định được bước tiếp theo | học sinh chọn đúng hành động không trợ giúp / mẫu thử | ≥ 90% |
| Bắt đầu học dưới 15 giây | số phiên mở lesson <=15s / số phiên thử hợp lệ | ≥ 85% |
| Hoàn thành Practice → Replay | số hành trình hoàn tất / số hành trình bắt đầu | ≥ 90% |
| Tự sửa đúng | số bài có lỗi được sửa đúng mà không xem đáp án đầy đủ / số bài có lỗi đủ điều kiện | lấy baseline, chưa áp target |
| Học sâu | chênh lệch điểm pre/post trên bộ đề song song đã kiểm định | đo so sánh với nhóm kiểm soát |
| Dữ liệu chính xác | chỉ số có source + công thức + test / toàn bộ chỉ số hiển thị | 100% |

Khảo sát có đồng ý phù hợp với học sinh vị thành niên. Đo cả mức độ phân tâm, tốc độ thao tác và thiết bị Android cấu hình thấp.

## Definition of Done

PR ghi rõ owner, dependencies, thay đổi file, phép đo, review học thuật khi cần. Phải có ảnh trước/sau tại 390×844 và 1440×900 với màn thay đổi; `npm run check`, `npm run test:e2e`, kiểm tra 360px và keyboard. Không merge hoặc deploy khi chưa kiểm tra và phê duyệt.
