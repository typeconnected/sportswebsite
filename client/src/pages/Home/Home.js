import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StreamCard, { StreamCardSkeleton } from '../../components/StreamCard/StreamCard';
import api from '../../utils/api';
import './Home.css';

const SPORTS = [
  { name: 'Baseball', icon: '⚾' },
  { name: 'Cricket', icon: '🏏' },
  { name: 'Basketball', icon: '🏀' },
  { name: 'Golf', icon: '⛳' },
  { name: 'Soccer', icon: '⚽' },
  { name: 'Lacrosse', icon: '🥍' },
  { name: 'Boxing', icon: '🥊' },
  { name: 'Football', icon: '🏈' },
  { name: 'Hockey', icon: '🏒' },
  { name: 'Motor Sports', icon: '🏎️' },
];

const MOCK_STREAMS = [
  { _id: '1', title: 'Italy vs France, Soccer', streamerName: 'SinePlax Multimedia', sport: 'Soccer', status: 'live', viewers: 6251, likes: 4744, tags: ['Sports', 'Football', 'Soccer'], thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&q=80' },
  { _id: '2', title: 'American Football', streamerName: 'SinePlax Multimedia', sport: 'Football', status: 'live', viewers: 6251, likes: 4744, tags: ['Sports', 'American Football'], thumbnail: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&q=80' },
  { _id: '3', title: 'László vs Kamilla', streamerName: 'Xpress Epose', sport: 'Boxing', status: 'live', viewers: 6251, likes: 4744, tags: ['Sports', 'Boxing', 'Live', 'Game'], thumbnail: 'https://images.unsplash.com/photo-1517438322307-e67111335449?w=400&q=80' },
  { _id: '4', title: 'Club A vs Club B', streamerName: 'SinePlax Multimedia', sport: 'Football', status: 'live', viewers: 6251, likes: 4744, tags: ['American Football', 'Live', 'Game'], thumbnail: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&q=80' },
  { _id: '5', title: 'NBA Finals - Lakers vs Celtics', streamerName: 'ESPN Digital', sport: 'Basketball', status: 'live', viewers: 12400, likes: 8900, tags: ['Sports', 'Basketball', 'NBA'], thumbnail: 'https://images.unsplash.com/photo-1546519638405-a9f9e1bba818?w=400&q=80' },
  { _id: '6', title: 'IPL 2024 - MI vs RCB', streamerName: 'Star Sports', sport: 'Cricket', status: 'upcoming', viewers: 0, likes: 1200, tags: ['Cricket', 'IPL', 'Upcoming'], thumbnail: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&q=80' },
];

const Home = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSport, setActiveSport] = useState(null);
  const [sortBy, setSortBy] = useState('Recent');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const params = new URLSearchParams({ status: 'live', limit: 12 });
        if (activeSport) params.set('sport', activeSport);
        const res = await api.get(`/streams?${params}`);
        setStreams(res.data.data?.length ? res.data.data : MOCK_STREAMS);
      } catch {
        setStreams(MOCK_STREAMS);
      } finally {
        setLoading(false);
      }
    };
    fetchStreams();
  }, [activeSport]);

  const filtered = activeSport ? streams.filter(s => s.sport === activeSport) : streams;

  return (
    <div className="page-container">
      {/* Explore Sports */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Explore Sports</h2>
          <div className="carousel-arrows">
            <button className="arrow-btn">‹</button>
            <button className="arrow-btn">›</button>
          </div>
        </div>

        <div className="sports-carousel">
          {SPORTS.map((sport) => (
            <div
              key={sport.name}
              className={`sport-item ${activeSport === sport.name ? 'active' : ''}`}
              onClick={() => setActiveSport(activeSport === sport.name ? null : sport.name)}
            >
              <div className="sport-icon-wrap">{sport.icon}</div>
              <span>{sport.name}</span>
            </div>
          ))}
        </div>

        {/* Carousel dots */}
        <div className="carousel-dots">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className={`dot ${i === 0 ? 'active' : ''}`} />
          ))}
        </div>
      </section>

      {/* Recent Live Sports */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Recent Live Sports</h2>
          <div className="sort-control">
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sort By :</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option>Recent</option>
              <option>Most Viewers</option>
              <option>Most Liked</option>
            </select>
          </div>
        </div>

        <div className="streams-grid">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <StreamCardSkeleton key={i} />)
            : filtered.map((stream) => <StreamCard key={stream._id} stream={stream} />)
          }
        </div>

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📡</div>
            <div className="empty-text">No live streams available right now</div>
            <button className="btn btn-secondary" onClick={() => setActiveSport(null)}>
              Clear filter
            </button>
          </div>
        )}
      </section>

      {/* Popular Sports Channels */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Popular Sports Channels</h2>
          <div className="carousel-arrows">
            <button className="arrow-btn">‹</button>
            <button className="arrow-btn">›</button>
          </div>
        </div>

        <div className="channels-row">
          {['ESPN', 'Fox Sports', 'Sky Sports', 'DAZN', 'beIN', 'Eurosport', 'TNT Sports'].map(ch => (
            <div key={ch} className="channel-chip" onClick={() => navigate(`/explore?channel=${ch}`)}>
              <div className="channel-icon">{ch[0]}</div>
              <span>{ch}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
