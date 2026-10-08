# genAi Tutor — Feature differentiation contract

## Giữ khác biệt, sửa dữ liệu
Khắc phục số liệu giả bằng đổi nguồn dữ liệu và trạng thái, không loại bỏ cả trải nghiệm. Chỉ gọi là AI khi có model thực thi và kiểm thử.

| Trụ cột | Dữ liệu chức năng hiện có | Không được giả vờ đã có |
| --- | --- | --- |
| Nhiệm vụ / AI Pulse concept | 3 chặng lý thuyết, ví dụ, luyện tập từ bài xuất bản; hàng đợi bài và tiến độ môn | Radar năng lực, điểm thi dự đoán, streak hay AI coach không có nguồn |
| Knowledge Universe | Node chủ đề/môn tương tác; tình trạng hoàn thành; nhấn mở bài thật | Knowledge primitives, quan hệ prerequisite do model suy ra, lỗ hổng nhận thức không có dữ liệu |
| Focus Studio | Đề bài đúng problemId, kiểm tra toán học theo quy tắc, attempts thật, gợi ý, Socratic prompts từ đề, đồ thị mở sau khi làm | AI đọc vết bút, đại số hóa sai đề, bất kỳ số liệu tư duy nào tự bịa |
| Thinking Replay | Play/pause/speed/seek trên sự kiện PracticeSession.events, lỗi đã ghi nhận, hints trong cùng bài | Stroke replay khi chưa có stroke data, Mistake DNA nhiều bài, giả tạo suy nghĩ |

## Quality contract
1. Giữ bốn bố cục advanced; không cho phép xóa giao diện để làm test hardcode pass.
2. Chỉ dùng học liệu đã xuất bản và đúng môn đã đăng ký.
3. Không dùng số điểm nhận thức/streak chưa có công thức và dữ liệu.
4. Mọi nút hoạt động; học sinh có thể hoàn thành hai journey chính và xem lại các sự kiện thực.
5. Dùng chung token/UI gen.ai.vn, một H1, responsive 360px và bàn phím.
6. Breadcrumb trong nội dung trang, không nằm trong fixed header.
7. Để phát hành cho học sinh thật, cần Auth/RBAC, lưu session theo user phía server, duyệt học thuật và kiểm thử thực tế.

## Regression tests bắt buộc
- Home: có nhiệm vụ từ bài published; mở được bài, không có chỉ số học tập giả.
- Knowledge Universe: node tương tác theo môn; nhấn chọn đổi panel và mở bài.
- Studio: lời giải khởi tạo trống; ghi attempts khi kiểm tra, hint đúng problemId.
- Replay: empty state đúng; có events sau thao tác; phát lại timeline thực.
