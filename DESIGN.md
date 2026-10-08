# Giao diện genAi Learning

## Nguồn tham chiếu

UI được đối chiếu với [laomatday/gen.ai.vn](https://github.com/laomatday/gen.ai.vn), commit `a86492da0f0915758204fdf917e75aee6d0c9b9f`:

| Mã nguồn tham chiếu                                           | Áp dụng tại dự án này                                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/index.css`: `ui-field`, `ui-search`, `ui-btn`            | Ô nhập bo góc, tìm kiếm dạng viên thuốc, nút navy, vòng focus sky, các trạng thái lỗi/khóa |
| `src/components/GeminiSelect.tsx`                             | Combobox cùng bề mặt menu; bàn phím, gõ để tìm, trạng thái đã chọn                         |
| `src/index.css`: `ui-popover`, `ui-menu-item`, `ui-segmented` | Menu nền đặc, mục được trỏ tới và mục đã chọn rõ ràng; nhóm lựa chọn dùng chung            |
| `docs/design-system-and-pwa.md`                               | Một nguồn token; feature chỉ tổ chức bố cục; biểu tượng SVG cục bộ                         |

Giữ nhịp giao diện của hệ thống: nền canvas, chữ navy/ink, teal cho điểm nhấn. Trạng thái thành công, lưu ý và lỗi dùng màu theo ý nghĩa. Tutor là PWA chính thức; manifest, icon, theme-color và trạng thái offline phải dùng cùng nguồn nhận diện genAi. Giao diện hiện ưu tiên light mode; không tự tạo palette khác.

## Một nguồn cho hình thức

- `src/index.css`: core CSS bám `gen.ai.vn/src/index.css` — brand tokens, type scale, breakpoints, surfaces, fields, buttons, cards, badge/chip/tab, header/menu/dialog/state và reduced-motion. Cuối file có một khối `@theme inline` được đánh dấu rõ để compile các tên semantic legacy của Tutor (`primary`, `secondary`, `outline-variant`…) trực tiếp sang token genAi; khối này chỉ là alias, không tạo palette mới.
- `src/public-site.css`, `src/components/article-unified.css`, `src/components/site/*-reference.css`: giữ cùng cấu trúc/path với `gen.ai.vn` để có thể diff/sync trực tiếp. Chỉ import composition khi Tutor thực sự dùng loại trang tương ứng.
- `src/fonts.css`: self-hosted font CSS được giữ **byte-identical** với `gen.ai.vn` và được import trước core CSS. Tutor dùng cùng `@fontsource-variable` 5.3.0 cho Plus Jakarta Sans, JetBrains Mono và Newsreader; không còn phụ thuộc Google Fonts runtime.
- `src/styles/tutor-compat.css`: lớp runtime adapter cho widget riêng của Tutor (custom Select, native `<dialog>`, sidebar nav, native progress). Native dialog bắt buộc giữ `dialog.ui-dialog:not([open]) { display: none; }`; không định nghĩa lại brand palette hoặc semantic theme trong file này.
- `src/components/ui`: ngữ nghĩa, tương tác và khả năng truy cập. Progress phải dùng native `<progress>` qua component `Progress`; không tự dựng `div role="progressbar"`.
- `src/components/icons`: cùng Material Symbols Rounded SVG (weight 500) với `gen.ai.vn`; feature chỉ gọi qua `Icon`, không import thư viện icon khác.
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
| `Icon`              | `name` hoặc chuỗi children; dùng cùng Material Symbols Rounded SVG (weight 500) với `gen.ai.vn`, giữ alias tên icon của dữ liệu cũ. Mặc định trang trí; truyền `aria-label` khi có ý nghĩa độc lập.                          |
| `Modal`             | `open`, `onClose`, `title`, `description?`, `children`, `footer?`. Native dialog bảo đảm nền inert, giữ focus, trả focus, đóng bằng Escape và bấm ngoài.                                                      |

`surface` dành cho hàng/thẻ tương tác có bố cục riêng, không phải hành động chính. Nó vẫn dùng focus và trạng thái disabled chung. Điều hướng dùng `ui-nav-item` và `aria-current="page"`; nhóm lựa chọn dùng `ui-segmented` với `aria-pressed` hoặc `aria-selected` đúng ngữ nghĩa.

Thanh tiến độ dùng `<progress className="ui-progress" value={value} max={total} aria-label="…" />`, giữ ngữ nghĩa native và cùng hình thức trên Chromium/Firefox.

## Tương tác cần giữ khi nâng cấp

- Nút có vùng bấm ít nhất 44 px trong biến thể thông thường; trường nhập 16 px trên điện thoại để tránh iOS tự phóng to. Cỡ chữ nhỏ nhất là caption 12 px.
- Select: mũi tên mở/di chuyển, Home/End tới đầu/cuối, Enter/Space chọn, Escape bỏ thay đổi, Tab đóng và chuyển focus. Mục bị khóa không được chọn; gõ chữ có hỗ trợ tiếng Việt không dấu.
- Select giữ control native ẩn để form có giá trị, validation, reset và ref. `onChange` nhận sự kiện từ control native thật. Popover neo theo viewport, đổi hướng khi thiếu chỗ và nằm trong top layer của dialog khi cần.
- Phần thân hộp thoại cuộn; tiêu đề và hành động luôn thấy. Popover không bị cắt bởi vùng cuộn của trình biên soạn.
- Tôn trọng `prefers-reduced-motion`; trạng thái focus không phụ thuộc hover.

Khi thêm control, cập nhật nguồn chung, kiểm tra bàn phím + điện thoại và các màn hình đang dùng nó. Không tạo bản sao CSS trong feature để sửa riêng một màn hình.


## Quy ước môi trường

- Bộ chuyển vai trò Học sinh / Giáo viên / Quản trị chỉ xuất hiện trong DEV để kiểm thử UI. Production không trình bày role switch demo như một tính năng người dùng.
- Màu PWA chuẩn: theme `#243C8F`, canvas `#F7FAFC`; artwork chỉ dùng navy → teal → cyan → sky của genAi.
- `scripts/check-architecture.mjs` chặn màu xanh Tailwind cũ, import icon ngoài Material Symbols SVG dùng chung, chữ dưới 12 px, progress bar tự dựng, semantic alias không được compile bằng `@theme inline`, và regression làm native dialog hiện khi chưa `open`.


## Learning OS

Student UX không còn tổ chức quanh một dashboard tính năng. Trục chính là bốn surface liên hoàn:

- **Mission** (`/`): AI chọn một nhiệm vụ ngắn tiếp theo từ tiến độ thật; học sinh không phải tự tìm bài.
- **Map** (`/hoc-bai`): curriculum được nhìn như mạng prerequisite/mastery. Desktop dùng knowledge graph; mobile dùng knowledge path dọc để tránh co/chồng node.
- **Studio** (`/tu-giai`): vùng reasoning canvas là trọng tâm; AI Pulse chỉ can thiệp khi cần và mọi gợi ý/check đều trở thành tín hiệu học tập.
- **Replay** (`/replay`): xem lại reasoning trace + Mistake DNA, sau đó tạo bridge/intervention cho mission kế tiếp.

### Product signature

1. **AI là interaction layer**, không phải một tab chat riêng.
2. **Reasoning trace > final answer**: sản phẩm ưu tiên ghi nhận cách giải, hint usage, self-correction và misconception.
3. **Adaptive bridge**: khi prerequisite yếu, Tutor tạo một bước ôn ngắn thay vì buộc học lại cả chương.
4. **Mastery identity**: ghi nhận hành vi học tốt (tự sửa lỗi, kiên trì, dùng gợi ý hợp lý), không chỉ điểm/GP.
5. **Rail thay sidebar dashboard**: student desktop dùng rail 80px; Teacher/Admin vẫn giữ shell quản trị đầy đủ.
6. **Mobile không thu nhỏ desktop graph**: dùng composition riêng cho một tay và viewport hẹp.

Mọi redesign Student mới phải bảo toàn journey `Mission → Map → Studio → Replay → Mission`; thêm feature mới chỉ được vào rail chính nếu nó phục vụ trực tiếp journey này.


## Student Experience V2

Student shell có hai trạng thái desktop:

- **Collapsed rail**: 80px, ưu tiên icon và tốc độ chuyển surface.
- **Expanded sidebar**: 280px, hiển thị label + description + mastery context. Trạng thái được lưu bằng `storageKeys.studentSidebarExpanded`.
- Toggle expand/collapse nằm ngay trên sidebar, không dùng setting ẩn.
- Header và content phải dịch cùng chiều rộng sidebar; không được để sidebar chồng nội dung.

Mobile không thu nhỏ sidebar desktop:

- Core journey **Mission / Map / Studio / Replay** luôn có bottom navigation.
- Drawer hamburger dành cho secondary tools: Đánh giá, Lịch học, Radar, Thành tựu và hồ sơ.
- Main content phải chừa safe space cho bottom nav.

### Shared student primitives

Các route học sinh ngoài 4 signature surfaces dùng chung:

- `StudentPageHeader`: eyebrow + icon + H1 + description + meta + actions.
- `StudentSignalStrip`: 2–4 tín hiệu ngắn giúp học sinh biết “đang ở đâu / tiếp theo là gì”.
- `StudentSectionHeader`: section title + description + action.
- `learning-os-page`: cùng max-width, vertical rhythm và mobile bottom spacing.

Các route phải dùng cùng grammar này: deep-link bài học/topic, Learning Radar, Learning Rhythm, Mastery Rewards. Không quay lại pattern mỗi module tự thiết kế một header/card system riêng.

### Student-first UX

1. Ưu tiên **next action** hơn tổng quan dữ liệu.
2. Dùng ngôn ngữ ngắn, động từ rõ: bắt đầu, tiếp tục, quay lại, replay, bridge.
3. Progress/mastery phải nhìn thấy trong context thay vì chỉ nằm ở trang Tiến bộ.
4. Ảnh minh họa quan trọng phải local/self-hosted hoặc có fallback nội bộ; không phụ thuộc asset bên ngoài dễ gãy.
5. Mobile core navigation tối đa 4 điểm; secondary feature không được chen vào bottom nav.


## Database-driven learning content

Curriculum production dùng **database-first**:

- Supabase project: `genAi Education`.
- Read models: `tutor_subjects`, `tutor_topics`, `tutor_lessons`.
- Frontend chỉ dùng **publishable key + SELECT**.
- Tables bật RLS; client chỉ đọc row `status = published`.
- Không dùng service role/secret key trong browser.
- JSON trong `src/data/curriculum` chỉ là fallback cho offline/dev hoặc khi `VITE_CONTENT_SOURCE=local`.

### Content capabilities theo môn

Không giả định mọi môn đều cần LaTeX. `Subject.capabilities` mô tả công cụ phù hợp:

- `math`: công thức/KaTeX.
- `images`: hình minh họa.
- `audio`: audio/listening.
- `vocabulary`: thẻ từ vựng.
- `dialogue`: hội thoại.
- `code`: nội dung lập trình.

`AdaptiveText` chỉ lazy-load MathLatex khi block/text thực sự có math syntax hoặc `format="math"`. `format="plain"` không gọi KaTeX.

### Lesson content blocks

`Lesson.contentBlocks` là JSON block-based để database có thể tạo nhiều trải nghiệm học khác nhau:

- `paragraph`
- `image`
- `math`
- `callout`
- `vocabulary`
- `dialogue`
- `bullets`
- `quote`

Renderer chung: `src/components/LessonContentRenderer.tsx`.

Lesson card dùng `thumbnailUrl`; lesson body dùng image blocks / `heroImageUrl`. Media learner-facing phải có alt text khi mang ý nghĩa nội dung. Asset minh họa mặc định được self-host tại `public/learning-media`; database lưu URL để sau này chuyển sang Supabase Storage/CDN mà không đổi component.

### Multi-subject contract

Student có thể đăng ký nhiều môn. Map phải cho chuyển môn mà không đổi shell:

- Toán có thể dùng `math=true`.
- Tiếng Anh test hiện dùng `math=false`, `images=true`, `vocabulary=true`, `dialogue=true`.
- Thêm môn mới bằng subject + topics + lessons trong DB, không hard-code một renderer riêng cho từng môn.


## AI Pulse V3

Student product language is now **AI Pulse V3** on top of the existing Learning OS architecture.

### Global shell

- genAi Tutor remains the product brand; AI Pulse is the cognitive/adaptive layer.
- Student desktop header is a command bar with search (`Cmd/Ctrl+K`), streak, Deep Focus, Replay Mode, notification and learner profile.
- Desktop sidebar remains 80px collapsed / 280px expanded with persistence.
- Mobile keeps the 4-point bottom journey navigation.
- Student UI text has a computed minimum of 12px; `<small>` cannot bypass this floor.

### Home

Home is a cognitive dashboard, not a generic module grid:

- Learning journey hero.
- AI Cognitive Pulse.
- Today Mission + visual problem preview.
- Exam journey progress.
- Cognitive Profile radar.
- Learner profile signals.
- Adaptive learning queue.
- AI Coach bridge recommendation.

### Knowledge Universe

Knowledge Map must show:

- Subject/course context.
- Node-state legend.
- AI Diagnostic / Adaptive Bridge.
- Central knowledge graph with explicit mastery, gap and prerequisite states.
- Right-side Node Intelligence: mastery, prerequisites, support assets, Mistake DNA and exam importance.
- Score/mastery projection summaries.

### Focus Studio

Focus Studio is a reasoning workspace:

- Session status / Socratic Guard.
- Tool ribbon.
- Reasoning Canvas with visible stages: attempt → consistency check → retry → completion.
- AI Pulse & Cognitive Guide.
- Socratic questions and live reasoning trace.
- Visual manipulatives such as Algebra Tiles.
- AI never replaces the learner's reasoning with a direct solution by default.

### Thinking Replay

Replay is a cognition timeline, not a result report:

- Playback and speed controls.
- Timestamped thought events.
- Misconception detection.
- Socratic intervention.
- Self-correction moment.
- Mistake DNA + Dynamic Bridge.
- Recognized cognitive signals.
- Stroke Replay / working-memory snapshot.

### Visual principles

- White / cool-gray base, genAi navy primary, teal accent, warning orange and sparse danger red.
- Rounded 2xl–3xl surfaces, refined shadows and clear information hierarchy.
- Dense information is grouped into narrative panels rather than dashboard grids.
- Illustration is self-hosted where possible; current journey hero is `/learning-media/learning-horizon.svg`.
- Do not add a new color family outside the genAi token system.


## ChatGPT-style sidebar + Gemini header

Student desktop shell dùng mô hình **rail + panel**:

- Rail cố định **60px** luôn hiển thị.
- Click logo trên rail để mở/đóng panel **288px**.
- Khi panel mở, header + main content dịch từ 60px → **348px**; panel không được đè nội dung.
- Control **Giữ sidebar mở** là pin state:
  - pinned: giữ panel qua navigation và reload;
  - unpinned: panel vẫn mở tạm, nhưng tự thu sau navigation.
- Pin state lưu ở `storageKeys.studentSidebarPinned`.
- Quick icons trên rail điều hướng trực tiếp 4 core surfaces.
- Mobile không hiển thị rail; sidebar trở thành drawer ~320px với backdrop và focus-trap hiện có.

Student header lấy cảm hứng từ Gemini:

- chiều cao **60px**;
- graphite/frosted surface;
- context pill `AI Pulse + current page` ở trái;
- compact utility cluster;
- command search ở giữa, giữ `Cmd/Ctrl+K`;
- streak / Replay / notification / profile gom về bên phải;
- không đưa quá nhiều dashboard metric lên header.

Không thay đổi page-level AI Pulse V3, DB-first curriculum, Teacher/Admin shell hoặc mobile bottom nav khi chỉnh app shell.


## Student shell: rail + Gemini command bar

Student shell dùng mô hình hai lớp lấy cảm hứng từ ChatGPT/Gemini nhưng giữ nhận diện genAi:

- **Desktop rail**: 60px, luôn hiện, chứa logo + 4 core surfaces + profile.
- **Logo là menu trigger**: click logo mở/đóng panel 288px.
- **Panel**: Bắt đầu phiên học mới, Giữ sidebar mở, Đã ghim, Gần đây, Không gian học tập, Công cụ & tiến độ, mastery/profile.
- **Pin sidebar**: lưu bằng `storageKeys.studentSidebarPinned`; khi pinned, navigation/reload không đóng panel.
- **Recent routes**: lưu bằng `storageKeys.studentRecentRoutes`, tối đa 6 route.
- **Mobile**: không có rail/pin; dùng drawer + bottom nav.

### Theme contract

Light theme là mặc định và **header/sidebar phải sáng**:
- rail/panel: light gray / white;
- Gemini header: translucent white;
- ink text và border theo genAi tokens.

Dark graphite chỉ được đặt trong selector `.dark ...`; không hard-code dark shell ở state mặc định.

### Width contract

Student desktop không dùng container 86rem cũ:
- `.app-main--student` là fluid;
- `.learning-os-page` tối đa 112rem;
- padding ngang dùng `clamp()`.

Ở viewport 1920px với rail collapsed, learning surface mục tiêu khoảng 1.75–1.8k px; mở sidebar thì header/content phải dịch cùng 288px panel, không overlap.
