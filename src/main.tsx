import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import '@fontsource-variable/jetbrains-mono';
import './styles.css';
import { store } from './store';
import { App } from './App';

// getElementById는 HTMLElement | null 을 돌려줍니다. 없을 리 없다는 걸 코드로 확인합니다.
const container = document.getElementById('root');
if (!container) throw new Error('#root 요소를 찾을 수 없습니다');

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
