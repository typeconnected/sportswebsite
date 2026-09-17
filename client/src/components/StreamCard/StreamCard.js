import React from 'react';
import { useNavigate } from 'react-router-dom';
import './StreamCard.css';

const SPORT_THUMBNAILS = {
  Soccer: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&q=80',
  Football: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&q=80',
  Basketball: 'https://images.unsplash.com/photo-1546519638405-a9f9e1bba818?w=400&q=80',
  Baseball: 'https://images.unsplash.com/photo-1566351557863-467d0e4c4aba?w=400&q=80',
  Boxing: 'https://images.unsplash.com/photo-1517438322307-e67111335449?w=400&q=80',
  Cricket: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&q=80',
  Tennis: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&q=80',
  Hockey: 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=400&q=80',
  Golf: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80',
};

const formatNum = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n?.toString() || '0';
};

const StreamCard = ({ stream }) => {
  const navigate = useNavigate();
  const thumb = stream.thumbnail || SPORT_THUMBNAILS[stream.sport] || SPORT_THUMBNAILS.default;

  return (
    <div className="stream-card" onClick={() => navigate(`/stream/${stream._id}`)}>
      <div className="thumbnail">
        <img src={thumb} alt={stream.title} loading="lazy" />
        {stream.status === 'live' && (
          <div className="badge-wrapper">
            <span className="live-badge">Live</span>
          </div>
        )}
        {stream.status === 'upcoming' && (
          <div className="badge-wrapper">
            <span className="upcoming-badge">Upcoming</span>
          </div>
        )}
        {stream.isPremium && <span className="premium-badge">Premium</span>}
        <div className="card-hover-overlay">
          <span className="play-btn">▶</span>
        </div>
      </div>
      <div className="card-body">
        <div className="card-title" title={stream.title}>{stream.title}</div>
        <div className="card-meta">{stream.streamerName || stream.streamer?.username}</div>
        <div className="tags">
          {stream.sport && <span className="tag">{stream.sport}</span>}
          {stream.tags?.slice(0, 2).map((t) => <span key={t} className="tag">{t}</span>)}
          {stream.status === 'live' && <span className="tag tag-live">Live</span>}
        </div>
        <div className="stats">
          <span>👁 {formatNum(stream.viewers)} Viewers</span>
          <span>❤️ {formatNum(stream.likes)} Likes</span>
        </div>
      </div>
    </div>
  );
};

export const StreamCardSkeleton = () => (
  <div className="stream-card stream-card-skeleton">
    <div className="skeleton" style={{ paddingBottom: '56.25%' }} />
    <div className="card-body">
      <div className="skeleton" style={{ height: 18, marginBottom: 8, width: '80%' }} />
      <div className="skeleton" style={{ height: 14, marginBottom: 12, width: '50%' }} />
      <div className="skeleton" style={{ height: 12, width: '40%' }} />
    </div>
  </div>
);

export default StreamCard;
