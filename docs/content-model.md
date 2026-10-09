# Mô hình nội dung học tập

Nội dung chuyển nguyên từ `DESIGN.md` cũ (commit `e6f6358`), không sửa. Quy định hiển thị dữ liệu cho học sinh nằm ở mục 6 của `DESIGN.md`.

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

### Interactive Micro-labs (P1)

`src/features/microLabs/data/microLabs.json` là **kịch bản học tập có cấu hình**, không phải kết quả học sinh hoặc phản hồi sinh bởi AI. Không ghi đề, đáp án hoặc nội dung hội thoại trực tiếp trong JSX.

- Toán 9: dự đoán → thay hệ số → kiểm tra → giải thích, dùng hàm toán tất định và một hệ trục cố định. Hàm số `y=ax²+bx+c` là mở rộng ngoài dạng lõi `y=ax²`; công cụ trong Focus Studio chỉ hiện nội dung sau lần kiểm tra bước giải đầu tiên.
- Tiếng Anh 9: hai tình huống giao tiếp dùng đúng ID, prompt, đáp án đúng và giải thích của câu hỏi trong bài `school-club-invitation` đã xuất bản; không giả lập mô hình ngôn ngữ hoặc giọng nói.
- `selectMathLab` xác minh đăng ký môn, đúng lesson/topic và `status=published`. `selectDialogueLab` chỉ trả về lab khi hai câu hỏi khớp đầy đủ với cấu hình. Nếu nội dung nguồn đổi, không hiển thị lab cũ.
- Micro-labs hiện là hoạt động **không làm thay đổi** `completedLessonIds`, `PracticeSession.events`, GP hoặc đánh giá mastery. Trường hợp cần lưu hành động vào Replay phải thiết kế schema và bài test tương ứng trong pha sau.
- Cần giáo viên bộ môn thẩm định kịch bản, đáp án và phản hồi trước khi triển khai cho học sinh thật.

### Multi-subject contract

Student có thể đăng ký nhiều môn. Map phải cho chuyển môn mà không đổi shell:

- Toán có thể dùng `math=true`.
- Tiếng Anh test hiện dùng `math=false`, `images=true`, `vocabulary=true`, `dialogue=true`.
- Thêm môn mới bằng subject + topics + lessons trong DB, không hard-code một renderer riêng cho từng môn.