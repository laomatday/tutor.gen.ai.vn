<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://uketwpczthkflsmoiocs.supabase.co/storage/v1/render/image/public/article-covers/1790300302349-sp9g2i.png?width=480&resize=contain&quality=75" />
</div>

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Cấu hình tùy chọn trong `.env.local` theo [.env.example](.env.example). Mặc định ứng dụng đọc học liệu công khai theo [content-source.json](src/data/config/content-source.json), có JSON dự phòng khi không tải được. Đặt `VITE_CONTENT_SOURCE=local` để chạy hoàn toàn với học liệu cục bộ. Bản hiện tại không cần Gemini API key.
3. Run the app:
   `npm run dev`

### Tutor Pilot (dữ liệu học tập theo tài khoản)

- Truy cập `/pilot` để dùng khu vực thử nghiệm có xác thực Supabase Auth và phân quyền bằng RLS. **Pilot không tự đăng ký tài khoản**; cần điều phối viên cấp tài khoản và phê duyệt tham gia phù hợp trước khi học sinh đăng nhập.
- Pilot chạy tách biệt với các route bản trải nghiệm `/`, `/hoc-bai`, `/tu-giai`, `/replay` vốn vẫn dùng dữ liệu minh họa/localStorage. Không gộp hoặc báo cáo chung kết quả hai chế độ.
- Trạng thái bài hoàn thành, quiz, GP và skill evidence của pilot do Postgres lưu. Nháp Focus Studio được đồng bộ giữa thiết bị nhưng tự chấm lời giải bằng bộ kiểm tra ở client **không phải chứng nhận năng lực**.
- Trước khi thử nghiệm có học sinh thật: phải chạy kiểm tra RLS bằng các tài khoản có vai trò riêng, xác minh đồng ý tham gia, đánh giá học thuật từng bài và kiểm tra quy định bảo vệ dữ liệu trẻ em.
- 100 bài Toán 9 tại `src/data/draft/math9-question-bank.json` là **bản nháp sinh tự động**; không có bài nào được tự động xuất bản. Dùng `node scripts/generate-tutor-math9-bank.mjs` để tái tạo, `npm test` để kiểm tra tính nhất quán; cần người có chuyên môn duyệt.
- Hướng dẫn vận hành: [Tutor Pilot Runbook](docs/tutor-pilot-runbook.md).

### Các không gian trong ứng dụng

- Học sinh: `http://localhost:3000/`.
- Giáo viên: `http://localhost:3000/giao-vien` — theo dõi lớp học, xem tiến độ học sinh và tạo bài tập.
- Quản trị: `http://localhost:3000/quan-tri` — tìm kiếm, thêm/khóa hồ sơ người dùng và kiểm duyệt học liệu.

Trong môi trường DEV có bộ chuyển vai trò ở góc trên để kiểm thử ba không gian. Production không hiển thị role switch demo. Menu bên trái mở các trang con; đường dẫn hỗ trợ tải lại và nút quay lại của trình duyệt.

Hai không gian mới sử dụng dữ liệu minh họa. Bài tập giao và hồ sơ mẫu được lưu trong `localStorage` của trình duyệt. Chỉnh sửa và duyệt học liệu hiện chỉ thay đổi phiên đang mở, chưa ghi về dịch vụ học liệu; tải lại trang sẽ đọc lại nguồn dữ liệu. Bộ chuyển vai trò chỉ phục vụ trải nghiệm giao diện, chưa có đăng nhập, phân quyền phía máy chủ hay đồng bộ dữ liệu giữa người dùng. Thêm hồ sơ không tạo tài khoản đăng nhập; giao bài và duyệt nội dung không gửi thông báo thực tế.

Có thể chạy bằng Bun: `bun install` rồi `bun --bun run dev`. Kiểm tra mã bằng `bun --bun run lint` và `bun --bun run build`.

Kiểm thử: `npm run lint`, `npm test`, `npm run build`. Để kiểm tra trình duyệt, chạy `npx playwright install chromium` một lần rồi `npm run test:e2e`. Responsive QA chạy 9 kích thước (360–1920px), kiểm tra điều hướng, overflow, map toàn màn hình, Focus Studio và không gian giáo viên/quản trị trong `tests/e2e/responsive-layout.spec.cjs`. Playwright dùng học liệu cục bộ ở cổng 3001 để không phụ thuộc dữ liệu dịch vụ; có thể đổi cổng bằng `PLAYWRIGHT_PORT` hoặc chọn Chromium có sẵn bằng `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

### Trải nghiệm học sinh

- Hôm nay: nhiệm vụ tiếp theo, xem trước bài học, tiến độ theo chủ đề và các lần tự sửa đã ghi nhận.
- Knowledge Universe: tìm/lọc chủ đề, phóng to và di chuyển bản đồ, mở bài học hoặc bài luyện phù hợp.
- Focus Studio: kiểm tra các dạng toán được hỗ trợ, gợi ý từng bước, lưu nháp riêng từng bài, bảng vẽ, đồ thị và Algebra Tiles.
- Thinking Replay: phát/dừng, tua, đổi tốc độ, lưu lỗi cần xem lại và xem bản phác thảo đã lưu. Dòng thời gian chỉ lấy từ thao tác đã ghi nhận; gợi ý hiện theo quy tắc biên soạn, chưa kết nối mô hình AI hay nhận dạng chữ viết.

Logo điều khiển sidebar: điện thoại <768px dùng drawer + bottom nav; tablet/laptop 768–1439px dùng icon rail 72px mở overlay; desktop từ 1440px có thể ghim sidebar rộng 288px. Tìm kiếm mở từ icon trên header hoặc Ctrl/⌘ K. Course navigation và breadcrumb nằm trong nội dung, không phải fixed header. Trạng thái menu và bài làm được lưu trên thiết bị. Chi tiết: [Responsive Layout](docs/responsive-layout.md).

### Cấu trúc học liệu

`Lớp → Môn → Chủ đề → Bài học / Dạng bài → Lý thuyết → Ví dụ minh họa → Bài tập`

- `/hoc-bai`: danh mục môn theo lớp. Các môn đã đăng ký lấy từ [hồ sơ minh họa](src/data/demo/student.json); các lớp/môn khác hiển thị trạng thái chưa đăng ký, không mở nội dung bài học.
- Mỗi bài có đường dẫn riêng, ví dụ `/hoc-bai?grade=9&subject=toan&topic=ham-so&lesson=ham-so-bac-hai&stage=theory`. Các phần `examples` và `exercises` tương ứng ví dụ và bài tập. Bài chưa xuất bản không mở được ở giao diện học sinh.
- `/quan-tri/hoc-lieu`: chọn lớp, môn, chủ đề; tạo/sửa chủ đề và bài; biên soạn ba phần nội dung, lưu nháp, xem trước, xuất bản hoặc ngừng xuất bản. Bài được xuất bản chỉ khi đủ nội dung và đáp án. Các thay đổi dùng chung với giao diện học sinh trong phiên đang mở, chưa lưu về máy chủ.
- Dữ liệu và kiểm tra quyền học mẫu nằm trong `src/data/curriculum.ts`; trạng thái dùng chung tại `src/context/CurriculumContext.tsx`. Tiến độ chỉ ghi nhận sau khi trả lời đúng toàn bộ bài tập, phần thưởng ghi nhận một lần mỗi bài. Công thức vẫn được hiển thị trong nội dung, không dùng tên công nghệ làm tên môn hoặc tên tính năng.

Giao diện dùng cùng design language với [gen.ai.vn](https://gen.ai.vn/): palette navy–teal–cyan–sky, Plus Jakarta Sans, Material Symbols Rounded SVG, semantic surface/control và PWA branding thống nhất. Đây vẫn là bản trải nghiệm phía trình duyệt; quyền học thật cần được kiểm tra ở máy chủ khi tích hợp backend.

### Bố cục tham khảo từ dự án cùng hệ thống

Đối chiếu mã nguồn [laomatday/gen.ai.vn](https://github.com/laomatday/gen.ai.vn) tại commit `a86492da0f0915758204fdf917e75aee6d0c9b9f`:

- `DashboardView.tsx` và `dashboard/PanelHeader.tsx`: quản trị bắt đầu bằng danh sách có tìm kiếm, lọc trạng thái và thao tác tạo bài. Màn hình biên soạn riêng gồm cột nội dung và cột phân loại/xuất bản; quay lại danh sách giữ bộ lọc.
- `ArticleBlocksEditor.tsx`: các mục nội dung được đánh số, có thao tác đổi thứ tự và xác nhận trước khi xóa nội dung đã nhập. Học liệu vẫn giữ ba phần riêng: lý thuyết, ví dụ và bài tập.
- `ArticleArchive.tsx` và `ArticleCard.tsx`: danh sách bài trong môn học có tìm kiếm, sắp xếp, lọc chủ đề và đường dẫn riêng cho từng bài.
- `ArticleDetail.tsx` và `article-unified.css`: trang đọc có tiêu đề/mô tả rõ ràng, vùng nội dung rộng, thanh chuyển phần và mục lục bám theo nội dung. **Vị trí đọc** chỉ biểu thị vị trí cuộn; hoàn thành bài vẫn yêu cầu làm đúng toàn bộ bài tập.

Các bố cục này dùng chung dữ liệu chương trình học và tiến độ hiện có.

### Rà soát cấu hình và dữ liệu minh họa

Xem [báo cáo hardcode](docs/hardcode-audit.md) để phân biệt cấu hình triển khai, dữ liệu mẫu, trạng thái thực trên thiết bị và các hằng số trình bày. Mọi biến `VITE_` đều được đưa vào mã trình duyệt; chỉ dùng publishable key, không điền khóa bí mật hoặc service-role key.
