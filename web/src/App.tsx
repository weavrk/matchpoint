import { useState } from 'react';
import { AppLayout } from './components/Layout';
import { PermanentHiring } from './pages/PermanentHiring';
import './styles/variables.css';

// Names for the greeting
const GREETING_NAMES = [
  'Mike', 'Trevor', 'Shannon', 'Nate', 'Micah', 'Katherine', 'Cayley',
  'Evan', 'Juan', 'Julie', 'Ashlee', 'Jeremy', 'Sam', 'Jasmine',
  'Emily', 'Olivia', 'Mary', 'Hans', 'Hadley', 'Leigh Ann',
];
const getRandomUserName = () => GREETING_NAMES[Math.floor(Math.random() * GREETING_NAMES.length)];

const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

function App() {
  const [activePage, setActivePage] = useState('talent');

  // User name state - single source of truth
  const [userName, setUserName] = useState(() => getRandomUserName());
  const [customUserName, setCustomUserName] = useState<string | null>(() => {
    const saved = localStorage.getItem('matchpoint-custom-name');
    return saved || null;
  });

  const displayUserName = customUserName || userName;

  const handleSetCustomName = (name: string) => {
    const titleCased = toTitleCase(name);
    setCustomUserName(titleCased);
    localStorage.setItem('matchpoint-custom-name', titleCased);
  };

  const handleClearCustomName = () => {
    setCustomUserName(null);
    localStorage.removeItem('matchpoint-custom-name');
    setUserName(getRandomUserName());
  };

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage} userName={displayUserName}>
      {activePage === 'talent' ? (
        <PermanentHiring
          userName={displayUserName}
          customUserName={customUserName}
          onSetCustomName={handleSetCustomName}
          onClearCustomName={handleClearCustomName}
        />
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
