import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { useAuthStore } from '@/store/authStore';

async function enableMocking() {
  if (import.meta.env.VITE_USE_MSW !== 'true') return;
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking()
  .then(() => useAuthStore.getState().bootstrap())
  .finally(() => {
    createRoot(document.getElementById('root') as HTMLElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
