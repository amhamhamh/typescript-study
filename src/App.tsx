import { useEffect, useState } from 'react';
import { findLesson, lessons } from './content';
import { href, useRoute } from './lib/router';
import { selectDoneCount, useAppDispatch, useAppSelector } from './store';
import { themeChanged, type Theme } from './store/progressSlice';
import { useMonaco } from './editor/useMonaco';
import { Sidebar } from './components/Sidebar';
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from './components/Icons';
import { HomePage } from './pages/HomePage';
import { LessonPage } from './pages/LessonPage';
import { CheatsheetPage } from './pages/CheatsheetPage';

const REPO_URL = 'https://github.com/amhamhamh/typescript-study';

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function App() {
  const route = useRoute();
  const dispatch = useAppDispatch();
  const savedTheme = useAppSelector((state) => state.progress.theme);
  const doneCount = useAppSelector(selectDoneCount);
  const theme: Theme = savedTheme ?? systemTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const mod = useMonaco();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    mod?.monaco.editor.setTheme(theme === 'dark' ? 'tsl-dark' : 'tsl-light');
  }, [theme, mod]);

  // 화면이 바뀌면 맨 위로 올리고, 모바일 메뉴를 닫습니다.
  const routeKey = route.name === 'lesson' ? route.lessonId : route.name;
  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }, [routeKey]);

  const lesson = route.name === 'lesson' ? findLesson(route.lessonId) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-btn topbar__menu" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={menuOpen}>
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
        <a className="brand" href={href({ name: 'home' })}>
          <span className="brand__mark" aria-hidden="true">TS</span>
          <span className="brand__name">건너가기</span>
        </a>
        <div className="topbar__right">
          <span className="topbar__progress">{doneCount}/{lessons.length} 완료</span>
          <a className="topbar__link" href={REPO_URL} target="_blank" rel="noreferrer">소스 보기</a>
          <button
            className="icon-btn"
            onClick={() => dispatch(themeChanged(theme === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? '밝은 테마로 전환' : '어두운 테마로 전환'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <div className={`shell${menuOpen ? ' is-menu-open' : ''}`}>
        <Sidebar route={route} onNavigate={() => setMenuOpen(false)} />
        <main className="main">
          {route.name === 'home' && <HomePage />}
          {route.name === 'cheatsheet' && <CheatsheetPage />}
          {route.name === 'lesson' &&
            (lesson ? (
              <LessonPage key={lesson.id} lesson={lesson} />
            ) : (
              <div className="lesson">
                <h1>레슨을 찾을 수 없습니다</h1>
                <p><a href={href({ name: 'home' })}>학습 지도로 돌아가기</a></p>
              </div>
            ))}
        </main>
      </div>
    </div>
  );
}
