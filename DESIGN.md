# genAi Tutor — Quy định sản phẩm và giao diện

Phiên bản 6.0. Quy định giao diện học sinh hướng tới cuối Gen Z và Gen Alpha: một góc học để khám phá, dễ bắt đầu và thấy tiến bộ từ việc học thật. Khi thay đổi shell, kiến trúc thông tin hoặc nguyên tắc, sửa đúng mục tương ứng trong file này và xóa nội dung cũ. Không thêm mục "phiên bản tiếp theo" vào cuối file.

Quy tắc bảo vệ: không được bỏ bốn trụ cột Nhiệm vụ học tập, Knowledge Universe, Focus Studio và Thinking Replay chỉ vì một số số liệu chưa có nguồn. Cần thay dữ liệu giả bằng dữ liệu thật hoặc empty state, giữ trải nghiệm người học. Xem docs/product-differentiators.md.

Tài liệu liên quan: `docs/ui-components.md` (API component, tương tác bàn phím, token) và `docs/content-model.md` (DB-first, content block, đa môn).

## 1. Người dùng và việc chính

| Không gian | Người dùng                                             | Việc chính của màn hình đầu tiên                   |
| ---------- | ------------------------------------------------------ | -------------------------------------------------- |
| Học sinh   | Học sinh lớp 6–12. Bản đầu tiên: Toán 9 và Tiếng Anh 9 | Biết hôm nay học gì và bắt đầu trong một lần chạm  |
| Giáo viên  | Giáo viên bộ môn                                       | Thấy học sinh nào cần hỗ trợ và giao bài cho em đó |
| Quản trị   | Bộ phận học thuật và vận hành                          | Biên soạn, duyệt và xuất bản học liệu              |

## 2. Năm nguyên tắc bắt buộc

1. **Một màn hình, một việc chính.** Hành động tiếp theo phải nằm trong màn hình đầu tiên ở cả 390×844 và 1440×900. Mỗi màn hình có tối đa một hành động chính.
2. **Không hiển thị con số không có công thức.** Mọi chỉ số đi qua selector có unit test. Dữ liệu minh họa đặt trong `src/data/demo/` và hiển thị kèm `DemoDataNotice`. Không viết số liệu, đề bài hay lời giải mẫu trực tiếp trong JSX.
3. **Chỉ gọi là "AI" khi chức năng thực sự gọi model.** Chức năng tất định được gọi bằng đúng việc nó làm, ví dụ "Kiểm tra bước", "Gợi ý 2/3".
4. **Không lộ đáp án trước khi học sinh thử.** Gợi ý mở theo bậc. Mọi nội dung trên màn luyện tập và xem lại phải thuộc đúng đề đang mở (cùng `problemId`).
5. **Học sinh đọc tiếng Việt.** Nhãn và hướng dẫn bằng tiếng Việt. Có thể giữ tên trải nghiệm Knowledge Universe, Focus Studio, Thinking Replay bên cạnh diễn giải tiếng Việt theo mẫu thiết kế đã chọn; không đưa tên token hoặc trạng thái hạ tầng vào luồng học. Thương hiệu lấy từ `appConfig.brand`.

Giọng nói gần gũi, tôn trọng học sinh và khuyến khích thử lại; không dùng tiếng lóng gượng ép hoặc tạo áp lực phải quay lại mỗi ngày. Màu navy làm điểm tựa cho hành động chính, teal và sky đánh dấu khám phá và tiến bộ. Cảm giác vui đến từ việc tự chọn cách học, tìm ra một bước giải và thấy lịch sử của chính mình, không từ streak giả, đồng hồ đếm ngược hoặc bảng xếp hạng không có dữ liệu.

## 3. Kiến trúc thông tin của học sinh

| Route             | Nhãn        | Nhóm  | Việc của màn hình                                                                                           |
| ----------------- | ----------- | ----- | ----------------------------------------------------------------------------------------------------------- |
| `/`               | Hôm nay     | Chính | Nhiệm vụ tiếp theo, tiến độ khóa học, lịch hôm nay                                                          |
| `/hoc-bai`        | Môn học     | Chính | Chủ đề → bài học; mở bài                                                                                    |
| `/tu-giai`        | Luyện tập   | Chính | Làm bài, kiểm tra từng bước, mở gợi ý theo bậc                                                              |
| `/replay`         | Xem lại     | Chính | Xem lại bài đã nộp và lỗi sai của chính bài đó                                                              |
| `/thoi-khoa-bieu` | Lịch học    | Phụ   | Lịch chính khóa và buổi kèm                                                                                 |
| `/tien-bo`        | Tiến bộ     | Phụ   | Kết quả và lịch sử làm bài. Gộp hai mục cũ "Thống kê" và "Bài tập & Đề thi"; `/thi-thu` chuyển hướng về đây |
| `/doi-qua`        | Phần thưởng | Phụ   | Điểm GP và đổi quà                                                                                          |

Mỗi đích xuất hiện tối đa một lần trong mỗi vùng điều hướng. Một đích có một tên duy nhất ở mọi nơi: nav, nút, tiêu đề trang, breadcrumb. Chỉ thêm mục vào nhóm Chính khi nó phục vụ trực tiếp chu trình Hôm nay → Môn học hoặc Luyện tập → Xem lại.

## 4. Shell

**Desktop (từ 1024px).** Sidebar trắng rộng 288px, thu gọn thành thanh biểu tượng 72px và lưu lựa chọn. Logo là nút đóng/mở duy nhất của sidebar học sinh, luôn giữ nguyên vị trí và có vùng bấm 44px, tên truy cập, tooltip. Không dùng hamburger hoặc nút khung sidebar bên cạnh logo. Trạng thái thu gọn dùng vùng bấm hình chữ nhật bo nhẹ, không bọc biểu tượng bằng hình tròn. Nhãn mờ dần và chiều rộng đổi trong 260ms, tôn trọng giảm chuyển động. Sidebar không chứa thông tin người dùng, điểm thưởng hoặc khối bài học đã hoàn thành.

Nội dung học sinh dùng chiều rộng còn lại bên cạnh sidebar, với lề ngang 24px (16px dưới 640px), giữ nguyên khi đóng/mở menu. Shell quản lý lề chung; khung ngoài của từng trang không thêm padding ngang hoặc giới hạn chiều rộng để căn giữa. Giới hạn độ dài dòng, nếu cần, đặt ở nội dung đọc bên trong.

Header giữ chiều cao và vị trí cố định hiện tại: bỏ tên genAi Tutor; tìm kiếm chỉ hiện icon, mở hộp tìm kiếm có thể dùng Ctrl/⌘ K, Escape và Enter; hồ sơ chỉ có trên header. Ngữ cảnh trang học sinh nằm bên trái header, không có hàng breadcrumb riêng bên dưới. Khi mở môn học, hiện liên kết về Môn học và bộ chọn môn từ đăng ký/học liệu đã xuất bản; khi mở bài, hiện liên kết về môn cùng tên bài. Trên điện thoại, rút gọn phần chữ của liên kết quay lại nhưng giữ tên truy cập và vùng bấm 44px. Không thêm streak hoặc chỉ số nhận thức chưa có nguồn dữ liệu.

**Mobile (dưới 1024px).** Bottom nav gồm 4 mục Chính, mỗi nhãn nằm trên một dòng. Logo trên header mở drawer chứa nhóm Phụ; logo trong drawer đóng drawer. Escape hoặc chạm nền phủ đóng drawer và trả focus về nút mở. Chuyển sang desktop xóa trạng thái mở drawer. Nội dung trang chừa khoảng an toàn cho bottom nav.

**Giáo viên và Quản trị.** Giữ shell hiện tại (sidebar có nhãn và breadcrumb). H1 là tên trang, không dùng khẩu hiệu.

## 5. Bố cục trang

Mỗi trang có đúng một H1, mô tả ngắn và một hành động chính rõ ràng. H1 của trang = tên đích trong thanh điều hướng; lời mời nằm ở dòng mô tả. Các trang chức năng khác dùng `PageHeader`. Đầu trang chức năng không đặt ảnh minh họa trang trí; bản xem trước trong nhiệm vụ phải là nội dung của bài sắp mở.

Bốn màn chính dùng component và màu của gen.ai.vn. Hướng khám phá lấy cảm hứng từ [Brilliant: học Toán qua thao tác](https://brilliant.org/mathematics/), hướng chặng học tham khảo [lộ trình của Duolingo](https://blog.duolingo.com/new-duolingo-home-screen-design/): học sinh có một bước tiếp theo rõ ràng và được thử ý tưởng trước khi đọc giải thích. Không sao chép thương hiệu hoặc suy ra hiệu quả học tập từ việc đổi giao diện.

- **Hôm nay:** bàn khám phá sáng, nội dung từ bài tiếp theo và nút bắt đầu navy. Ba lựa chọn Học mới / Luyện một bài / Xem lại thực sự đổi nội dung và đích mở. Học mới có một câu hỏi tương tác, chọn/kiểm tra/thử lại và mô hình thao tác nếu bài có cấu hình đã duyệt. Bản xem trước chặng học hiển thị bài hiện tại cùng các bước liền kề; nhịp học tuần và số lần tự sửa dùng dữ liệu đã lưu. Nút bắt đầu đứng trước mô hình và nội dung phụ trên điện thoại.
- **Môn học / Knowledge Universe:** mở mặc định bằng Lộ trình, nhóm bài đã xuất bản theo chủ đề và thứ tự chương trình. Mỗi chặng có các mốc Đã hoàn thành / Bài tiếp theo / Có thể khám phá, thời lượng thật và nút vào bài. Bài hoàn thành mở lại ví dụ; bài sau vẫn mở được, không tạo khóa tiên quyết giả. Buổi tự giải được đặt vào chặng khi có đề thuộc đúng chủ đề/môn. Có thể chuyển sang Bản đồ hoặc Danh sách; giữ tìm kiếm, bộ lọc, phóng to/thu nhỏ/căn vừa, panel chủ đề và thao tác mở bài. Đường nối chỉ biểu thị cấu trúc chương trình.
- **Focus Studio:** đề bài; ba bước Đọc đề / Thử cách giải / Hiểu ra; công cụ công thức, phác thảo, đồ thị và ghép hình đại số; khu vực nhập/kiểm tra đứng trước nhật ký các lần thử. Gợi ý theo bậc là người bạn đồng hành; phản hồi chỉ rõ bước cần sửa và ghi nhận khi tự sửa đúng. Bài được lưu riêng theo ID để chuyển bài không mất lịch sử hoặc cộng thưởng lại. Xóa nháp để thử lại giữ nguyên các lần kiểm tra và lỗi đã lưu.
- **Thinking Replay:** phát/tạm dừng, thanh thời gian, tốc độ; timeline các thao tác thật; điểm cần xem lại, gợi ý ôn lại và bản phác thảo đã lưu. Khoảng thời gian phiên là thời gian trôi qua, không suy ra thời gian tập trung. Chưa làm bài thì có hành động bắt đầu ngay, không tạo sẵn lịch sử giả.

**Lịch học:** bố cục bàn học cá nhân với tuần có ngày tháng cụ thể, danh sách theo dòng thời gian và thẻ buổi tiếp theo. Chế độ Theo ngày/Cả tuần dùng chung bộ lọc hình thức học. Buổi tiếp theo được chọn theo giờ trong múi giờ cấu hình, gồm buổi đang diễn ra và bỏ qua buổi đã hoàn thành; không lấy cố định buổi đầu ngày. Tổng thời lượng tính từ giờ bắt đầu/kết thúc của các buổi đang hiển thị. Có thể thêm lịch riêng, sửa, xóa và hoàn tác; giờ kết thúc phải sau giờ bắt đầu trong cùng ngày. Lịch mẫu lặp hằng tuần và giới hạn lưu trên thiết bị được ghi rõ trong trang. Nút hành động gọi đúng đích mở: bài đã xuất bản, tự giải, môn học hoặc bài thi mẫu.

**Khám phá trong bài:** hoạt động ngắn mở đầu phần lý thuyết, dùng câu hỏi/đáp án/giải thích của học liệu hiện tại. Giải thích chỉ xuất hiện sau khi học sinh kiểm tra lựa chọn. Mô hình hình vuông/Parabol được gắn với cấu hình nội dung đã kiểm tra, hiển thị biến và phản hồi theo thao tác thật; bài không có mô hình dùng câu hỏi tương tác. Không có câu hỏi hợp lệ thì không dựng hoạt động giả. Thử ở bản xem trước không đánh dấu hoàn thành bài hoặc cộng GP; việc hoàn thành vẫn qua toàn bộ câu tự kiểm tra của bài.

Mobile chuyển các cột thành một luồng đọc, giữ đủ tính năng và không tràn ngang ở 360px. Nút "Bắt đầu" mở thẳng bài học hoặc đề.

Mọi danh sách và bảng phải có đủ ba trạng thái:

1. Loading: skeleton.
2. Empty: kèm hành động tiếp theo.
3. Error: nói rõ chuyện gì xảy ra và cách xử lý.

## 6. Dữ liệu hiển thị

Tiến độ chỉ được tính bằng `getCourseProgress(course, lessons, topics, completedIds)`, trả về `{ completed, total, percent, nextLesson }`.

- Phạm vi luôn là một khóa (lớp + môn). Không tính gộp nhiều môn.
- Mọi nơi hiển thị tiến độ đều gọi cùng selector này: Hôm nay, Lộ trình, trang chủ đề, hồ sơ.

Chỉ hiển thị các môn học sinh đã đăng ký.

Nhịp học đi qua `selectStudyJourney`: tuần từ thứ Hai đến Chủ nhật theo múi giờ cấu hình, chỉ đánh dấu ngày có check/submit đã lưu. Mở trang, xem gợi ý hoặc bài đã hoàn thành nhưng không có thời điểm không tạo ngày hoạt động. V3 ưu tiên theo đề; V2 chỉ bổ sung đề chưa di chuyển. Loại thời điểm tương lai. Tổng lượt kiểm tra, tự sửa và sổ tay phản ánh lịch sử còn lưu trên thiết bị, không phải tổng trọn đời. Trang tổng quan chỉ đọc dữ liệu, không tự tạo phiên làm bài.

Lịch đã lưu đi qua validator trước khi dùng. Mở trang không tự ghi đè dữ liệu cũ; chỉ lưu khi người dùng chủ động chỉnh lịch. Lỗi đọc/ghi được thông báo trong trang. Danh mục môn trong form lấy từ chương trình và lịch hiện có.

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
   - Môn học → Bài học → Hoàn thành.

## 9. Định nghĩa hoàn thành cho thay đổi giao diện

Một thay đổi giao diện chỉ được coi là xong khi:

- Dữ liệu là dữ liệu thật, hoặc được gắn nhãn minh họa.
- Có đủ trạng thái loading, empty và error.
- Dùng được hoàn toàn bằng bàn phím, focus nhìn thấy được.
- Không tràn ngang ở 360px.
- Câu chữ tiếng Việt, động từ rõ ràng.
- Không có icon rơi vào fallback.
- E2E và visual diff đều pass.
