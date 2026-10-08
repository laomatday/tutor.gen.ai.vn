import { Icon } from "./ui";
import { AdaptiveFormula, AdaptiveText } from "./AdaptiveText";
import type { LessonContentBlock } from "../types/content";

function ContentImage({
  imageUrl,
  alt,
  caption,
}: {
  imageUrl: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="learning-illustration">
      <img
        src={imageUrl}
        alt={alt}
        className="learning-illustration__image"
        loading="lazy"
      />
      {caption && (
        <figcaption className="learning-illustration__caption">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function LessonContentRenderer({
  blocks,
}: {
  blocks: LessonContentBlock[];
}) {
  return (
    <div className="lesson-blocks">
      {blocks.map((block) => {
        if (block.type === "image") {
          return (
            <ContentImage
              key={block.id}
              imageUrl={block.imageUrl}
              alt={block.alt}
              caption={block.caption}
            />
          );
        }

        if (block.type === "math") {
          return (
            <section key={block.id} className="lesson-block lesson-block--math">
              {block.label && (
                <p className="lesson-block__eyebrow">{block.label}</p>
              )}
              <AdaptiveFormula
                formula={block.formula}
                block={block.display ?? true}
                className="text-brand"
              />
            </section>
          );
        }

        if (block.type === "paragraph") {
          return (
            <section key={block.id} className="lesson-block">
              {block.heading && (
                <h2 className="lesson-block__title">{block.heading}</h2>
              )}
              <p className="lesson-block__copy">
                <AdaptiveText
                  text={block.text}
                  format={block.format}
                />
              </p>
            </section>
          );
        }

        if (block.type === "callout") {
          return (
            <aside
              key={block.id}
              className="lesson-block lesson-block--callout"
              data-tone={block.tone ?? "info"}
            >
              <div className="flex items-start gap-3">
                <span className="lesson-block__callout-icon">
                  <Icon
                    name={
                      block.tone === "success"
                        ? "verified"
                        : block.tone === "warning"
                          ? "warning"
                          : "tips_and_updates"
                    }
                  />
                </span>
                <div>
                  {block.title && (
                    <h2 className="lesson-block__title">{block.title}</h2>
                  )}
                  <p className="lesson-block__copy">
                    <AdaptiveText
                      text={block.text}
                      format={block.format}
                    />
                  </p>
                </div>
              </div>
            </aside>
          );
        }

        if (block.type === "vocabulary") {
          return (
            <section key={block.id} className="lesson-block">
              <div className="lesson-block__heading-row">
                <span className="lesson-block__heading-icon">
                  <Icon name="language" />
                </span>
                <h2 className="lesson-block__title">
                  {block.title ?? "Vocabulary"}
                </h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {block.items.map((item) => (
                  <article key={item.term} className="vocabulary-card">
                    <div className="flex items-baseline justify-between gap-3">
                      <strong className="text-lg text-brand">
                        {item.term}
                      </strong>
                      <span className="text-xs font-semibold text-accent-strong">
                        {item.meaning}
                      </span>
                    </div>
                    {item.example && (
                      <p className="mt-3 text-sm leading-6 text-ink-600">
                        {item.example}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "dialogue") {
          return (
            <section key={block.id} className="lesson-block">
              <div className="lesson-block__heading-row">
                <span className="lesson-block__heading-icon">
                  <Icon name="chat" />
                </span>
                <h2 className="lesson-block__title">
                  {block.title ?? "Dialogue"}
                </h2>
              </div>
              <div className="mt-4 space-y-3">
                {block.lines.map((line, index) => (
                  <div
                    key={`${line.speaker}-${index}`}
                    className="dialogue-line"
                  >
                    <span className="dialogue-line__speaker">
                      {line.speaker}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-6 text-ink-800">
                        {line.text}
                      </p>
                      {line.translation && (
                        <p className="mt-1 text-xs leading-5 text-ink-500">
                          {line.translation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "bullets") {
          return (
            <section key={block.id} className="lesson-block">
              {block.title && (
                <h2 className="lesson-block__title">{block.title}</h2>
              )}
              <ul className="mt-4 space-y-3">
                {block.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-ink-700">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    <AdaptiveText text={item} />
                  </li>
                ))}
              </ul>
            </section>
          );
        }

        return (
          <blockquote key={block.id} className="lesson-block lesson-block--quote">
            <p className="text-lg font-semibold leading-8 text-brand">
              “{block.text}”
            </p>
            {block.attribution && (
              <footer className="mt-3 text-sm text-ink-500">
                — {block.attribution}
              </footer>
            )}
          </blockquote>
        );
      })}
    </div>
  );
}
