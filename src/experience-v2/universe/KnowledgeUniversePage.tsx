import {
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { Button, Icon, Input, Tabs } from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import { lessonHref } from "../../features/curriculum";
import { V2HeroArtwork } from "../components/V2HeroArtwork";
import {
  buildUniverseGraph,
  universeSearch,
  type UniverseTopicNode,
} from "./graphDomain";
import "./knowledge-universe.css";

const views = [
  { id: "map", label: "Bản đồ tri thức", icon: "hub" },
  { id: "journey", label: "Hành trình", icon: "track_changes" },
  { id: "list", label: "Danh sách", icon: "menu_book" },
] as const;

type View = (typeof views)[number]["id"];

interface Props {
  onNavigate: (path: string) => void;
  search: string;
}

export function KnowledgeUniversePage({ onNavigate, search }: Props) {
  const { topics, lessons, subjects, completedLessonIds } = useCurriculum();
  const graph = useMemo(
    () => buildUniverseGraph(lessons, topics, completedLessonIds),
    [lessons, topics, completedLessonIds],
  );
  const params = new URLSearchParams(search);
  const [needle, setNeedle] = useState(params.get("q") ?? "");
  const [filter, setFilter] = useState(
    params.get("subject") ?? "all",
  );
  const [view, setView] = useState<View>(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
      ? "list"
      : "map",
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const start = useRef<{
    clientX: number;
    clientY: number;
    x: number;
    y: number;
  } | null>(null);

  const visible = universeSearch(graph.nodes, needle, filter);
  const selected =
    visible.find((node) => node.id === focusedId) ??
    visible.find((node) => node.state === "current") ??
    visible[0];
  const availableSubjects = subjects.filter(
    (subject) => graph.nodes.some((node) => node.subjectId === subject.id),
  );

  function startPan(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button")) return;
    start.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      x: pan.x,
      y: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function movePan(event: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    setPan({
      x: start.current.x + event.clientX - start.current.clientX,
      y: start.current.y + event.clientY - start.current.clientY,
    });
  }
  function stopPan(event: PointerEvent<HTMLDivElement>) {
    start.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const choose = (node: UniverseTopicNode) => setFocusedId(node.id);
  const progress = selected
    ? selected.complete === selected.lessons.length
      ? "Đã hoàn thành"
      : selected.state === "current"
        ? "Đang học"
        : "Có thể khám phá"
    : "";

  return (
    <div className="v2-universe-page">
      <header className="v2-universe-hero">
        <V2HeroArtwork />
        <div>
          <p className="v2-universe-eyebrow"><Icon name="auto_awesome" /> Học theo cách khám phá</p>
          <h1>Knowledge <span>Universe</span></h1>
          <p>Mỗi chủ đề là một điểm đến. Chạm vào tri thức để tự chọn hành trình học của mình.</p>
        </div>
      </header>

      <div className="v2-universe-toolbar">
        <Tabs
          value={view}
          onChange={setView}
          tabs={views}
          variant="pill"
          label="Chế độ khám phá tri thức"
          className="v2-universe-tabs"
        />
        <div className="v2-universe-search">
          <Icon name="search" />
          <Input
            type="search"
            value={needle}
            onChange={(event) => setNeedle(event.target.value)}
            placeholder="Tìm chủ đề hoặc bài học…"
            aria-label="Tìm chủ đề hoặc bài học"
          />
        </div>
      </div>

      <div className="v2-universe-filter" aria-label="Lọc môn học">
        <Button
          variant="ghost"
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          Tất cả môn
        </Button>
        {availableSubjects.map((subject) => (
          <Button
            key={subject.id}
            variant="ghost"
            aria-pressed={filter === subject.id}
            onClick={() => setFilter(subject.id)}
          >
            <Icon name={subject.icon} /> {subject.name}
          </Button>
        ))}
      </div>

      <div className="v2-universe-grid">
        <section className="v2-universe-main-panel" aria-label="Khám phá chủ đề">
          {visible.length === 0 ? (
            <div className="v2-universe-empty">
              <Icon name="search" />
              <h2>Chưa tìm thấy chủ đề phù hợp</h2>
              <p>Thử từ khóa khác hoặc chọn lại môn học để khám phá.</p>
              <Button onClick={() => { setNeedle(""); setFilter("all"); }}>
                Xem tất cả chủ đề
              </Button>
            </div>
          ) : view === "map" ? (
            <>
              <div
                className="v2-universe-map"
                aria-label="Bản đồ các chủ đề đã xuất bản"
                onPointerDown={startPan}
                onPointerMove={movePan}
                onPointerUp={stopPan}
                onPointerCancel={stopPan}
              >
                <div
                  className="v2-universe-space-scene"
                  style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}
                >
                  <div className="v2-universe-starfield" aria-hidden="true" />
                  <svg viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
                    <ellipse cx="600" cy="264" rx="275" ry="192" className="v2-universe-orbit v2-universe-orbit--math" />
                    <ellipse cx="280" cy="425" rx="212" ry="144" className="v2-universe-orbit v2-universe-orbit--english" />
                    {graph.edges.map((edge) => {
                      const a = visible.find((node) => node.id === edge.sourceId);
                      const b = visible.find((node) => node.id === edge.targetId);
                      if (!a || !b) return null;
                      return (
                        <line
                          key={edge.sourceId + edge.targetId}
                          x1={a.x * 10}
                          y1={a.y * 6}
                          x2={b.x * 10}
                          y2={b.y * 6}
                          className="v2-universe-edge"
                        />
                      );
                    })}
                  </svg>
                  {visible.map((node) => (
                    <Button
                      key={node.id}
                      variant="ghost"
                      className="v2-universe-node"
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      data-state={node.state}
                      aria-pressed={selected?.id === node.id}
                      aria-label={`${node.topic.title}: ${node.complete} trên ${node.lessons.length} bài đã hoàn thành`}
                      onClick={() => choose(node)}
                    >
                      <span className="v2-universe-node-dot">
                        <Icon name={node.state === "complete" ? "check" : node.state === "current" ? "track_changes" : "menu_book"} />
                      </span>
                      <span>{node.topic.title}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="v2-universe-map-controls">
                <div className="v2-universe-map-legend">
                  <span><i className="is-complete" /> Đã học</span>
                  <span><i className="is-current" /> Tiếp theo</span>
                  <span><i /> Có thể khám phá</span>
                </div>
                <div className="v2-universe-zoom">
                  <Button
                    variant="ghost"
                    aria-label="Phóng to bản đồ"
                    onClick={() => setZoom((value) => Math.min(1.6, Number((value + .2).toFixed(1))))}
                  ><Icon name="add" /></Button>
                  <Button
                    variant="ghost"
                    aria-label="Thu nhỏ bản đồ"
                    onClick={() => setZoom((value) => Math.max(.6, Number((value - .2).toFixed(1))))}
                  ><Icon name="zoom_out" /></Button>
                  <Button variant="ghost" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
                    Căn giữa <Icon name="center_focus_strong" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="v2-universe-list" data-view={view}>
              <h2>{view === "journey" ? "Hành trình học theo chủ đề" : "Danh sách chủ đề đã xuất bản"}</h2>
              <ol>
                {visible.map((node, index) => (
                  <li key={node.id}>
                    <Button
                      variant="ghost"
                      aria-pressed={selected?.id === node.id}
                      onClick={() => choose(node)}
                    >
                      <span className="v2-universe-list-number">
                        {node.state === "complete" ? <Icon name="check" /> : String(index + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <strong>{node.topic.title}</strong>
                        <small>{node.complete}/{node.lessons.length} bài · {node.gradeId} · {subjects.find((item) => item.id === node.subjectId)?.name ?? node.subjectId}</small>
                      </span>
                      <Icon name="chevron_right" />
                    </Button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        <aside className="v2-universe-inspector" aria-label="Thông tin chủ đề">
          {selected ? (
            <>
              <span className="v2-universe-inspector-eyebrow">
                {subjects.find((item) => item.id === selected.subjectId)?.name ?? selected.subjectId} · Lớp {selected.gradeId}
              </span>
              <span className="v2-universe-selected-icon"><Icon name="menu_book" /></span>
              <h2>{selected.topic.title}</h2>
              <p>{selected.topic.description}</p>
              <span className="v2-universe-progress-caption">{progress} · {selected.complete}/{selected.lessons.length} bài</span>
              <Progress
                value={selected.complete}
                max={selected.lessons.length}
                label={`Tiến độ chủ đề ${selected.topic.title}`}
              />
              <h3>Bài học trong chủ đề</h3>
              <ul className="v2-universe-lesson-list">
                {selected.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Button variant="ghost" onClick={() => onNavigate(lessonHref(lesson))}>
                      <Icon name={completedLessonIds.includes(lesson.id) ? "check_circle" : "menu_book"} />
                      <span>
                        <strong>{lesson.title}</strong>
                        <small>{lesson.durationMinutes} phút</small>
                      </span>
                      <Icon name="arrow_forward" />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                className="v2-universe-lesson-cta"
                onClick={() => onNavigate(lessonHref(
                  selected.lessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ?? selected.lessons[0],
                ))}
              >
                Khám phá bài học <Icon name="arrow_forward" />
              </Button>
              <Button variant="ghost" className="v2-universe-inspector-secondary" onClick={() => setView("journey")}>
                Xem hành trình <Icon name="hub" />
              </Button>
            </>
          ) : (
            <div className="v2-universe-empty"><p>Chọn một chủ đề để xem nội dung.</p></div>
          )}
        </aside>
      </div>

      <section className="v2-universe-related" aria-label="Khám phá thêm chủ đề">
        <div className="v2-section-top">
          <h2>Những chủ đề đang có</h2>
          <span>Từ chương trình đã xuất bản</span>
        </div>
        <div className="v2-universe-related-grid">
          {visible.filter((node) => node.id !== selected?.id).slice(0, 3).map((node) => (
            <Button key={node.id} variant="ghost" onClick={() => choose(node)}>
              <span className="v2-universe-related-icon"><Icon name="menu_book" /></span>
              <span><strong>{node.topic.title}</strong><small>{node.lessons.length} bài học · {subjects.find((item) => item.id === node.subjectId)?.name ?? node.subjectId}</small></span>
              <Icon name="add" />
            </Button>
          ))}
        </div>
      </section>
      <p className="v2-universe-integrity"><Icon name="info" /> Đường nối thể hiện thứ tự trong chương trình, không phải kiến thức tiên quyết đã được chứng minh.</p>
    </div>
  );
}
