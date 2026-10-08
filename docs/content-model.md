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

### Multi-subject contract

Student có thể đăng ký nhiều môn. Map phải cho chuyển môn mà không đổi shell:

- Toán có thể dùng `math=true`.
- Tiếng Anh test hiện dùng `math=false`, `images=true`, `vocabulary=true`, `dialogue=true`.
- Thêm môn mới bằng subject + topics + lessons trong DB, không hard-code một renderer riêng cho từng môn.