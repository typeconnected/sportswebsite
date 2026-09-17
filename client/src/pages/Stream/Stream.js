import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './Stream.css';

const StreamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchStream = async () => {
      try {
        const res = await api.get(`/streams/${id}`);
        setStream(res.data.data);
        setViewerCount(res.data.data.viewers || 0);
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, [id, isAuthenticated, navigate]);

  // Initialize socket
  useEffect(() => {
    if (!accessToken || !id) return;

    const socket = io(window.location.origin, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socket.on('viewer_count', (count) => setViewerCount(count));
    socket.on('connect_error', (err) => console.warn('Socket error:', err.message));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [accessToken, id]);

  if (loading) {
    return (
      <div className="stream-loading">
        <div className="stream-loading-spinner" />
        <div>Loading stream...</div>
      </div>
    );
  }

  if (!stream) return null;

  return (
    <div className="stream-page page-container">
      <div className="stream-back">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <VideoPlayer
        stream={stream}
        socket={socketRef.current}
        viewerCount={viewerCount}
      />

      <div className="stream-info">
        <div className="stream-info-main">
          <h1 className="stream-title">{stream.title}</h1>
          <div className="stream-meta">
            <span className="live-badge">Live</span>
            <span className="stream-sport">{stream.sport}</span>
            <span className="stream-viewers">👁 {viewerCount?.toLocaleString()} watching</span>
          </div>
          <div className="stream-description">{stream.description}</div>
        </div>

        <div className="stream-streamer">
          <div className="streamer-avatar">{stream.streamerName?.[0]?.toUpperCase()}</div>
          <div>
            <div className="streamer-name">{stream.streamerName}</div>
            <div className="streamer-label">Streamer</div>
          </div>
          <button className="btn btn-primary follow-btn">Follow</button>
        </div>

        {(stream.teams?.home || stream.teams?.away) && (
          <div className="teams-display">
            <div className="team">
              <div className="team-badge">{stream.teams.home?.[0]}</div>
              <div className="team-name">{stream.teams.home}</div>
            </div>
            <div className="vs-label">VS</div>
            <div className="team">
              <div className="team-badge">{stream.teams.away?.[0]}</div>
              <div className="team-name">{stream.teams.away}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamPage;
