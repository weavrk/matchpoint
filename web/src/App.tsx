import { useState, useRef, useCallback } from 'react';
import { AppLayout } from './components/Layout';
import { PermanentHiring } from './pages/PermanentHiring';
import './styles/variables.css';

function App() {
  const [activePage, setActivePage] = useState('talent');
  const startChatRef = useRef<(() => void) | null>(null);

  const handleRegisterStartChat = useCallback((startFn: () => void) => {
    startChatRef.current = startFn;
  }, []);

  const handleStartChat = useCallback(() => {
    startChatRef.current?.();
  }, []);

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage} onStartChat={handleStartChat}>
      {activePage === 'talent' ? (
        <PermanentHiring onRegisterStartChat={handleRegisterStartChat} />
      ) : (
        <div style={{ padding: '2rem' }}>
          <h1>Home</h1>
          <p>Select "Talent" from the sidebar to access permanent hiring.</p>
        </div>
      )}
    </AppLayout>
  );
}

export default App;
