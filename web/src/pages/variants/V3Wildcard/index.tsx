import { Sparkles } from 'lucide-react';
import './styles.css';

export function V3Wildcard() {
  return (
    <div className="variant-placeholder">
      <div className="variant-placeholder-content">
        <Sparkles size={48} strokeWidth={1.5} />
        <h1>V3: Wildcard</h1>
        <p>Experimental space for unconventional approaches. Break the rules, try something weird.</p>
        <div className="variant-placeholder-ideas">
          <h3>Wild ideas:</h3>
          <ul>
            <li>Tinder-style swipe matching</li>
            <li>AI-generated job posts from conversation</li>
            <li>Reverse job board - workers post availability</li>
            <li>Team composition builder</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default V3Wildcard;
