import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import type { Lesson, LessonStage } from '../curriculum';
import { ordinaryLinkClick } from '../../app/navigation';

export function useReadingPosition(lesson: Lesson | undefined, stage: LessonStage) {
  const readingSurfaceRef = useRef<HTMLDivElement>(null);
  const readerToolbarRef = useRef<HTMLDivElement>(null);
  const [readingPosition, setReadingPosition] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState('');
  const readingSections = useMemo(() => {
    if (!lesson) return [];
    const labels = stage === 'theory' ? lesson.theory.map(item => item.heading)
      : stage === 'examples' ? lesson.examples.map((item, index) => `Ví dụ ${index + 1}: ${item.title}`)
        : lesson.exercises.map((_, index) => `Câu ${index + 1}`);
    return labels.map((title, index) => ({ id: `lesson-${lesson.id}-${stage}-${index}`, title }));
  }, [lesson, stage]);

  const gutter = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  const scrollToSection = (node: HTMLElement, smooth: boolean) => {
    const headerHeight = document.querySelector('.app-header')?.getBoundingClientRect().height ?? 0;
    const offset = headerHeight + (readerToolbarRef.current?.offsetHeight ?? 0) + gutter() * 1.5;
    const top = node.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant' });
  };

  useEffect(() => {
    const surface = readingSurfaceRef.current;
    if (!lesson || !surface) return;
    let frame = 0;
    const updatePosition = () => {
      frame = 0;
      const bounds = surface.getBoundingClientRect();
      const spacing = gutter();
      const offset = (readerToolbarRef.current?.getBoundingClientRect().bottom ?? 0) + spacing;
      const start = bounds.top + window.scrollY - offset;
      const end = bounds.bottom + window.scrollY - window.innerHeight + spacing * 1.5;
      const percentage = end <= start ? (bounds.bottom <= window.innerHeight ? 100 : 0)
        : Math.round(Math.max(0, Math.min(1, (window.scrollY - start) / (end - start))) * 100);
      setReadingPosition(percentage);
      let current = readingSections[0]?.id ?? '';
      for (const section of readingSections) {
        if ((document.getElementById(section.id)?.getBoundingClientRect().top ?? Infinity) <= offset + spacing * 2) current = section.id;
      }
      if (percentage === 100 && readingSections.length) current = readingSections.at(-1)!.id;
      setActiveSectionId(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(updatePosition); };
    setReadingPosition(0);
    const observer = new ResizeObserver(schedule);
    observer.observe(surface);
    if (readerToolbarRef.current) observer.observe(readerToolbarRef.current);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    let hash = window.location.hash.slice(1);
    try { hash = decodeURIComponent(hash); } catch { /* Invalid fragments have no matching section. */ }
    if (readingSections.some(section => section.id === hash)) {
      const node = document.getElementById(hash);
      if (node) scrollToSection(node, false);
    }
    schedule();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [lesson, stage, readingSections]);

  const jumpToSection = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!ordinaryLinkClick(event)) return;
    event.preventDefault();
    const details = event.currentTarget.closest('details');
    if (details) details.open = false;
    const node = document.getElementById(id);
    if (!node) return;
    const url = new URL(window.location.href);
    url.hash = id;
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    scrollToSection(node, true);
    node.focus({ preventScroll: true });
    setActiveSectionId(id);
  };
  return { readingSurfaceRef, readerToolbarRef, readingPosition, activeSectionId, readingSections, jumpToSection };
}
