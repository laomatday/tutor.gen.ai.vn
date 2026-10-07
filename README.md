<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/cbc49f95-b7d2-476f-9808-c4c50a6b6f61

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

### Các không gian trong ứng dụng

- Học sinh: `http://localhost:3000/`.
- Giáo viên: `http://localhost:3000/giao-vien` — theo dõi lớp học, xem tiến độ học sinh và tạo bài tập.
- Quản trị: `http://localhost:3000/quan-tri` — tìm kiếm, thêm/khóa hồ sơ người dùng và kiểm duyệt học liệu.

Dùng bộ chuyển vai trò ở góc trên để chuyển không gian. Menu bên trái mở các trang con; đường dẫn hỗ trợ tải lại và nút quay lại của trình duyệt.

Hai không gian mới sử dụng dữ liệu minh họa. Bài tập, hồ sơ và trạng thái kiểm duyệt được lưu trong `localStorage` của trình duyệt. Bộ chuyển vai trò chỉ phục vụ trải nghiệm giao diện, chưa có đăng nhập, phân quyền phía máy chủ hay đồng bộ dữ liệu giữa người dùng. Thêm hồ sơ không tạo tài khoản đăng nhập; giao bài và duyệt nội dung không gửi thông báo thực tế.

Có thể chạy bằng Bun: `bun install` rồi `bun --bun run dev`. Kiểm tra mã bằng `bun --bun run lint` và `bun --bun run build`.

### Cấu trúc học liệu

`Lớp → Môn → Chủ đề → Bài học / Dạng bài → Lý thuyết → Ví dụ minh họa → Bài tập`

- `/hoc-bai`: danh mục môn theo lớp. Tài khoản Lê Phương Linh chỉ đăng ký **Toán lớp 9**; các lớp/môn khác hiển thị thông tin và trạng thái chưa đăng ký, không mở nội dung bài học.
- Mỗi bài có đường dẫn riêng, ví dụ `/hoc-bai?grade=9&subject=toan&topic=ham-so&lesson=ham-so-bac-hai&stage=theory`. Các phần `examples` và `exercises` tương ứng ví dụ và bài tập. Bài chưa xuất bản không mở được ở giao diện học sinh.
- `/quan-tri/hoc-lieu`: chọn lớp, môn, chủ đề; tạo/sửa chủ đề và bài; biên soạn ba phần nội dung, lưu nháp, xem trước, xuất bản hoặc ngừng xuất bản. Bài được xuất bản chỉ khi đủ nội dung và đáp án. Các thay đổi dùng chung với giao diện học sinh trên cùng trình duyệt.
- Dữ liệu và kiểm tra quyền học mẫu nằm trong `src/data/curriculum.ts`; trạng thái dùng chung tại `src/context/CurriculumContext.tsx`. Tiến độ chỉ ghi nhận sau khi trả lời đúng toàn bộ bài tập, phần thưởng ghi nhận một lần mỗi bài. Công thức vẫn được hiển thị trong nội dung, không dùng tên công nghệ làm tên môn hoặc tên tính năng.

Giao diện tham khảo [gen.ai.vn](https://gen.ai.vn/) và [danh mục khóa học](https://gen.ai.vn/khoa-hoc): xanh navy/xanh ngọc, nền sáng, thẻ môn học và nút bo tròn. Đây vẫn là bản trải nghiệm phía trình duyệt; quyền học thật cần được kiểm tra ở máy chủ khi tích hợp backend.

### Bố cục tham khảo từ dự án cùng hệ thống

Đối chiếu mã nguồn [laomatday/gen.ai.vn](https://github.com/laomatday/gen.ai.vn) tại commit `a86492da0f0915758204fdf917e75aee6d0c9b9f`:

- `DashboardView.tsx` và `dashboard/PanelHeader.tsx`: quản trị bắt đầu bằng danh sách có tìm kiếm, lọc trạng thái và thao tác tạo bài. Màn hình biên soạn riêng gồm cột nội dung và cột phân loại/xuất bản; quay lại danh sách giữ bộ lọc.
- `ArticleBlocksEditor.tsx`: các mục nội dung được đánh số, có thao tác đổi thứ tự và xác nhận trước khi xóa nội dung đã nhập. Học liệu vẫn giữ ba phần riêng: lý thuyết, ví dụ và bài tập.
- `ArticleArchive.tsx` và `ArticleCard.tsx`: danh sách bài trong môn học có tìm kiếm, sắp xếp, lọc chủ đề và đường dẫn riêng cho từng bài.
- `ArticleDetail.tsx` và `article-unified.css`: trang đọc có tiêu đề/mô tả rõ ràng, vùng nội dung rộng, thanh chuyển phần và mục lục bám theo nội dung. **Vị trí đọc** chỉ biểu thị vị trí cuộn; hoàn thành bài vẫn yêu cầu làm đúng toàn bộ bài tập.

Các bố cục này dùng chung dữ liệu chương trình học và tiến độ hiện có.
