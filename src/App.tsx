import { useEffect, useRef, useState } from 'react';
import { findLesson, lessons } from './content';
import { href, useRoute } from './lib/router';
import { selectDoneCount, selectTheme, useAppDispatch, useAppSelector } from './store';
import { themeChanged } from './store/progressSlice';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from './components/Icons';
import { HomePage } from './pages/HomePage';
import { LessonPage } from './pages/LessonPage';
import { CheatsheetPage } from './pages/CheatsheetPage';

const REPO_URL = 'https://github.com/amhamhamh/typescript-study';

export function App() {
  const route = useRoute();
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const doneCount = useAppSelector(selectDoneCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // 화면이 바뀌면 맨 위로 올리고, 메뉴를 닫습니다.
  const routeKey = route.name === 'lesson' ? `${route.lessonId}/${route.part}` : route.name;
  // 처음 열린 화면에서는 스크롤을 건드리지 않습니다. 새로 고침(에디터의 '다시 시도' 포함) 때는
  // 브라우저가 보던 위치로 되돌려 주는데, 여기서 맨 위로 올리면 보고 있던 에디터가 화면 밖으로 밀려납니다.
  const shownRouteRef = useRef(routeKey);
  useEffect(() => {
    if (shownRouteRef.current !== routeKey) {
      shownRouteRef.current = routeKey;
      window.scrollTo(0, 0);
    }
    setMenuOpen(false);
  }, [routeKey]);

  // 목차 서랍이 열려 있는 동안: 첫 링크로 포커스를 옮기고, Esc로 닫고, 닫히면 메뉴 버튼으로 포커스를 돌려줍니다.
  useEffect(() => {
    if (!menuOpen) return;
    const button = menuButtonRef.current;
    // 서랍은 visibility 전환으로 나타나므로, 화면에 보인 다음에야 포커스를 받을 수 있습니다.
    const focusTimer = setTimeout(() => document.querySelector<HTMLElement>('#site-nav a')?.focus(), 80);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
      // 링크를 눌러 다른 화면으로 간 경우가 아니라면(포커스가 아직 서랍 안에 있으면) 버튼으로 돌려놓습니다.
      if (document.activeElement?.closest('#site-nav')) button?.focus();
    };
  }, [menuOpen]);

  const lesson = route.name === 'lesson' ? findLesson(route.lessonId) : undefined;
  // 레슨 화면은 에디터에 자리를 내주기 위해 목차를 접어 둡니다. (메뉴 버튼으로 열기)
  const focus = route.name === 'lesson' && lesson !== undefined;

  // 레슨이 아닌 화면에서는 960px 이하에서만 목차가 서랍입니다. (styles.css의 @media (max-width: 960px)와 같은 값)
  // 창이 넓어져 서랍과 닫기 버튼이 사라지면 열림 상태도 함께 풉니다. 그러지 않으면 본문이 inert로 남아 아무것도 누를 수 없습니다.
  useEffect(() => {
    if (!menuOpen || focus) return;
    const narrow = window.matchMedia('(max-width: 960px)');
    const onChange = () => {
      if (!narrow.matches) setMenuOpen(false);
    };
    narrow.addEventListener('change', onChange);
    return () => narrow.removeEventListener('change', onChange);
  }, [menuOpen, focus]);

  return (
    <div className={`app${focus ? ' app--focus' : ''}`}>
      <header className="topbar">
        <button
          className="icon-btn topbar__menu"
          ref={menuButtonRef}
          onClick={() => setMenuOpen((open) => !open)}
          aria-controls="site-nav"
          aria-label={menuOpen ? '목차 닫기' : '목차 열기'}
          aria-expanded={menuOpen}
        >
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
        {menuOpen && <button className="scrim" aria-label="목차 닫기" onClick={() => setMenuOpen(false)} />}
        {/* 서랍이 열려 있으면 그 아래 내용은 키보드·스크린리더로 닿지 않게 합니다. */}
        <main className="main" inert={menuOpen}>
          <ErrorBoundary key={routeKey}>
          {route.name === 'home' && <HomePage />}
          {route.name === 'cheatsheet' && <CheatsheetPage />}
          {route.name === 'lesson' &&
            (lesson ? (
              <LessonPage lesson={lesson} part={route.part} />
            ) : (
              <div className="lesson">
                <h1>레슨을 찾을 수 없습니다</h1>
                <p><a href={href({ name: 'home' })}>학습 지도로 돌아가기</a></p>
              </div>
            ))}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
