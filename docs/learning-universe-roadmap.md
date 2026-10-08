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

**Trạng thái:** đã triển khai bản thử nghiệm trong [Draft PR #21](https://github.com/laomatday/tutor.gen.ai.vn/pull/21), xếp chồng trên P0 PR #20. **Chưa phát hành cho học sinh thật**; còn chờ xác nhận toàn bộ CI/E2E hiện hành, ảnh desktop/mobile, và thẩm định học thuật.

Owner: frontend + giáo viên Toán 9, Tiếng Anh 9 + QA.
Phụ thuộc: `problemId`/`lessonId`/`exerciseId`, dữ liệu published, kết quả toán tất định, xác nhận từ học thuật.

Đã triển khai trong PR #21:

- **Toán 9 / Focus Studio:** tab `Thí nghiệm` chỉ xuất hiện khi bài tập tương ứng thuộc khóa đăng ký, chủ đề/bài học đã published; cần có ít nhất một lần `Kiểm tra bước giải` thực trước khi mở. Đồ thị dùng cùng hệ trục và thang đo cố định; ba thử nghiệm về dấu `a`, dịch chuyển theo `c` và trục đối xứng theo `b` — học sinh chọn dự đoán, thao tác, kiểm tra rồi đọc giải thích.
- **Lưu ý kiến thức:** dạng `y=ax²+bx+c` với hệ số `b,c` được ghi rõ là *khám phá mở rộng*, không đánh đồng với yêu cầu chuẩn đầu ra lõi `y=ax²` của bài Toán 9.
- **Tiếng Anh 9:** micro-lab hai tình huống giao tiếp *Joining a school club*, đáp án/giải thích lấy từ hai bài tập đã xuất bản; kiểm tra từng tình huống, sai thì gợi ý để thử lại, đúng mới hiển thị phản hồi của nhân vật. Không giả lập AI hay nhận dạng giọng nói.
- **Integrity:** selector từ chối cấu hình không khớp nội dung published; cả hai lab không cộng điểm, không tạo mastery hoặc lịch sử Replay giả. Có unit tests và E2E riêng.

Chưa làm và điều kiện trước phát hành:

- Giáo viên bộ môn rà soát và duyệt câu hỏi, sự phù hợp độ tuổi, độ chính xác Toán và giao tiếp tiếng Anh.
- QA xác nhận accessibility, 360px/390px/1440px, flow học sinh và ảnh trước/sau. Giữ PR Draft cho đến khi chấp thuận.
- Backend Auth/RBAC và learner-event persistence chưa thuộc P1; không quảng bá đây là AI adaptive tutor hoặc đánh giá mastery.
- Thử nghiệm với học sinh thật để đo tỷ lệ tự thao tác, tỷ lệ tự sửa và kết quả pre/post, thiết lập baseline trước khi công bố lợi thế.

Risks: mô hình Toán vượt yêu cầu lõi nếu không gắn nhãn rõ; học sinh hiểu nhầm tương tác là điểm số; script hội thoại cần cập nhật khi học liệu đổi; tương tác trên Android cấu hình thấp.
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
