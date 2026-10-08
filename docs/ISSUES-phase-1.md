# genAi Tutor — Giai đoạn 1: sửa lỗi P0

Mục tiêu của giai đoạn này là đưa trạng thái sản phẩm từ **Đỏ** lên **Vàng**: đủ để demo nội bộ mà không có thông tin sai về học thuật hay số liệu. Phần cấu trúc lại điều hướng, đổi tên các mục nav chính và tìm kiếm thật thuộc Giai đoạn 2. Issue nào chạm vào những phần đó chỉ sửa đúng điểm sai, không thiết kế lại.

Mốc tham chiếu: commit `e6f6358`. Số dòng trích dẫn tính theo commit này.

| # | Issue | Mức | Ước lượng | Phụ thuộc |
| --- | --- | --- | --- | --- |
| I-01 | Sửa ký tự `\n` trong `index.html` | P2 | 0,1 ngày | — |
| I-02 | Dựng khung e2e tối thiểu để nghiệm thu | P1 | 0,5 ngày | — |
| I-03 | Khôi phục pipeline icon, chặn fallback im lặng | P1 | 0,75 ngày | I-02 |
| I-04 | Một nguồn tiến độ duy nhất | P0 | 1 ngày | I-02 |
| I-05 | Luyện tập: gắn toàn bộ màn với đề đang mở, khôi phục gợi ý theo bậc | P0 | 1 ngày | I-02, I-03 |
| I-06 | Hôm nay và Xem lại: nội dung lấy từ bài và phiên thật | P0 | 0,75 ngày | I-04, I-05 |
| I-07 | Gỡ nhãn AI và chỉ số không có cơ sở | P0 | 0,75 ngày | I-04, I-06 |
| I-08 | Gỡ thuật ngữ nội bộ, thống nhất tên thương hiệu | P1 | 0,25 ngày | I-07 |

Tổng khoảng **5 ngày dev**, cộng khoảng **0,5 ngày của anh Nghĩa** để duyệt nội dung học thuật (I-05) và câu chữ (I-07).

**Mốc lên Vàng:**
1. Đóng đủ 8 issue.
2. Anh Nghĩa đi thử luồng Hôm nay → Luyện tập → Nộp bài → Xem lại trên điện thoại thật và không phát hiện nội dung sai.

---

## I-01 · Sửa ký tự `\n` trong `index.html`

**Nhãn:** phase-1, P2, area:shell

**Bằng chứng.** `index.html:5` có chuỗi `\n` dạng chữ ngay sau thẻ `<meta name="viewport">`. Trình duyệt coi đây là nội dung văn bản nên đóng `<head>` sớm, và chữ "\n" hiển thị mờ ở góc trên bên trái mọi trang (thấy rõ dưới header trên mobile).

**Việc cần làm.** Xóa chuỗi `\n` đó, giữ thẻ `<link rel="icon">` trên một dòng riêng.

**Tiêu chí nghiệm thu.**
1. `document.body.firstChild` không phải là text node chứa "\n".
2. Thẻ `link[rel=icon]` và `title` nằm trong `document.head`.

---

## I-02 · Dựng khung e2e tối thiểu để nghiệm thu

**Nhãn:** phase-1, P1, area:quality

**Bằng chứng.** CI hiện chạy typecheck, architecture check, unit test và build, tất cả đều pass. Tuy vậy 27% icon vẫn hỏng và đề bài lệch lời giải. CI chưa có test nào chạy giao diện thật.

**Việc cần làm.**
1. Thêm `@playwright/test` và `playwright.config.ts`. Chạy với `VITE_CONTENT_SOURCE=local` để kết quả ổn định, không phụ thuộc DB.
2. Viết helper `freshStudent(page)` để xóa `localStorage` trước mỗi test.
3. Viết test smoke cho 14 route × 2 viewport (390×844 và 1440×900). Mỗi route phải thỏa: không có `pageerror`, có đúng một `h1`, không có phần tử nào tràn ngang ra ngoài viewport.
4. Thêm job `e2e` vào `.github/workflows/ci.yml`.

**Ngoài phạm vi.** Visual diff (Giai đoạn 4).

**Tiêu chí nghiệm thu.**
1. `npm run e2e` chạy được ở local và trên CI.
2. Test smoke **được phép fail** ở các route hiện đang lỗi. Các issue sau sẽ làm chúng chuyển sang xanh.

---

## I-03 · Khôi phục pipeline icon, chặn fallback im lặng

**Nhãn:** phase-1, P1, area:design-system

**Bằng chứng.**
- `src/components/ui/Icon.tsx:141`: khi tên không có trong registry, component trả về `Info` mà không báo lỗi. Có **32/118** tên icon đang dùng rơi vào trường hợp này, kể cả `home` và `hub`. Hệ quả là 2/4 mục điều hướng chính trên rail và bottom nav đều hiện ⓘ.
- `src/components/icons/index.tsx:2` ghi file được sinh bởi `scripts/generate-icons.mjs` qua lệnh `npm run icons`, nhưng **cả script lẫn lệnh npm đều không tồn tại**. Vì vậy không ai thêm được icon mới đúng cách.
- Một số tên bị gán sai nghĩa:

| Tên | Đang render thành |
| --- | --- |
| `notifications` | Loa (`Campaign`) |
| `visibility_off` | Giống hệt `visibility` |
| `history`, `replay` | `RestartAlt` |
| `bar_chart`, `trending_up`, `insights`, `table_chart` | `Dashboard` |
| `more_horiz` | `Notes` |
| `quiz`, `radio_button_unchecked` | `UnknownDocument` |
| `person_add`, `person_search`, `manage_accounts` | `Person` |

**Việc cần làm.**
1. Thêm devDependency `@material-symbols/svg-500`. Em đã kiểm tra bản 0.47.6: package có 28/32 tên còn thiếu, 4 tên còn lại thay như sau:

   | Tên cũ | Thay bằng |
   | --- | --- |
   | `delete_outline` | `delete` |
   | `question_answer` | `forum` |
   | `room` | `location_on` |
   | `insights` | `analytics` |

2. Viết lại `scripts/generate-icons.mjs`:
   - Đọc danh sách tên từ `src/components/icons/icon-names.json`.
   - Lấy path từ `@material-symbols/svg-500/rounded/<name>.svg`.
   - Sinh ra `icons/index.tsx` và type `IconName`.
   - Thêm script `"icons"` vào `package.json`.
3. Registry dùng chính tên Material làm key. Bỏ các alias lệch nghĩa trong bảng trên.
4. Khai báo `Icon` với `name: IconName` để tên sai trong TSX fail ngay ở bước typecheck.
5. Với tên đến từ dữ liệu JSON hoặc DB, khi gặp tên lạ lúc runtime:
   - DEV: gọi `console.error("[Icon] unknown:", name)`.
   - Production: render một `span` rỗng cùng kích thước, không hiện ⓘ.
6. Thêm test `tests/icon-registry.test.ts`:

```ts
// Quét mọi tên icon trong src/**/*.ts(x) và src/data/**/*.json, so với registry.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import names from "../src/components/icons/icon-names.json" with { type: "json" };

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const patterns = [
  /<Icon[^>]*?\bname=\{?["']([a-z0-9_]+)["']/g,
  /<Icon[^>]*>([a-z0-9_]+)<\/Icon>/g,
  /\bicon["']?\s*:\s*["']([a-z0-9_]+)["']/g,
];

test("mọi tên icon đang dùng đều có trong registry", () => {
  const registry = new Set<string>(names);
  const missing = new Map<string, string>();
  for (const file of walk("src").filter((f) => /\.(tsx?|json)$/.test(f))) {
    const text = readFileSync(file, "utf8");
    for (const re of patterns)
      for (const m of text.matchAll(re))
        if (!registry.has(m[1])) missing.set(m[1], file);
  }
  assert.deepEqual([...missing], [], "Icon không có trong registry");
});
```

**Tiêu chí nghiệm thu.**
1. Test icon-registry pass. Thêm thử một tên sai vào một file bất kỳ thì test fail.
2. Chạy e2e smoke trên 14 route: không có console error `[Icon]`.
3. Bốn mục điều hướng chính hiển thị bốn icon khác nhau, đúng nghĩa.
4. `npm run icons` sinh lại `icons/index.tsx` mà không tạo diff khi danh sách tên không đổi.

---

## I-04 · Một nguồn tiến độ duy nhất

**Nhãn:** phase-1, P0, area:data

**Bằng chứng.** Cùng một trạng thái (đã hoàn thành 1 bài Toán 9) nhưng màn hình hiển thị 4 con số, tính bằng 4 công thức khác nhau:

| Vị trí | Công thức | Hiển thị |
| --- | --- | --- |
| `App.tsx:81` → sidebar; `TheoryLessonsView.tsx:126` → trang chủ đề | Gộp mọi môn đã đăng ký: 1/8 bài | 13% |
| `TodayView.tsx:78` | Riêng Toán 9: 1/6 bài | 17% |
| `KnowledgeMapView.tsx:73` | Trung bình % các chủ đề | 13% (con số này chỉ tình cờ trùng với sidebar) |
| `TodayView.tsx:234` | `Math.max(progress, 78)`, kèm Ngữ văn 62, Tiếng Anh 71, Ôn tập 41 viết cứng | 78% |

Ngoài ra còn hai lỗi liên quan:
- `TodayView.tsx:33`: radar dùng `Math.max(64, progress)`, tức là ép tiến độ không bao giờ hiển thị dưới mức sàn.
- `TheoryLessonsView.tsx:129`: `resumeLesson` sắp xếp theo `order` trên tất cả các môn. Vì vậy trang chủ đề Toán hiện "Next: First conditional", một bài Tiếng Anh.
- Home hiện tiến độ Ngữ văn dù học sinh không đăng ký môn này (`data/demo/student.json` chỉ có Toán 9 và Tiếng Anh 9).

**Việc cần làm.**
1. Thêm vào `src/features/curriculum/selectors.ts`:
   ```ts
   type CourseKey = { gradeId: string; subjectId: string };
   getCourseProgress(course: CourseKey, lessons, topics, completedIds)
     // → { completed, total, percent, nextLesson }
   getTopicProgress(topicId, lessons, completedIds)
     // → { completed, total, percent }
   ```
2. Thay toàn bộ các nơi đang tự tính tiến độ: Hôm nay, Lộ trình, sidebar, trang chủ đề, hồ sơ. Sidebar hiển thị tiến độ của khóa đang xem: lấy theo `subject` trên URL, nếu không có thì lấy khóa chính.
3. "Tổng thể chương" trên Lộ trình dùng tỷ lệ bài đã xong trên tổng số bài, không dùng trung bình % chủ đề. Lý do: chủ đề 2 bài và chủ đề 10 bài không nên có trọng số bằng nhau.
4. Home hiển thị một thanh tiến độ cho mỗi môn đã đăng ký, lấy từ selector. Xóa Ngữ văn và Ôn tập tổng hợp.
5. `nextLesson` và `resumeLesson` chỉ lấy trong phạm vi khóa đang xem.
6. Xóa `summarizeProgress` cũ sau khi đã chuyển hết các nơi gọi.

**Tiêu chí nghiệm thu.**
1. Unit test dùng fixture 6 bài Toán 9, 2 bài Tiếng Anh 9 và 1 bài Toán đã xong phải cho kết quả:
   - Toán: 17%.
   - Tiếng Anh: 0%.
   - `nextLesson` của Toán là một bài Toán.
2. E2E: con số % Toán giống hệt nhau trên `/`, `/hoc-bai`, sidebar và trang chủ đề `?topic=can-thuc`.
3. `grep -rn "Math.max(progress\|Math.max(64" src` không trả về kết quả nào.
4. Không còn chỗ nào hiển thị môn chưa đăng ký.

---

## I-05 · Luyện tập: gắn toàn bộ màn với đề đang mở, khôi phục gợi ý theo bậc

**Nhãn:** phase-1, P0, area:learning, needs:academic-review

**Bằng chứng.** Đề đang mở là "parabol $y=ax^2$ đi qua $M(-2;12)$, tìm $a$". Nhưng phần lớn màn hình nói về một bài toán khác là $x^2-5x+6=0$, và còn đưa sẵn đáp án của bài đó:

| Dòng trong `SelfSolveView.tsx` | Nội dung | Vấn đề |
| --- | --- | --- |
| 135 | "Lần thử đầu tiên": $(x-1)(x+6)=0$ | Bước giải viết cứng, thuộc bài khác |
| 145 | "AI kiểm tra consistency" | Kết quả kiểm tra viết cứng |
| 211–212 | Algebra Tiles cho $x^2-5x+6$ | Nút "Mở công cụ trực quan" không có `onClick` |
| 234 | "AI Sketchnote" | Đưa luôn $(x-2)(x-3)$, ngay dưới dòng "không giải hộ" |
| 242 | Trace | Viết cứng |
| 254 | Ba câu hỏi Socratic | Thuộc bài khác; nút không có `onClick` |
| 264 | "92% Tự sửa lỗi" | Số viết cứng |
| 95 | Thanh công cụ 5 mục | Chỉ "Công thức toán" hoạt động |

Thêm hai vấn đề:
- `practice-problems.json:12`: `initialInput` điền sẵn bước thế tọa độ ($12 = a\cdot(-2)^2$), tức là làm hộ học sinh bước đầu tiên.
- `PracticeGuide.tsx` (gợi ý 3 bậc, mở sớm thì trừ GP, câu hỏi gợi mở lấy từ `practiceProblem.prompts`) đã được viết đúng. Nhưng commit `c63ff06` (AI Pulse V3) gỡ nó khỏi màn hình. Từ đó `autonomyReward` vẫn tính phạt khi mở gợi ý, trong khi giao diện không còn nút nào để mở gợi ý.

**Việc cần làm.**
1. Xóa các khối viết cứng ở các dòng 135, 145, 211–222, 234–259 và 264.
2. Mở rộng `PracticeSession` thêm trường `attempts: { input: string; valid: boolean; message: string; at: string }[]`. Mỗi lần bấm "Kiểm tra bước" thì ghi thêm một attempt.
   - Cập nhật `isPracticeSession`: nhận cả phiên cũ không có `attempts`, mặc định là `[]`.
   - Giữ nguyên storage key để không mất dữ liệu đang có.
3. Phần lịch sử bài làm render từ `session.attempts`: "Lần 1, Lần 2…", kèm kết quả kiểm tra thật từ `verifySampleAnswer`.
4. Gắn lại `PracticeGuide` vào cột phải và chỉnh style theo token hiện tại. Gợi ý 2 mở sau lần kiểm tra đầu tiên, hoặc mở sớm với mức trừ GP như logic hiện có.
5. Đổi `initialInput` thành chuỗi rỗng. Câu hướng dẫn đặt trong `placeholder` hoặc `hint` của Field.
6. Thanh công cụ chỉ giữ "Công thức toán". Các công cụ chưa có chức năng thì ẩn đi.
7. Đổi câu chữ trên màn:

   | Cũ | Mới |
   | --- | --- |
   | AI kiểm tra consistency | Kiểm tra bước |
   | Nộp reasoning | Nộp bài |
   | Reasoning Canvas | Bài làm của em |
   | Reasoning trace | Các bước biến đổi |

8. Mã đề hiển thị lấy từ `practiceProblem.id`, không viết cứng `TS10-ALG-0492`.

**Ngoài phạm vi.** Gợi ý bằng AI. Ngân hàng nhiều đề. Bảng nháp vẽ tay.

**Tiêu chí nghiệm thu.**
1. E2E: trên `/tu-giai` không xuất hiện chuỗi `5x + 6`, `x − 2` hay `x − 3`.
2. E2E: với phiên mới, giá trị `a = 3` không hiển thị trên màn cho tới khi học sinh mở gợi ý 2 hoặc kiểm tra đúng.
3. E2E:
   - Phiên mới thì ô bài làm trống.
   - Nhập sai rồi kiểm tra: lịch sử có "Lần 1" với kết quả sai.
   - Nhập đúng rồi kiểm tra: có "Lần 2" với kết quả đúng.
   - Nộp bài: GP cộng đúng bằng `autonomyReward`.
4. Mọi nút trên màn hình đều có hành động.
5. Anh Nghĩa hoặc một giáo viên Toán duyệt toàn bộ nội dung màn hình trước khi merge.

---

## I-06 · Hôm nay và Xem lại: nội dung lấy từ bài và phiên thật

**Nhãn:** phase-1, P0, area:learning

**Bằng chứng.**
- **Trang Hôm nay.**
  - `TodayView.tsx:158`: phần xem trước viết cứng "$x^2-5x+6=0$", trong khi tiêu đề nhiệm vụ lấy từ `nextLesson` ("Rút gọn biểu thức chứa căn").
  - `TodayView.tsx:141–145`: khi không có bài tiếp theo, tiêu đề, tóm tắt, thời lượng và số câu đều dùng giá trị viết cứng thay vì empty state.
- **Trang Xem lại.**
  - `ThinkingReplayView.tsx:29`: dòng thời gian viết cứng.
  - `ThinkingReplayView.tsx:123`: mục "Mistake DNA · v3.2 — Nhầm tổng trong phân tích nhân tử" viết cứng.
  - `ThinkingReplayView.tsx:174`: các bước nháp viết cứng.
  - Trong khi đó tiêu đề trang lại lấy từ đề parabol, nên trang tự mâu thuẫn.

**Việc cần làm.**
1. Phần xem trước nhiệm vụ: hiển thị ví dụ đầu tiên của `nextLesson`, nếu không có thì hiển thị bài tập đầu tiên. Render bằng `RichMathText`.
2. Khi không có `nextLesson`: hiển thị empty state "Em đã hoàn thành các bài hiện có của khóa Toán 9", kèm nút mở Lộ trình. Xóa các giá trị dự phòng viết cứng.
3. Dòng thời gian của Xem lại dựng từ `session.attempts` (I-05) và các gợi ý đã mở.
4. Mục "Lỗi hay gặp" chỉ hiển thị khi attempt sai có `message` từ bộ kiểm tra. Nội dung là đúng thông điệp đó, không tự suy diễn.
5. Xóa phần "Stroke Replay" vì chưa có dữ liệu nét vẽ.
6. Khi chưa có bài nộp: hiển thị empty state "Chưa có bài nộp để xem lại", kèm nút mở Luyện tập.

**Tiêu chí nghiệm thu.**
1. E2E: đoạn văn bản xem trước trên `/` là một phần nội dung của `nextLesson`.
2. E2E: `/replay` với `localStorage` trống hiển thị empty state.
3. E2E: sau khi nộp bài ở `/tu-giai`, trang `/replay` hiển thị đúng chuỗi bài làm đã nộp và đúng số lần thử.

---

## I-07 · Gỡ nhãn AI và chỉ số không có cơ sở

**Nhãn:** phase-1, P0, area:copy, needs:copy-review

**Bằng chứng.** Toàn repo không có lời gọi model nào. Lệnh `fetch` duy nhất nằm trong `data/contentRepository.ts` và gọi Supabase. Dù vậy, giao diện học sinh vẫn hiển thị các nhãn AI và chỉ số sau:

| Vị trí | Nội dung |
| --- | --- |
| `TodayView.tsx:86–89` | Tập trung 82%, Hiểu sâu 78%, Tự sửa lỗi 92%, "Sẵn sàng thi 8.5+ ↑AI" |
| `TodayView.tsx:98`, `111`, `113` | "AI Pulse · Cognitive Rhythm", "AI Cognitive Pulse", "Dựa trên 18/18 lượt học gần đây" |
| `TodayView.tsx:189`, `206` | "Được AI đánh giá", "Bước tiếp theo đã được AI sắp sẵn" |
| `TodayView.tsx:33`, `245` | Radar năng lực viết cứng |
| `TodayView.tsx:252–254` | Thẻ "AI Coach"; nút bấm chỉ chuyển sang trang Luyện tập |
| `KnowledgeMapView.tsx:146` | "Phát hiện lỗ hổng: dấu của hệ số…" viết cứng |
| `AppHeader.tsx:69` | Nhãn "AI Pulse" |
| `AppHeader.tsx:119` | Placeholder "…hoặc hỏi Tutor". Lệnh submit ở dòng 109 bỏ qua từ khóa |
| `AppHeader.tsx:129` | Streak "14 ngày" |
| `AppHeader.tsx:161` | Nút thông báo không có `onClick`, chấm đỏ luôn sáng |
| `config/routes.ts:6`, `8` | "AI Pulse & nhiệm vụ hôm nay", "Giải bài cùng AI" |

**Việc cần làm.**
1. **Xóa:**
   - 4 chỉ số "cognitive" và dòng "18/18".
   - Radar năng lực.
   - Thẻ AI Coach.
   - Streak trên header (chưa có dữ liệu theo dõi).
   - Nút thông báo (chưa có nguồn thông báo).
2. **Thay bằng dữ liệu thật:** banner "Phát hiện lỗ hổng" trên Lộ trình đổi thành "Chủ đề nên học tiếp". Chủ đề được chọn là chủ đề có `getTopicProgress` thấp nhất trong số các chủ đề đã mở.
3. **Ô tìm kiếm:** ẩn cho tới khi Giai đoạn 2 nối chức năng lọc thật (`lib/search.ts`).
4. **Đổi tên:**

   | Cũ | Mới |
   | --- | --- |
   | Nhãn "AI Pulse" trên header | Tên trang hiện tại |
   | "Giải bài cùng AI" | "Làm bài, kiểm tra từng bước" |
   | "AI Pulse & nhiệm vụ hôm nay" | "Nhiệm vụ hôm nay" |

5. Thêm `scripts/check-copy.mjs` và chạy nó trong `npm run lint`:
   - Quét các file giao diện học sinh: `src/features/{learning,practice,progress,rewards,schedule,goals,gamification}`, `src/app/layout`, `src/config/routes.ts`, `src/data/**/*.json`.
   - Danh sách cấm: `\bAI\b`, `Cognitive`, `Pulse`, `Mistake DNA`, `Reasoning`, `Fallback`, `Live DB`, `Learning OS`, `Tutor genAI`.
   - Có file `copy-allowlist.json`, để trống trong Giai đoạn 1.
   - Phạm vi đã đo ở commit `e6f6358`: danh sách cấm khớp 56 dòng trong 9 file, trong đó 28 dòng chứa chữ "AI". Phần lớn các dòng trong SelfSolve và Replay sẽ tự biến mất sau I-05 và I-06. Lịch học (`TimetableScheduleView.tsx`) cũng có nhãn AI cần gỡ.
6. Nếu cần giữ một số liệu minh họa cho buổi demo: chuyển nó vào `src/data/demo/` và hiển thị kèm `DemoDataNotice`, theo đúng mẫu đang dùng ở trang Tiến bộ.

**Tiêu chí nghiệm thu.**
1. `npm run lint` pass, bao gồm `check-copy`.
2. Trên Hôm nay, Lộ trình và header, mọi con số hiển thị đều truy được về một selector hoặc một file trong `src/data/demo/` có nhãn minh họa.
3. Anh Nghĩa duyệt toàn bộ câu chữ trang Hôm nay.

---

## I-08 · Gỡ thuật ngữ nội bộ, thống nhất tên thương hiệu

**Nhãn:** phase-1, P1, area:copy

**Bằng chứng.**

| Vị trí | Nội dung lọt ra giao diện |
| --- | --- |
| `KnowledgeMapView.tsx:93` | Eyebrow hiển thị "Live DB" hoặc "Fallback" cho học sinh |
| `KnowledgeMapView.tsx:127` | Chú thích "Teal Pulse" (tên một token màu) |
| `AppSidebar.tsx:140`, `146–147` | "Tutor genAI" và "AI Learning OS" |
| `config/routes.ts:37` | "Learning OS" |
| `TheoryLessonsView.tsx:361`, `387`, `403–405` | "Learning session", "Topic path", "Course path", "Về course path", "Learning objects", "Mastery", "Next" |

**Việc cần làm.**
1. Xóa trạng thái nguồn dữ liệu khỏi eyebrow. Lỗi tải DB đã được xử lý theo mục 6 của `DESIGN.md`.
2. Chú thích "Teal Pulse" đổi thành "Đang học".
3. Thương hiệu thống nhất là "genAi Tutor".
4. Đổi câu chữ trên trang chủ đề và bài học:

   | Cũ | Mới |
   | --- | --- |
   | Learning session | Bài học |
   | Topic path | Chủ đề |
   | Course path | Khóa học |
   | Về course path | Về khóa học |
   | Learning objects | Số bài |
   | Mastery | Tiến độ |
   | Next | Bài tiếp theo |

5. Bổ sung các chuỗi trên vào danh sách cấm của `check-copy`.

**Ngoài phạm vi.** Đổi tên bốn mục điều hướng chính (Knowledge Map → Lộ trình…). Việc này thuộc Giai đoạn 2, làm cùng lúc với tái cấu trúc shell.

**Tiêu chí nghiệm thu.**
1. `check-copy` pass.
2. `grep -rn "genAI" src` không trả về chuỗi nào hiển thị cho người dùng.