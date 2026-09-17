import React, { useState, useEffect } from 'react';
import StreamCard, { StreamCardSkeleton } from '../../components/StreamCard/StreamCard';
import api from '../../utils/api';
import './Browse.css';

const SPORTS = [
  { name: 'Baseball', icon: '⚾' }, { name: 'Cricket', icon: '🏏' },
  { name: 'Basketball', icon: '🏀' }, { name: 'Golf', icon: '⛳' },
  { name: 'Soccer', icon: '⚽' }, { name: 'Lacrosse', icon: '🥍' },
  { name: 'Boxing', icon: '🥊' }, { name: 'Football', icon: '🏈' },
  { name: 'Hockey', icon: '🏒' }, { name: 'Motor Sports', icon: '🏎️' },
  { name: 'Tennis', icon: '🎾' }, { name: 'Swimming', icon: '🏊' },
];

const Browse = () => {
  const [selected, setSelected] = useState(null);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected) { setStreams([]); return; }
    setLoading(true);
    api.get(`/sports/${selected}/streams`)
      .then(res => setStreams(res.data.data || []))
      .catch(() => setStreams([]))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="page-container">
      <div className="section-header">
        <h2 className="section-title">Browse Sports</h2>
      </div>

      <div className="browse-sports-grid">
        {SPORTS.map(s => (
          <div
            key={s.name}
            className={`browse-sport-card ${selected === s.name ? 'active' : ''}`}
            onClick={() => setSelected(selected === s.name ? null : s.name)}
          >
            <div className="browse-sport-icon">{s.icon}</div>
            <div className="browse-sport-name">{s.name}</div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="browse-results">
          <div className="section-header">
            <h2 className="section-title">{selected} Streams</h2>
          </div>
          <div className="streams-grid">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <StreamCardSkeleton key={i} />)
              : streams.map(s => <StreamCard key={s._id} stream={s} />)
            }
            {!loading && streams.length === 0 && (
              <div style={{ color: 'var(--text-muted)', padding: '40px 0', gridColumn: '1/-1', textAlign: 'center' }}>
                No live {selected} streams right now
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Browse;
