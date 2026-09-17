import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './Schedule.css';

const MOCK_SCHEDULE = [
  { _id: 's1', title: 'IPL 2024 - MI vs RCB', sport: 'Cricket', streamerName: 'Star Sports', scheduledAt: new Date(Date.now() + 2 * 3600000).toISOString(), teams: { home: 'MI', away: 'RCB' } },
  { _id: 's2', title: 'UEFA Champions League Final', sport: 'Soccer', streamerName: 'beIN Sports', scheduledAt: new Date(Date.now() + 5 * 3600000).toISOString(), teams: { home: 'Real Madrid', away: 'Man City' } },
  { _id: 's3', title: 'NBA Playoffs - Game 7', sport: 'Basketball', streamerName: 'ESPN', scheduledAt: new Date(Date.now() + 8 * 3600000).toISOString(), teams: { home: 'Lakers', away: 'Celtics' } },
  { _id: 's4', title: 'Wimbledon Men\'s Final', sport: 'Tennis', streamerName: 'Sky Sports', scheduledAt: new Date(Date.now() + 24 * 3600000).toISOString(), teams: { home: 'Alcaraz', away: 'Djokovic' } },
  { _id: 's5', title: 'Super Bowl LVIX', sport: 'Football', streamerName: 'Fox Sports', scheduledAt: new Date(Date.now() + 48 * 3600000).toISOString(), teams: { home: 'Chiefs', away: 'Eagles' } },
];

const SPORT_ICONS = {
  Soccer: '⚽', Football: '🏈', Basketball: '🏀', Baseball: '⚾',
  Cricket: '🏏', Tennis: '🎾', Boxing: '🥊', Hockey: '🏒', Golf: '⛳',
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getTimeUntil = (iso) => {
  const diff = new Date(iso) - Date.now();
  if (diff < 0) return 'Starting soon';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `In ${h}h ${m}m`;
  return `In ${m} minutes`;
};

const Schedule = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState('All');

  useEffect(() => {
    api.get('/schedule')
      .then(res => setEvents(res.data.data?.length ? res.data.data : MOCK_SCHEDULE))
      .catch(() => setEvents(MOCK_SCHEDULE))
      .finally(() => setLoading(false));
  }, []);

  const sports = ['All', ...new Set(events.map(e => e.sport))];
  const filtered = sportFilter === 'All' ? events : events.filter(e => e.sport === sportFilter);

  return (
    <div className="page-container">
      <div className="section-header">
        <h2 className="section-title">Sports Schedule</h2>
      </div>

      <div className="schedule-filters">
        {sports.map(s => (
          <button
            key={s}
            className={`filter-chip ${sportFilter === s ? 'active' : ''}`}
            onClick={() => setSportFilter(s)}
          >
            {SPORT_ICONS[s] || '🏆'} {s}
          </button>
        ))}
      </div>

      <div className="schedule-list">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="schedule-card">
              <div className="skeleton" style={{ height: 80 }} />
            </div>
          ))
          : filtered.map(event => (
            <div key={event._id} className="schedule-card">
              <div className="schedule-sport-icon">
                {SPORT_ICONS[event.sport] || '🏆'}
              </div>
              <div className="schedule-info">
                <div className="schedule-title">{event.title}</div>
                <div className="schedule-meta">
                  <span>{event.sport}</span>
                  <span>•</span>
                  <span>{event.streamerName}</span>
                </div>
                {event.teams?.home && (
                  <div className="schedule-teams">
                    <span>{event.teams.home}</span>
                    <span className="vs">vs</span>
                    <span>{event.teams.away}</span>
                  </div>
                )}
              </div>
              <div className="schedule-time">
                <div className="schedule-date">{formatDate(event.scheduledAt)}</div>
                <div className="schedule-clock">{formatTime(event.scheduledAt)}</div>
                <div className="time-until">{getTimeUntil(event.scheduledAt)}</div>
              </div>
              <button className="btn btn-secondary remind-btn">🔔 Remind</button>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default Schedule;
