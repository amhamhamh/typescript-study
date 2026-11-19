import { chapters, lessons, lessonsOf } from '../content';
import { href, lessonHref, type Route } from '../lib/router';
import { selectLessonProgress, useAppSelector } from '../store';
import { CheckIcon } from './Icons';

interface SidebarProps {
  route: Route;
  onNavigate: () => void;
}

export function Sidebar({ route, onNavigate }: SidebarProps) {
  const state = useAppSelector((s) => s);
  const currentId = route.name === 'lesson' ? route.lessonId : null;

  return (
    <nav className="sidebar" aria-label="레슨 목록">
      <a className={`side-link${route.name === 'home' ? ' is-current' : ''}`} href={href({ name: 'home' })} onClick={onNavigate}>
        학습 지도
      </a>
      <a className={`side-link${route.name === 'cheatsheet' ? ' is-current' : ''}`} href={href({ name: 'cheatsheet' })} onClick={onNavigate}>
        JS → TS 치트시트
      </a>

      {chapters.map((chapter, chapterIndex) => (
        <div className="side-chapter" key={chapter.id}>
          <p className="side-chapter__title">
            <span>{chapterIndex + 1}</span>
            {chapter.title}
          </p>
          <ol>
            {lessonsOf(chapter.id).map((lesson) => {
              const progress = selectLessonProgress(state, lesson);
              const number = lessons.indexOf(lesson) + 1;
              return (
                <li key={lesson.id}>
                  <a
                    className={`side-lesson${lesson.id === currentId ? ' is-current' : ''}`}
                    href={lessonHref(lesson.id)}
                    aria-current={lesson.id === currentId ? 'page' : undefined}
                    onClick={onNavigate}
                  >
                    <span className={`side-lesson__mark${progress.done ? ' is-done' : ''}`}>
                      {progress.done ? <CheckIcon width={12} height={12} /> : number}
                    </span>
                    <span>{lesson.title.split(':')[0]}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </nav>
  );
}
