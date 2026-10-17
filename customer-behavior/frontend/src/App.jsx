import { useState, useEffect } from 'react';
import { Home, BarChart2, Smile, Lightbulb, User } from 'lucide-react';
import './index.css';

import OnboardingPage from './OnboardingPage';
import HomePage       from './HomePage';
import BehaviourPage  from './BehaviourPage';
import MoodPage       from './MoodPage';
import InsightsPage   from './InsightsPage';
import ProfilePage    from './ProfilePage';

const navItems = [
  { id: 'home',      label: 'Home',      Icon: Home },
  { id: 'behaviour', label: 'Activity',  Icon: BarChart2 },
  { id: 'mood',      label: 'Mood',      Icon: Smile },
  { id: 'insights',  label: 'Insights',  Icon: Lightbulb, hasNotif: true },
  { id: 'profile',   label: 'Profile',   Icon: User },
];

export default function App() {
  // Show onboarding on first load
  const [onboarded, setOnboarded] = useState(() => {
    return localStorage.getItem('bm_onboarded') === 'true';
  });
  const [page, setPage]   = useState('home');
  const [prevPage, setPrev] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  const handleOnboarded = () => {
    localStorage.setItem('bm_onboarded', 'true');
    setOnboarded(true);
  };

  const navigate = (target) => {
    if (target === page) return;
    setTransitioning(true);
    setTimeout(() => {
      setPrev(page);
      setPage(target);
      setTransitioning(false);
    }, 180);
  };

  // Keyboard shortcut for demo
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'r' && e.ctrlKey) {
        localStorage.removeItem('bm_onboarded');
        setOnboarded(false);
        setPage('home');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const pageMap = {
    home:      <HomePage      onNavigate={navigate} />,
    behaviour: <BehaviourPage onNavigate={navigate} />,
    mood:      <MoodPage      onNavigate={navigate} />,
    insights:  <InsightsPage  onNavigate={navigate} />,
    profile:   <ProfilePage   onNavigate={navigate} />,
  };

  if (!onboarded) {
    return <OnboardingPage onDone={handleOnboarded} />;
  }

  return (
    <div className="app-shell">
      {/* Page content */}
      <div
        key={page}
        style={{
          flex: 1,
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 0.18s ease, transform 0.18s ease',
        }}
      >
        {pageMap[page]}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map(({ id, label, Icon, hasNotif }) => (
          <button
            key={id}
            className={`nav-btn ${page === id ? 'active' : ''}`}
            onClick={() => navigate(id)}
          >
            <div className="nav-icon" style={{ position: 'relative' }}>
              <Icon
                size={22}
                strokeWidth={page === id ? 2.5 : 1.8}
                color={page === id ? 'var(--accent)' : 'var(--text3)'}
              />
              {hasNotif && page !== id && <div className="nav-pip" />}
            </div>
            <span>{label}</span>
            <span className="nav-dot" />
          </button>
        ))}
      </nav>
    </div>
  );
}
