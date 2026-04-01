import { useState, useMemo } from 'react';
import { Check, ChevronRight, Sparkles } from 'lucide-react';
import { SAMPLE_WORKERS } from '../../../data/workers';
import { WorkerCardTeaser } from '../../../components/Workers/WorkerCardTeaser';
import type { MatchedWorker, BrandTier } from '../../../types';
import './styles.css';

// Brand logos - grouped by tier
const BRAND_LOGOS: { name: string; tier: BrandTier; logo: string }[] = [
  // Luxury
  { name: 'Gucci', tier: 'luxury', logo: '/images/logos/gucci.svg' },
  { name: 'Chanel', tier: 'luxury', logo: '/images/logos/chanel.svg' },
  { name: 'Louis Vuitton', tier: 'luxury', logo: '/images/logos/lv.svg' },
  { name: 'Prada', tier: 'luxury', logo: '/images/logos/prada.svg' },
  { name: 'Dior', tier: 'luxury', logo: '/images/logos/dior.svg' },
  { name: 'Burberry', tier: 'luxury', logo: '/images/logos/burberry.svg' },
  // Elevated
  { name: 'Rag & Bone', tier: 'elevated', logo: '/images/logos/rag-bone.svg' },
  { name: 'Theory', tier: 'elevated', logo: '/images/logos/theory.svg' },
  { name: 'Madewell', tier: 'elevated', logo: '/images/logos/madewell.svg' },
  { name: 'Club Monaco', tier: 'elevated', logo: '/images/logos/club-monaco.svg' },
  { name: 'Nordstrom', tier: 'elevated', logo: '/images/logos/nordstrom.svg' },
  { name: 'Lululemon', tier: 'elevated', logo: '/images/logos/lululemon.svg' },
  // Mid
  { name: 'Nike', tier: 'mid', logo: '/images/logos/nike.svg' },
  { name: 'Adidas', tier: 'mid', logo: '/images/logos/adidas.svg' },
  { name: 'Anthropologie', tier: 'mid', logo: '/images/logos/anthropologie.svg' },
  { name: 'Free People', tier: 'mid', logo: '/images/logos/free-people.svg' },
  { name: 'Urban Outfitters', tier: 'mid', logo: '/images/logos/urban-outfitters.svg' },
  { name: 'UNIQLO', tier: 'mid', logo: '/images/logos/uniqlo.svg' },
];

// This-or-that questions
interface ThisOrThatQuestion {
  id: string;
  question: string;
  optionA: { label: string; value: string };
  optionB: { label: string; value: string };
}

const QUESTIONS: ThisOrThatQuestion[] = [
  {
    id: 'employment',
    question: 'What type of role?',
    optionA: { label: 'Full-time', value: 'FT' },
    optionB: { label: 'Part-time', value: 'PT' },
  },
  {
    id: 'experience',
    question: 'Experience level?',
    optionA: { label: 'Seasoned pro', value: 'experienced' },
    optionB: { label: 'Rising talent', value: 'newer' },
  },
  {
    id: 'style',
    question: 'Work style?',
    optionA: { label: 'Self-starter', value: 'independent' },
    optionB: { label: 'Team player', value: 'collaborative' },
  },
  {
    id: 'availability',
    question: 'Availability?',
    optionA: { label: 'Weekends', value: 'weekends' },
    optionB: { label: 'Weekdays', value: 'weekdays' },
  },
];

type Step = 'brands' | 'questions' | 'results';

export function V2TalentCentric() {
  const [step, setStep] = useState<Step>('brands');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Toggle brand selection
  const toggleBrand = (brandName: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandName)
        ? prev.filter(b => b !== brandName)
        : [...prev, brandName]
    );
  };

  // Handle this-or-that answer
  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));

    // Auto-advance to next question or results
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestionIndex(prev => prev + 1), 300);
    } else {
      setTimeout(() => setStep('results'), 300);
    }
  };

  // Filter and score workers based on selections
  const filteredWorkers = useMemo(() => {
    let workers = SAMPLE_WORKERS.filter(w => w.shiftVerified); // Only show verified

    // Filter by selected brands
    if (selectedBrands.length > 0) {
      workers = workers.filter(w =>
        w.brandsWorked.some(b => selectedBrands.includes(b.name))
      );
    }

    // Apply question filters
    if (answers.employment) {
      workers = workers.filter(w =>
        w.preference === 'Both' || w.preference === answers.employment
      );
    }

    if (answers.experience === 'experienced') {
      workers = workers.filter(w => w.shiftsOnReflex >= 30);
    } else if (answers.experience === 'newer') {
      workers = workers.filter(w => w.shiftsOnReflex < 30);
    }

    if (answers.style === 'independent') {
      workers = workers.filter(w =>
        w.endorsements.includes('self-starter') || w.workStyle.traits.includes('Self-directed')
      );
    } else if (answers.style === 'collaborative') {
      workers = workers.filter(w => w.endorsements.includes('team-player'));
    }

    if (answers.availability === 'weekends') {
      workers = workers.filter(w => w.availability.weekends);
    }

    // Score workers
    const scored: MatchedWorker[] = workers.map(w => {
      let score = 50;

      // Brand match bonus
      const brandMatches = w.brandsWorked.filter(b => selectedBrands.includes(b.name)).length;
      score += brandMatches * 10;

      // Shifts bonus
      score += Math.min(w.shiftsOnReflex, 50);

      // Reliability bonus
      if (w.onTimeRating === 'Exceptional') score += 15;
      if (w.commitmentScore === 'Exceptional') score += 10;

      // Invited back bonus
      score += Math.min(w.invitedBackStores * 2, 20);

      return {
        ...w,
        matchScore: Math.min(score, 100),
        matchReasons: [],
      };
    });

    // Sort by score
    return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 8);
  }, [selectedBrands, answers]);

  // Get brands the filtered workers have in common
  const commonBrands = useMemo(() => {
    const brandCounts: Record<string, number> = {};
    filteredWorkers.forEach(w => {
      w.brandsWorked.forEach(b => {
        brandCounts[b.name] = (brandCounts[b.name] || 0) + 1;
      });
    });
    return Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name);
  }, [filteredWorkers]);

  const handleContinue = () => {
    if (step === 'brands' && selectedBrands.length > 0) {
      setStep('questions');
    }
  };

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const progress = step === 'brands' ? 0 : step === 'questions' ? ((currentQuestionIndex + 1) / QUESTIONS.length) * 100 : 100;

  return (
    <div className="v2-container">
      {/* Main content area */}
      <div className="v2-main">
        {/* Progress bar */}
        <div className="v2-progress">
          <div className="v2-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        {/* Step 1: Brand Selection */}
        {step === 'brands' && (
          <div className="v2-brands-step">
            <div className="v2-step-header">
              <h1 className="type-tagline">What brands do you admire?</h1>
              <p className="v2-step-subtitle">
                Select brands whose talent you'd want on your team. We'll show you Reflexers with experience there.
              </p>
            </div>

            <div className="v2-brand-grid">
              {BRAND_LOGOS.map(brand => (
                <button
                  key={brand.name}
                  className={`v2-brand-tile ${selectedBrands.includes(brand.name) ? 'selected' : ''}`}
                  onClick={() => toggleBrand(brand.name)}
                >
                  <div className="v2-brand-logo">
                    {/* Fallback to text if no logo */}
                    <span className="v2-brand-name">{brand.name}</span>
                  </div>
                  {selectedBrands.includes(brand.name) && (
                    <div className="v2-brand-check">
                      <Check size={16} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="v2-step-footer">
              <button
                className="v2-continue-btn"
                disabled={selectedBrands.length === 0}
                onClick={handleContinue}
              >
                Continue
                <ChevronRight size={20} />
              </button>
              {selectedBrands.length > 0 && (
                <span className="v2-selection-count">{selectedBrands.length} selected</span>
              )}
            </div>
          </div>
        )}

        {/* Step 2: This or That Questions */}
        {step === 'questions' && currentQuestion && (
          <div className="v2-questions-step">
            <div className="v2-step-header">
              <span className="v2-question-count">Question {currentQuestionIndex + 1} of {QUESTIONS.length}</span>
              <h1 className="type-tagline">{currentQuestion.question}</h1>
            </div>

            <div className="v2-this-or-that">
              <button
                className={`v2-choice-btn ${answers[currentQuestion.id] === currentQuestion.optionA.value ? 'selected' : ''}`}
                onClick={() => handleAnswer(currentQuestion.id, currentQuestion.optionA.value)}
              >
                <span className="v2-choice-label">{currentQuestion.optionA.label}</span>
                {answers[currentQuestion.id] === currentQuestion.optionA.value && (
                  <Check size={24} className="v2-choice-check" />
                )}
              </button>

              <span className="v2-or-divider">or</span>

              <button
                className={`v2-choice-btn ${answers[currentQuestion.id] === currentQuestion.optionB.value ? 'selected' : ''}`}
                onClick={() => handleAnswer(currentQuestion.id, currentQuestion.optionB.value)}
              >
                <span className="v2-choice-label">{currentQuestion.optionB.label}</span>
                {answers[currentQuestion.id] === currentQuestion.optionB.value && (
                  <Check size={24} className="v2-choice-check" />
                )}
              </button>
            </div>

            <div className="v2-question-dots">
              {QUESTIONS.map((q, idx) => (
                <span
                  key={q.id}
                  className={`v2-dot ${idx === currentQuestionIndex ? 'active' : ''} ${idx < currentQuestionIndex ? 'completed' : ''}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 'results' && (
          <div className="v2-results-step">
            <div className="v2-step-header">
              <div className="v2-results-icon">
                <Sparkles size={32} />
              </div>
              <h1 className="type-tagline">Meet your matches</h1>
              <p className="v2-step-subtitle">
                {filteredWorkers.length} Reflexers match your criteria. Connect to learn more or book a shift.
              </p>
            </div>

            {commonBrands.length > 0 && (
              <div className="v2-common-brands">
                <span className="v2-common-brands-label">Experience at:</span>
                <div className="v2-common-brands-list">
                  {commonBrands.map(brand => (
                    <span key={brand} className="pill pill-stroke pill-sm">
                      <span className="pill-text">{brand}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="v2-results-actions">
              <button className="v2-action-btn v2-action-primary">
                Connect with all {filteredWorkers.length}
              </button>
              <button className="v2-action-btn v2-action-secondary" onClick={() => {
                setStep('brands');
                setCurrentQuestionIndex(0);
                setAnswers({});
                setSelectedBrands([]);
              }}>
                Start over
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar with worker cards */}
      <div className="v2-sidebar">
        <div className="v2-sidebar-header">
          <h2 className="type-section-header-md">
            {step === 'brands' && 'Shift Verified Reflexers'}
            {step === 'questions' && 'Matching talent'}
            {step === 'results' && `${filteredWorkers.length} matches`}
          </h2>
          {filteredWorkers.length > 0 && step !== 'results' && (
            <span className="v2-sidebar-count">{filteredWorkers.length} found</span>
          )}
        </div>

        <div className="v2-sidebar-cards">
          {filteredWorkers.length === 0 ? (
            <div className="v2-no-matches">
              <p>No matches yet. Try selecting different brands or criteria.</p>
            </div>
          ) : (
            filteredWorkers.map(worker => (
              <WorkerCardTeaser
                key={worker.id}
                worker={worker}
                onClick={() => {/* TODO: open full card */}}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default V2TalentCentric;
