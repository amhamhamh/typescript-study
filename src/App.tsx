import { useEffect, useState } from 'react';
import { findLesson, lessons } from './content';
import { href, useRoute } from './lib/router';
import { selectDoneCount, selectTheme, useAppDispatch, useAppSelector } from './store';
import { themeChanged } from './store/progressSlice';
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // 화면이 바뀌면 맨 위로 올리고, 메뉴를 닫습니다.
  const routeKey = route.name === 'lesson' ? `${route.lessonId}/${route.part}` : route.name;
  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }, [routeKey]);

  const lesson = route.name === 'lesson' ? findLesson(route.lessonId) : undefined;
  // 레슨 화면은 에디터에 자리를 내주기 위해 목차를 접어 둡니다. (메뉴 버튼으로 열기)
  const focus = route.name === 'lesson' && lesson !== undefined;

  return (
    <div className={`app${focus ? ' app--focus' : ''}`}>
      <header className="topbar">
        <button
          className="icon-btn topbar__menu"
          onClick={() => setMenuOpen((open) => !open)}
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
        <main className="main">
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
        </main>
      </div>
    </div>
  );
}
