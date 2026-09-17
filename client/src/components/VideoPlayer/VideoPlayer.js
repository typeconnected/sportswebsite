import React, { useEffect, useRef, useState } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ stream, socket, viewerCount }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const chatEndRef = useRef(null);
  const controlsTimer = useRef(null);

  // Auto-hide controls
  const resetControlsTimer = () => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream?.hlsUrl) return;

    // HLS.js for live streams
    const loadHls = async () => {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream.hlsUrl;
      } else {
        try {
          const Hls = (await import('hls.js')).default;
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90,
            });
            hls.loadSource(stream.hlsUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
            return () => hls.destroy();
          }
        } catch (e) {
          console.warn('HLS.js not available, using native');
          video.src = stream.hlsUrl;
        }
      }
    };

    loadHls();
  }, [stream?.hlsUrl]);

  // Socket chat
  useEffect(() => {
    if (!socket || !stream?._id) return;

    socket.emit('join_stream', stream._id);

    socket.on('chat_history', (msgs) => setChatMessages(msgs));
    socket.on('new_message', (msg) => {
      setChatMessages((prev) => [...prev.slice(-49), msg]);
    });

    return () => {
      socket.emit('leave_stream', stream._id);
      socket.off('chat_history');
      socket.off('new_message');
    };
  }, [socket, stream?._id]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); setIsPlaying(true); }
    else { video.pause(); setIsPlaying(false); }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolume = (e) => {
    const video = videoRef.current;
    const val = parseFloat(e.target.value);
    if (!video) return;
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleFullscreen = () => {
    const el = document.querySelector('.player-wrapper');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    socket.emit('chat_message', { streamId: stream._id, message: chatInput.trim() });
    setChatInput('');
  };

  return (
    <div className="player-section">
      <div
        className="player-wrapper"
        onMouseMove={resetControlsTimer}
        onMouseLeave={() => setShowControls(false)}
      >
        {stream?.hlsUrl ? (
          <video
            ref={videoRef}
            className="video-element"
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
          />
        ) : (
          <div className="player-placeholder">
            <div className="placeholder-icon">📡</div>
            <div className="placeholder-text">
              {stream?.status === 'upcoming' ? 'Stream starts soon' : 'Stream offline'}
            </div>
          </div>
        )}

        {/* Controls overlay */}
        <div className={`player-controls ${showControls ? 'visible' : ''}`}>
          <div className="controls-gradient" />
          <div className="controls-bar">
            <button className="ctrl-btn" onClick={togglePlay}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div className="volume-control">
              <button className="ctrl-btn" onClick={toggleMute}>
                {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input
                type="range"
                min="0" max="1" step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolume}
                className="volume-slider"
              />
            </div>
            <div className="live-indicator">
              <span className="live-badge">LIVE</span>
              <span className="viewer-count">👁 {viewerCount?.toLocaleString() || 0}</span>
            </div>
            <div className="ctrl-spacer" />
            <button className="ctrl-btn" onClick={() => setShowChat(c => !c)}>
              💬
            </button>
            <button className="ctrl-btn" onClick={toggleFullscreen}>
              {isFullscreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Chat */}
      {showChat && (
        <div className="live-chat">
          <div className="chat-header">
            <span>💬 Live Chat</span>
            <span className="chat-count">{viewerCount} viewers</span>
          </div>
          <div className="chat-messages">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="chat-msg">
                <span className="chat-username">{msg.username}</span>
                <span className="chat-text">{msg.message}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form className="chat-input-row" onSubmit={sendChat}>
            <input
              type="text"
              placeholder="Say something..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              maxLength={300}
              className="chat-input"
            />
            <button type="submit" className="chat-send-btn">Send</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
