'use client';

import { useState } from 'react';
import { Music2, ChevronRight, ChevronLeft, Star, Heart } from 'lucide-react';
import styles from './StylePreferencesQuiz.module.css';

interface StylePreferencesQuizProps {
  onComplete?: (profile: StyleProfile) => void;
}

interface StyleProfile {
  favoriteGenres: string[];
  favoriteArtists: string[];
  vocalistInfluences: string[];
  preferredTempo: string[];
  emotionalPreferences: string[];
  songwritingInterest: string;
}

const QUIZ_STEPS = [
  {
    id: 'intro',
    title: 'Discover Your Musical Style',
    description: 'Help us understand your musical taste to personalize your experience.',
  },
  {
    id: 'genres',
    title: 'Favorite Genres',
    description: 'Select all genres that resonate with you.',
  },
  {
    id: 'artists',
    title: 'Country Artists',
    description: 'Which country artists inspire you?',
  },
  {
    id: 'vocalists',
    title: 'Vocal Influences',
    description: 'Who are your vocal inspirations?',
  },
  {
    id: 'tempo',
    title: 'Tempo Preferences',
    description: 'What energy level speaks to you?',
  },
  {
    id: 'emotion',
    title: 'Emotional Tone',
    description: 'What kind of songs move you?',
  },
  {
    id: 'songwriting',
    title: 'Songwriting Interest',
    description: 'Are you interested in writing your own songs?',
  },
  {
    id: 'results',
    title: 'Your Musical Profile',
    description: 'Here\'s what we learned about your style.',
  },
];

const GENRES = [
  { id: 'country', label: 'Country', emoji: '🤠' },
  { id: 'pop-country', label: 'Pop Country', emoji: '🎤' },
  { id: 'country-rock', label: 'Country Rock', emoji: '🎸' },
  { id: 'bluegrass', label: 'Bluegrass', emoji: '🪕' },
  { id: 'americana', label: 'Americana', emoji: '🎵' },
  { id: 'outlaw-country', label: 'Outlaw Country', emoji: '🏜️' },
];

const ARTISTS = [
  { id: 'morgan-wallen', label: 'Morgan Wallen', image: null },
  { id: 'jason-aldean', label: 'Jason Aldean', image: null },
  { id: 'randy-houser', label: 'Randy Houser', image: null },
  { id: 'luke-combs', label: 'Luke Combs', image: null },
  { id: 'chris-stapleton', label: 'Chris Stapleton', image: null },
  { id: 'cody-johnson', label: 'Cody Johnson', image: null },
  { id: 'carrie-underwood', label: 'Carrie Underwood', image: null },
  { id: 'lainey-wilson', label: 'Lainey Wilson', image: null },
];

const VOCALISTS = [
  { id: 'powerful', label: 'Powerful & Bold', examples: 'Chris Stapleton, Carrie Underwood' },
  { id: 'smooth', label: 'Smooth & Melodic', examples: 'Morgan Wallen, Luke Combs' },
  { id: 'gritty', label: 'Gritty & Raw', examples: 'Jason Aldean, Randy Houser' },
  { id: 'emotional', label: 'Emotional & Expressive', examples: 'Kacey Musgraves, Tyler Childers' },
];

const TEMPOS = [
  { id: 'slow-ballads', label: 'Slow Ballads', bpm: '60-80 BPM', emoji: '🌙' },
  { id: 'mid-tempo', label: 'Mid-Tempo Grooves', bpm: '80-110 BPM', emoji: '🎶' },
  { id: 'upbeat', label: 'Upbeat Anthems', bpm: '110-140 BPM', emoji: '⚡' },
  { id: 'party', label: 'Party Tracks', bpm: '140+ BPM', emoji: '🎉' },
];

const EMOTIONS = [
  { id: 'heartbreak', label: 'Heartbreak & Loss', emoji: '💔' },
  { id: 'love', label: 'Love & Romance', emoji: '❤️' },
  { id: 'party', label: 'Party & Fun', emoji: '🎊' },
  { id: 'nostalgia', label: 'Nostalgia & Memories', emoji: '🌅' },
  { id: 'empowerment', label: 'Empowerment & Confidence', emoji: '💪' },
  { id: 'storytelling', label: 'Storytelling & Narrative', emoji: '📖' },
];

const SONGWRITING_OPTIONS = [
  { id: 'yes-experienced', label: 'Yes, I write songs', desc: 'I have songwriting experience' },
  { id: 'yes-beginner', label: 'Yes, I want to learn', desc: 'I\'m interested in songwriting' },
  { id: 'maybe', label: 'Maybe someday', desc: 'Open to exploring it' },
  { id: 'no', label: 'No, just performing', desc: 'I prefer singing existing songs' },
];

export function StylePreferencesQuiz({ onComplete }: StylePreferencesQuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [favoriteArtists, setFavoriteArtists] = useState<string[]>([]);
  const [vocalistInfluences, setVocalistInfluences] = useState<string[]>([]);
  const [preferredTempo, setPreferredTempo] = useState<string[]>([]);
  const [emotionalPreferences, setEmotionalPreferences] = useState<string[]>([]);
  const [songwritingInterest, setSongwritingInterest] = useState<string>('');

  const step = QUIZ_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < QUIZ_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const toggleGenre = (id: string) => {
    setFavoriteGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleArtist = (id: string) => {
    setFavoriteArtists((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleVocalist = (id: string) => {
    setVocalistInfluences((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const toggleTempo = (id: string) => {
    setPreferredTempo((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleEmotion = (id: string) => {
    setEmotionalPreferences((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    const profile: StyleProfile = {
      favoriteGenres,
      favoriteArtists,
      vocalistInfluences,
      preferredTempo,
      emotionalPreferences,
      songwritingInterest,
    };

    if (onComplete) {
      onComplete(profile);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return favoriteGenres.length > 0;
    if (currentStep === 2) return favoriteArtists.length > 0;
    if (currentStep === 3) return vocalistInfluences.length > 0;
    if (currentStep === 4) return preferredTempo.length > 0;
    if (currentStep === 5) return emotionalPreferences.length > 0;
    if (currentStep === 6) return songwritingInterest !== '';
    return true;
  };

  return (
    <div className={styles.container}>
      {/* Progress Bar */}
      <div className={styles.progressBar}>
        {QUIZ_STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`${styles.progressDot} ${i <= currentStep ? styles.active : ''}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h2>{step.title}</h2>
        <p>{step.description}</p>

        {/* Intro Step */}
        {currentStep === 0 && (
          <div className={styles.intro}>
            <Music2 size={64} className={styles.icon} />
            <div className={styles.introText}>
              <p>This quick quiz helps us:</p>
              <ul>
                <li>Recommend songs that match your taste</li>
                <li>Suggest artists and styles to explore</li>
                <li>Personalize your vocal training journey</li>
                <li>Tailor AI coaching to your goals</li>
              </ul>
            </div>
          </div>
        )}

        {/* Genres */}
        {currentStep === 1 && (
          <div className={styles.optionGrid}>
            {GENRES.map((genre) => (
              <button
                key={genre.id}
                className={`${styles.optionCard} ${favoriteGenres.includes(genre.id) ? styles.selected : ''}`}
                onClick={() => toggleGenre(genre.id)}
              >
                <span className={styles.emoji}>{genre.emoji}</span>
                <span className={styles.optionLabel}>{genre.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Artists */}
        {currentStep === 2 && (
          <div className={styles.artistGrid}>
            {ARTISTS.map((artist) => (
              <button
                key={artist.id}
                className={`${styles.artistCard} ${favoriteArtists.includes(artist.id) ? styles.selected : ''}`}
                onClick={() => toggleArtist(artist.id)}
              >
                <div className={styles.artistIcon}>
                  <Star size={20} />
                </div>
                <span className={styles.artistLabel}>{artist.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Vocalists */}
        {currentStep === 3 && (
          <div className={styles.vocalistList}>
            {VOCALISTS.map((vocalist) => (
              <button
                key={vocalist.id}
                className={`${styles.vocalistCard} ${vocalistInfluences.includes(vocalist.id) ? styles.selected : ''}`}
                onClick={() => toggleVocalist(vocalist.id)}
              >
                <div className={styles.vocalistInfo}>
                  <span className={styles.vocalistLabel}>{vocalist.label}</span>
                  <span className={styles.vocalistExamples}>{vocalist.examples}</span>
                </div>
                {vocalistInfluences.includes(vocalist.id) && (
                  <Heart size={20} className={styles.heartIcon} fill="currentColor" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Tempo */}
        {currentStep === 4 && (
          <div className={styles.tempoList}>
            {TEMPOS.map((tempo) => (
              <button
                key={tempo.id}
                className={`${styles.tempoCard} ${preferredTempo.includes(tempo.id) ? styles.selected : ''}`}
                onClick={() => toggleTempo(tempo.id)}
              >
                <span className={styles.tempoEmoji}>{tempo.emoji}</span>
                <div className={styles.tempoInfo}>
                  <span className={styles.tempoLabel}>{tempo.label}</span>
                  <span className={styles.tempoBPM}>{tempo.bpm}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Emotions */}
        {currentStep === 5 && (
          <div className={styles.emotionGrid}>
            {EMOTIONS.map((emotion) => (
              <button
                key={emotion.id}
                className={`${styles.emotionCard} ${emotionalPreferences.includes(emotion.id) ? styles.selected : ''}`}
                onClick={() => toggleEmotion(emotion.id)}
              >
                <span className={styles.emotionEmoji}>{emotion.emoji}</span>
                <span className={styles.emotionLabel}>{emotion.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Songwriting */}
        {currentStep === 6 && (
          <div className={styles.songwritingList}>
            {SONGWRITING_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`${styles.songwritingCard} ${songwritingInterest === option.id ? styles.selected : ''}`}
                onClick={() => setSongwritingInterest(option.id)}
              >
                <div className={styles.songwritingInfo}>
                  <span className={styles.songwritingLabel}>{option.label}</span>
                  <span className={styles.songwritingDesc}>{option.desc}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {currentStep === 7 && (
          <div className={styles.results}>
            <div className={styles.resultsCard}>
              <h3>Your Musical DNA</h3>

              <div className={styles.resultSection}>
                <h4>Favorite Genres</h4>
                <div className={styles.tags}>
                  {favoriteGenres.map((id) => {
                    const genre = GENRES.find((g) => g.id === id);
                    return (
                      <span key={id} className={styles.tag}>
                        {genre?.emoji} {genre?.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className={styles.resultSection}>
                <h4>Favorite Artists</h4>
                <div className={styles.tags}>
                  {favoriteArtists.map((id) => {
                    const artist = ARTISTS.find((a) => a.id === id);
                    return (
                      <span key={id} className={styles.tag}>
                        {artist?.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className={styles.resultSection}>
                <h4>Vocal Style</h4>
                <div className={styles.tags}>
                  {vocalistInfluences.map((id) => {
                    const vocalist = VOCALISTS.find((v) => v.id === id);
                    return (
                      <span key={id} className={styles.tag}>
                        {vocalist?.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className={styles.resultSection}>
                <h4>Tempo Preferences</h4>
                <div className={styles.tags}>
                  {preferredTempo.map((id) => {
                    const tempo = TEMPOS.find((t) => t.id === id);
                    return (
                      <span key={id} className={styles.tag}>
                        {tempo?.emoji} {tempo?.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className={styles.resultSection}>
                <h4>Emotional Themes</h4>
                <div className={styles.tags}>
                  {emotionalPreferences.map((id) => {
                    const emotion = EMOTIONS.find((e) => e.id === id);
                    return (
                      <span key={id} className={styles.tag}>
                        {emotion?.emoji} {emotion?.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className={styles.resultSection}>
                <h4>Songwriting Interest</h4>
                <div className={styles.songwritingResult}>
                  {SONGWRITING_OPTIONS.find((o) => o.id === songwritingInterest)?.label}
                </div>
              </div>

              <button className={styles.completeBtn} onClick={handleComplete}>
                Save Profile & Continue
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className={styles.navigation}>
        <button
          className={styles.navBtn}
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft size={20} />
          Previous
        </button>

        {currentStep < QUIZ_STEPS.length - 1 && (
          <button
            className={styles.navBtn}
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
