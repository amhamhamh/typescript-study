import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base를 상대 경로로 두면 GitHub Pages의 /저장소이름/ 하위 경로에서도 그대로 동작합니다.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 6000 },
});
