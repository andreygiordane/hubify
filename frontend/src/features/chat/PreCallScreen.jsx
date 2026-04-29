import React, { useEffect, useRef, useState } from 'react';

const PreCallScreen = ({ mode, onJoin, onCancel }) => {
  const [stream, setStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(mode === 'video');
  const videoRef = useRef(null);

  const [error, setError] = useState(null);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === 'video',
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        // Fallback: try only audio if video failed
        if (mode === 'video') {
          try {
            const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setStream(audioOnly);
            setVideoEnabled(false);
            setError('Não foi possível acessar a câmera (pode estar em uso), entrando apenas com áudio.');
          } catch (audioErr) {
            setError('Não foi possível acessar microfone ou câmera. Verifique as permissões do navegador.');
          }
        } else {
          setError('Não foi possível acessar o microfone.');
        }
      }
    };
    getMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mode]);

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const handleJoin = () => {
    onJoin({ audioEnabled, videoEnabled, stream });
  };

  return (
    <div className="pre-call-overlay">
      <div className="pre-call-container">
        <h2>Configurações da Chamada</h2>
        <p>Verifique sua câmera e microfone antes de entrar.</p>
        
        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div className="pre-call-preview">
          {mode === 'video' ? (
            <video ref={videoRef} autoPlay muted playsInline />
          ) : (
            <div className="pre-call-placeholder">
              <span className="pre-call-icon">🎧</span>
            </div>
          )}
          <div className="pre-call-controls-overlay">
            <button
              className={`pre-call-control-btn ${!audioEnabled ? 'disabled' : ''}`}
              onClick={toggleAudio}
            >
              {audioEnabled ? '🎤' : '🔇'}
            </button>
            {mode === 'video' && (
              <button
                className={`pre-call-control-btn ${!videoEnabled ? 'disabled' : ''}`}
                onClick={toggleVideo}
              >
                {videoEnabled ? '🎥' : '📵'}
              </button>
            )}
          </div>
        </div>

        <div className="pre-call-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleJoin}>
            Entrar na Chamada
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreCallScreen;
