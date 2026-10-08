# genAi Tutor — Quy định sản phẩm và giao diện

Phiên bản 4.0. File này thay thế toàn bộ các mục Learning OS, Student Experience V2, AI Pulse V3, ChatGPT-style sidebar và Gemini command bar trong `DESIGN.md` cũ. Khi thay đổi shell, kiến trúc thông tin hoặc nguyên tắc, sửa đúng mục tương ứng trong file này và xóa nội dung cũ. Không thêm mục "phiên bản tiếp theo" vào cuối file.

Tài liệu liên quan: `docs/ui-components.md` (API component, tương tác bàn phím, token) và `docs/content-model.md` (DB-first, content block, đa môn).

## 1. Người dùng và việc chính

| Không gian | Người dùng | Việc chính của màn hình đầu tiên |
| --- | --- | --- |
| Học sinh | Học sinh lớp 6–12. Bản đầu tiên: Toán 9 và Tiếng Anh 9 | Biết hôm nay học gì và bắt đầu trong một lần chạm |
| Giáo viên | Giáo viên bộ môn | Thấy học sinh nào cần hỗ trợ và giao bài cho em đó |
| Quản trị | Bộ phận học thuật và vận hành | Biên soạn, duyệt và xuất bản học liệu |

## 2. Năm nguyên tắc bắt buộc

1. **Một màn hình, một việc chính.** Hành động tiếp theo phải nằm trong màn hình đầu tiên ở cả 390×844 và 1440×900. Mỗi màn hình có tối đa một hành động chính.
2. **Không hiển thị con số không có công thức.** Mọi chỉ số đi qua selector có unit test. Dữ liệu minh họa đặt trong `src/data/demo/` và hiển thị kèm `DemoDataNotice`. Không viết số liệu, đề bài hay lời giải mẫu trực tiếp trong JSX.
3. **Chỉ gọi là "AI" khi chức năng thực sự gọi model.** Chức năng tất định được gọi bằng đúng việc nó làm, ví dụ "Kiểm tra bước", "Gợi ý 2/3".
4. **Không lộ đáp án trước khi học sinh thử.** Gợi ý mở theo bậc. Mọi nội dung trên màn luyện tập và xem lại phải thuộc đúng đề đang mở (cùng `problemId`).
5. **Học sinh đọc tiếng Việt.** Giao diện học sinh không chứa tên token, trạng thái kỹ thuật ("fallback", "Live DB") hay tên nội bộ ("Learning OS", "Mistake DNA", "Reasoning Canvas"). Thương hiệu luôn viết là "genAi Tutor".

## 3. Kiến trúc thông tin của học sinh

| Route | Nhãn | Nhóm | Việc của màn hình |
| --- | --- | --- | --- |
| `/` | Hôm nay | Chính | Nhiệm vụ tiếp theo, tiến độ khóa học, lịch hôm nay |
| `/hoc-bai` | Lộ trình | Chính | Chủ đề → bài học; mở bài |
| `/tu-giai` | Luyện tập | Chính | Làm bài, kiểm tra từng bước, mở gợi ý theo bậc |
| `/replay` | Xem lại | Chính | Xem lại bài đã nộp và lỗi sai của chính bài đó |
| `/thoi-khoa-bieu` | Lịch học | Phụ | Lịch chính khóa và buổi kèm |
| `/tien-bo` | Tiến bộ | Phụ | Kết quả và lịch sử làm bài. Gộp hai mục cũ "Thống kê" và "Bài tập & Đề thi"; `/thi-thu` chuyển hướng về đây |
| `/doi-qua` | Phần thưởng | Phụ | Điểm GP và đổi quà |

Mỗi đích xuất hiện tối đa một lần trong mỗi vùng điều hướng. Một đích có một tên duy nhất ở mọi nơi: nav, nút, tiêu đề trang, breadcrumb. Chỉ thêm mục vào nhóm Chính khi nó phục vụ trực tiếp chu trình Hôm nay → Lộ trình hoặc Luyện tập → Xem lại.

## 4. Shell

**Desktop (từ 1024px).** Một sidebar 240px có nhãn, có thể thu gọn còn 72px (icon kèm nhãn ngắn, lưu lựa chọn của người dùng). Không có panel thứ hai, không có mục "Đã ghim" hay "Gần đây". Header cao 56px gồm: tiêu đề trang ở bên trái, ô tìm kiếm ở giữa, hồ sơ ở bên phải. Ô tìm kiếm chỉ hiển thị khi nó lọc được bài học thật. Header không chứa streak, chỉ số hay lối tắt điều hướng. Nút thông báo chỉ xuất hiện khi đã có nguồn thông báo thật.

**Mobile (dưới 1024px).** Bottom nav gồm 4 mục Chính, mỗi nhãn nằm trên một dòng. Drawer chứa nhóm Phụ và hồ sơ. Nội dung trang chừa khoảng an toàn cho bottom nav.

**Giáo viên và Quản trị.** Giữ shell hiện tại (sidebar có nhãn và breadcrumb). H1 là tên trang, không dùng khẩu hiệu.

## 5. Bố cục trang

Mỗi trang dùng `PageHeader`: đúng một H1, mô tả tối đa một câu, tối đa một hành động chính. Đầu trang chức năng không đặt ảnh minh họa trang trí. Eyebrow chỉ dùng khi mang thông tin, ví dụ "Toán 9 · Chủ đề 2".

Trang Hôm nay có tối đa 3 khối. Trên mobile, trang không dài quá 2 lần chiều cao màn hình. Trang chủ đề chỉ có một header, và danh sách bài là nội dung đầu tiên. Nút "Bắt đầu" mở thẳng bài học hoặc đề, không mở trang tổng quan.

Mọi danh sách và bảng phải có đủ ba trạng thái:
1. Loading: skeleton.
2. Empty: kèm hành động tiếp theo.
3. Error: nói rõ chuyện gì xảy ra và cách xử lý.

## 6. Dữ liệu hiển thị

Tiến độ chỉ được tính bằng `getCourseProgress(course, lessons, topics, completedIds)`, trả về `{ completed, total, percent, nextLesson }`.
- Phạm vi luôn là một khóa (lớp + môn). Không tính gộp nhiều môn.
- Mọi nơi hiển thị tiến độ đều gọi cùng selector này: Hôm nay, Lộ trình, sidebar, trang chủ đề, hồ sơ.

Chỉ hiển thị các môn học sinh đã đăng ký.

Nhiệm vụ, luyện tập và xem lại liên kết với nhau bằng ID (`lessonId`, `problemId`, `sessionId`). Khối nào chưa có dữ liệu thì hiển thị empty state, không hiển thị nội dung mẫu.

Nội dung tải từ DB theo quy tắc sau:
- Đang tải: hiển thị skeleton.
- Tải lỗi: mới dùng JSON dự phòng, kèm thông báo "Đang dùng nội dung ngoại tuyến".
- Không thay nội dung đang hiển thị khi DB trả về muộn.

## 7. Thành phần và chất lượng nền

1. Token, `src/index.css` và `src/components/ui` là nguồn duy nhất cho hình thức. Feature chỉ dùng utility cho bố cục.
2. Icon chỉ dùng tên có trong registry. Tên không tồn tại làm CI fail; không có fallback im lặng. Nghĩa của icon phải khớp hành động.
3. Mọi phần tử tương tác có `:focus-visible` nhìn thấy được. Không ẩn scrollbar toàn cục; vùng cuộn ngang phải có tín hiệu cho thấy cuộn được.
4. Vùng chạm tối thiểu 44px. Chữ tối thiểu 12px. Ô nhập 16px trên điện thoại.
5. Dưới 640px, bảng rộng chuyển thành danh sách thẻ.
6. Logo, avatar và ảnh minh họa tự host trong `public/`, có ảnh dự phòng (avatar dùng chữ cái đầu).
7. Tôn trọng `prefers-reduced-motion`.

## 8. Quy trình thay đổi

1. Thay đổi shell, kiến trúc thông tin hoặc nguyên tắc: sửa mục tương ứng trong file này trong cùng PR và xóa phần cũ.
2. Mượn pattern từ sản phẩm khác: PR phải nêu rõ việc người dùng mà pattern đó giải quyết trong Tutor. Ví dụ, sidebar lịch sử hội thoại chỉ hợp lý khi sản phẩm có hội thoại.
3. PR có thay đổi giao diện: đính kèm ảnh trước và sau ở 390×844 và 1440×900. E2E của hai luồng chính phải pass:
   - Hôm nay → Luyện tập → Nộp bài → Xem lại.
   - Lộ trình → Bài học → Hoàn thành.

## 9. Định nghĩa hoàn thành cho thay đổi giao diện

Một thay đổi giao diện chỉ được coi là xong khi:
- Dữ liệu là dữ liệu thật, hoặc được gắn nhãn minh họa.
- Có đủ trạng thái loading, empty và error.
- Dùng được hoàn toàn bằng bàn phím, focus nhìn thấy được.
- Không tràn ngang ở 360px.
- Câu chữ tiếng Việt, động từ rõ ràng.
- Không có icon rơi vào fallback.
- E2E và visual diff đều pass.