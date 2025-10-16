import React from 'react';

interface GenreSelectorProps {
  value: string;
  onChange: (genre: string) => void;
}

const GENRES = [
  { id: 'pop', label: 'Pop' },
  { id: 'hiphop', label: 'Hip-Hop' },
  { id: 'rnb', label: 'R&B' },
  { id: 'rock', label: 'Rock' },
  { id: 'country', label: 'Country' },
  { id: 'edm', label: 'EDM' },
];

export const GenreSelector: React.FC<GenreSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <span className="text-gray-400">Genre</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 bg-black/40 border border-white/10 rounded text-gray-200 hover:bg-black/50"
      >
        {GENRES.map((g) => (
          <option key={g.id} value={g.id}>{g.label}</option>
        ))}
      </select>
    </div>
  );
};

