import { useState } from 'react';
import { AppLayout } from './components/Layout';
import { PermanentHiring } from './pages/PermanentHiring';
import './styles/variables.css';

function App() {
  const [activePage, setActivePage] = useState('talent');

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'talent' ? (
        <PermanentHiring />
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
