# Tutor Pilot 2026 — Vận hành, đồng ý tham gia, phân quyền và kiểm thử

> Đây là **hệ thống pilot có dữ liệu thật**, chạy song song với bản trình diễn công khai. Pilot chưa tự mở đăng ký. Không được nhập dữ liệu trẻ em hoặc phát hành thương mại khi chưa có chấp thuận và chính sách vận hành hợp lệ.

## Trạng thái đã triển khai

- Cơ sở dữ liệu Tutor riêng trong Supabase \`genAi Education\`: 12 bảng mới, RLS và các RPC chấm quiz/giao bài.
- Browser dùng publishable key; **không có service-role key ở frontend**. Session đăng nhập lưu tại \`sessionStorage\` của tab thay vì lưu vĩnh viễn.
- Chỉ tài khoản \`auth.users\` đã được cấp \`public.tutor_profiles\` qua quản trị tin cậy mới vào pilot.
- Học sinh yêu cầu \`active=true\`, \`role='student'\` và \`consent_approved_at\` hợp lệ; **không thể tự thay quyền hoặc chấp thuận**.
- Lớp và đăng ký môn được cấp qua \`tutor_enrollments\`, giáo viên được phân quyền bằng \`tutor_teacher_links\`.
- Quiz tự chấm **trên Postgres**, chỉ dựa trên bài published, điều kiện đăng ký và bộ đáp án trong cơ sở dữ liệu. Kết quả đúng toàn bộ mới ghi completion, GP ledger và một dấu vết bài đạt gắn skill. Không tự suy ra mastery.
- Studio lưu payload \`tutor_studio_snapshots\` có giới hạn 128 KB, được phân quyền riêng; **tự chấm trên trình duyệt là bản nháp, không phải đánh giá kỹ năng chính thức**.
- Giáo viên chỉ xem học sinh được liên kết; RPC giao bài kiểm tra tất cả học sinh đã đồng ý và có đúng enrollment trong cùng một giao dịch.
- Admin chỉ thấy số liệu pilot thực, không có dữ liệu demo.

## Provisioning có kiểm soát

**Không dùng giao diện web để tạo role admin/teacher hay xác nhận đồng ý.** Quy trình kích hoạt:

1. Điều phối xác minh danh tính giáo viên và xác nhận phụ huynh/người giám hộ khi áp dụng đối với học sinh chưa thành niên. Lưu hồ sơ chấp thuận theo chính sách pháp lý và an toàn dữ liệu của đơn vị.
2. Tạo tài khoản dùng trong pilot qua Supabase Auth Dashboard bằng quyền vận hành, không cung cấp mật khẩu hoặc service-role key cho học sinh qua chat. Cấu hình email xác minh và yêu cầu mật khẩu mạnh.
3. Truy xuất **chính xác** UUID đã tạo từ Auth. Chỉ quản trị viên tin cậy mới chạy việc cấp quyền, gắn grade và \`consent_approved_at\`.
4. Kiểm tra học liệu đã được xuất bản, gắn enrollment đúng \`grade_id\`, \`subject_id\`, sau đó tạo liên kết teacher–learner.
5. Đăng nhập bằng hai thiết bị và nhiều tài khoản riêng để xác nhận RLS thực tế.

Mẫu SQL để quản trị viên **duyệt và điền UUID đã được xác minh**, không chạy khi chưa có chấp thuận:

\`\`\`sql
-- Không nhận UUID, vai trò hoặc thời điểm chấp thuận do phía browser gửi.
insert into public.tutor_profiles
  (user_id,display_name,role,grade_id,consent_approved_at)
values
  ('<learner-auth-uuid>','Tên hiển thị hợp lệ','student','9','<approved-utc-timestamp>');

insert into public.tutor_enrollments(learner_id,grade_id,subject_id)
values ('<learner-auth-uuid>','9','toan');

insert into public.tutor_profiles(user_id,display_name,role)
values ('<teacher-auth-uuid>','Giáo viên đã xác minh','teacher');

insert into public.tutor_teacher_links(teacher_id,learner_id,class_label)
values ('<teacher-auth-uuid>','<learner-auth-uuid>','9A2');
\`\`\`

UUID trong ví dụ chỉ là placeholder. Tuyệt đối không sao chép ví dụ trực tiếp vào môi trường thật.

## Kiểm chứng phân quyền trước pilot

Đăng nhập lần lượt: học sinh A, học sinh B không liên kết, giáo viên A được liên kết với A, giáo viên B không liên kết, quản trị viên.

- A chỉ đọc hồ sơ, enrollment, completion, quiz, GP và nháp của A.
- B không thể đọc bản ghi của A dù biết UUID; không thể sửa learner_id khi upsert bản nháp.
- Giáo viên A chỉ đọc nhật ký học sinh được liên kết; giáo viên B không đọc được A.
- Người dùng thường không thể INSERT/UPDATE \`tutor_profiles\`, \`tutor_lesson_completions\`, \`tutor_quiz_attempts\`, \`tutor_reward_ledger\`.
- Người chưa đăng nhập không có quyền SELECT tới 12 bảng riêng tư.
- RPC quiz từ chối user chưa phê duyệt, bài chưa published, bài không đăng ký, đáp án thiếu; không thưởng trùng và không vượt trần GP ngày khi có nhiều lần nộp.
- RPC giao bài không chấp nhận học sinh ngoài liên kết hoặc đăng ký sai môn.
- Thử 360×800, 390×844, 768×1024, 1024×768, 1440×900 và bàn phím; chạy axe/WCAG, Safari trên iOS và Android thiết bị thật.
- Kiểm thử logout, refresh token, trạng thái mạng yếu, đổi tab, reload và truy cập đồng thời. Không ghi token vào console/test artifact.

## Vận hành và bảo vệ dữ liệu

- Ẩn thông tin tài khoản trong báo cáo công khai, không xuất lời giải cá nhân ra analytics không kiểm soát.
- Hướng tới tối thiểu hóa thông tin cá nhân, thời hạn lưu, quy trình xóa/xuất dữ liệu và phân tách vai trò quản trị – giáo viên – học sinh.
- Pilot chưa có self-signup và chức năng phụ huynh trên Tutor. Việc tạo tài khoản chỉ thực hiện sau khi có chấp thuận hợp lệ; chưa có thì giữ \`consent_approved_at\` NULL.
- Supabase đã dùng chung với các sản phẩm genAi khác: tuyệt đối không thay bảng hoặc policies ngoài tiền tố \`tutor_\` khi chạy migration.
- Dữ liệu thao tác Studio có thể do client nhập và **không được dùng làm bằng chứng chấm điểm**.
- Chưa tự xác nhận tuân thủ đầy đủ quy định dữ liệu cá nhân trẻ em; cần đánh giá pháp lý/vận hành trước khi mời học sinh thật.

## Release gates

Không phát hành production nếu thiếu CI/unit/build, browser QA, kiểm tra RLS bằng ít nhất 2 tài khoản tách biệt, nội dung được duyệt học thuật, hoặc bản deploy chưa đúng SHA. Đặc biệt không nhầm GitHub merge với website đã deploy.

Xem \`docs/tutor-pilot-rollout.md\` và \`docs/tutor-academic-rubric.md\`.
