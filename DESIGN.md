# Giao diện genAi Learning

## Nguồn tham chiếu

UI được đối chiếu với [laomatday/gen.ai.vn](https://github.com/laomatday/gen.ai.vn), commit `a86492da0f0915758204fdf917e75aee6d0c9b9f`:

| Mã nguồn tham chiếu                                           | Áp dụng tại dự án này                                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/index.css`: `ui-field`, `ui-search`, `ui-btn`            | Ô nhập bo góc, tìm kiếm dạng viên thuốc, nút navy, vòng focus sky, các trạng thái lỗi/khóa |
| `src/components/GeminiSelect.tsx`                             | Combobox cùng bề mặt menu; bàn phím, gõ để tìm, trạng thái đã chọn                         |
| `src/index.css`: `ui-popover`, `ui-menu-item`, `ui-segmented` | Menu nền đặc, mục được trỏ tới và mục đã chọn rõ ràng; nhóm lựa chọn dùng chung            |
| `docs/design-system-and-pwa.md`                               | Một nguồn token; feature chỉ tổ chức bố cục; biểu tượng SVG cục bộ                         |

Giữ nhịp giao diện của hệ thống: nền canvas, chữ navy/ink, teal cho điểm nhấn. Trạng thái thành công, lưu ý và lỗi dùng màu theo ý nghĩa. Không mở rộng sang chế độ tối hoặc PWA khi chưa có yêu cầu.

## Một nguồn cho hình thức

- `src/styles/tokens.css`: màu, font, kích thước control, bo góc, bóng, chiều cao header và lớp nổi. Đây là nguồn giá trị thiết kế duy nhất. Tên token cũ là lớp tương thích cho các màn hình hiện có.
- `src/styles/primitives.css`: trạng thái và hình thức của thành phần dùng chung.
- `src/components/ui`: ngữ nghĩa, tương tác và khả năng truy cập.
- `design-preview.html`: trang xem trước dùng component thật, mở ở `/design-preview.html` khi chạy dev server; không nằm trong điều hướng sản phẩm.
- `design-tokens.json`: bản xuất tự động cho công cụ thiết kế; chạy `node scripts/export-design-tokens.mjs` sau khi sửa CSS. Không sửa JSON bằng tay.
- Feature dùng utility cho bố cục (grid, flex, khoảng cách, độ rộng), không sao chép bộ class màu/viền/focus cho từng nút hoặc ô nhập.

Đổi nhận diện thương hiệu bằng token. Thêm biến thể bằng API component và CSS chung. Không thêm mã màu trực tiếp vào TSX hoặc inline style. Inline style dành cho giá trị tính toán thực sự như vị trí popover và phần trăm tiến độ.

## API sử dụng

```tsx
import { Button, Field, Input, Select, Badge, Modal } from '@/src/components/ui';

<Field label="Tên bài học" hint="Tên ngắn gọn, thể hiện nội dung chính.">
  <Input value={title} onChange={event => setTitle(event.target.value)} />
</Field>

<Field label="Trạng thái">
  <Select value={status} onChange={event => setStatus(event.target.value)}>
    <option value="draft">Bản nháp</option>
    <option value="published">Đã xuất bản</option>
  </Select>
</Field>

<Button onClick={save}>Lưu bài học</Button>
<Badge tone="success">Đã lưu</Badge>
```

| Component           | Quy ước                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`            | `variant`: `primary`, `secondary`, `ghost`, `danger`, `surface`; `size`: `sm`, `md`, `lg`, `icon`. Mặc định `type="button"`; form gửi dữ liệu phải ghi `type="submit"`. Nút chỉ có icon phải có `aria-label`. |
| `buttonStyles`      | Cùng biến thể nút cho liên kết `<a href>`; giữ hành vi mở tab mới của liên kết.                                                                                                                               |
| `Input`, `Textarea` | Props/ref native; `Input type="search"` tự dùng kiểu tìm kiếm; checkbox/radio dùng cùng màu focus.                                                                                                            |
| `Field`             | Tự liên kết một control với `label`, `hint`, `error` qua ID và `aria-describedby`; lỗi đặt `aria-invalid`.                                                                                                    |
| `Select`            | Một giá trị, children `<option>`/`<optgroup>`, `value` hoặc `defaultValue`, `onChange(event.target.value)` như native. `variant="pill"` dùng trong thanh lọc.                                                 |
| `Badge`, `Alert`    | Tone theo trạng thái: `info`, `success`, `warning`, `danger`; Badge thêm `neutral`, `primary`.                                                                                                                |
| `Card`              | Bề mặt dùng chung, feature tự chọn padding và bố cục.                                                                                                                                                         |
| `Icon`              | `name` hoặc chuỗi children; SVG cục bộ từ dependency Lucide sẵn có, giữ alias tên icon của dữ liệu cũ. Mặc định trang trí; truyền `aria-label` khi có ý nghĩa độc lập.                                        |
| `Modal`             | `open`, `onClose`, `title`, `description?`, `children`, `footer?`. Native dialog bảo đảm nền inert, giữ focus, trả focus, đóng bằng Escape và bấm ngoài.                                                      |

`surface` dành cho hàng/thẻ tương tác có bố cục riêng, không phải hành động chính. Nó vẫn dùng focus và trạng thái disabled chung. Điều hướng dùng `ui-nav-item` và `aria-current="page"`; nhóm lựa chọn dùng `ui-segmented` với `aria-pressed` hoặc `aria-selected` đúng ngữ nghĩa.

Thanh tiến độ dùng `<progress className="ui-progress" value={value} max={total} aria-label="…" />`, giữ ngữ nghĩa native và cùng hình thức trên Chromium/Firefox.

## Tương tác cần giữ khi nâng cấp

- Nút có vùng bấm ít nhất 44 px trong biến thể thông thường; trường nhập 16 px trên điện thoại để tránh iOS tự phóng to.
- Select: mũi tên mở/di chuyển, Home/End tới đầu/cuối, Enter/Space chọn, Escape bỏ thay đổi, Tab đóng và chuyển focus. Mục bị khóa không được chọn; gõ chữ có hỗ trợ tiếng Việt không dấu.
- Select giữ control native ẩn để form có giá trị, validation, reset và ref. `onChange` nhận sự kiện từ control native thật. Popover neo theo viewport, đổi hướng khi thiếu chỗ và nằm trong top layer của dialog khi cần.
- Phần thân hộp thoại cuộn; tiêu đề và hành động luôn thấy. Popover không bị cắt bởi vùng cuộn của trình biên soạn.
- Tôn trọng `prefers-reduced-motion`; trạng thái focus không phụ thuộc hover.

Khi thêm control, cập nhật nguồn chung, kiểm tra bàn phím + điện thoại và các màn hình đang dùng nó. Không tạo bản sao CSS trong feature để sửa riêng một màn hình.
