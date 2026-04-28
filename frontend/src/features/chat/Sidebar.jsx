import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Sidebar = ({ streams, activeStream, setActiveStream, activeTopic, setActiveTopic, user, logout }) => {
  const [topics, setTopics] = useState([]);
  const [newStreamName, setNewStreamName] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [showNewStreamInput, setShowNewStreamInput] = useState(false);
  const [showNewTopicInput, setShowNewTopicInput] = useState(false);

  useEffect(() => {
    if (activeStream) {
      const fetchTopics = async () => {
        try {
          const response = await api.get(`/streams/${activeStream.id}/topics`);
          setTopics(response.data);
          if (response.data.length > 0 && !activeTopic) {
            setActiveTopic(response.data[0]);
          } else if (response.data.length === 0) {
            setActiveTopic(null);
          }
        } catch (error) {
          console.error('Error fetching topics', error);
        }
      };
      fetchTopics();
    }
  }, [activeStream]);

  const handleCreateStream = async (e) => {
    if (e.key === 'Enter' && newStreamName.trim()) {
      try {
        await api.post('/streams', { name: newStreamName.trim() });
        window.location.reload();
      } catch (error) {
        console.error('Error creating stream', error);
      }
    }
  };

  const handleCreateTopic = async (e) => {
    if (e.key === 'Enter' && newTopicName.trim() && activeStream) {
      try {
        const response = await api.post(`/streams/${activeStream.id}/topics`, { name: newTopicName.trim() });
        setTopics([...topics, response.data]);
        setActiveTopic(response.data);
        setNewTopicName('');
        setShowNewTopicInput(false);
      } catch (error) {
        console.error('Error creating topic', error);
      }
    }
  };

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">H</div>
        <span className="sidebar-logo-text">Hubify</span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0 1rem' }}>

        {/* Streams Section */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">Streams</span>
            <button
              className="sidebar-add-btn"
              onClick={() => setShowNewStreamInput(!showNewStreamInput)}
              title="Novo Stream"
            >
              +
            </button>
          </div>

          {showNewStreamInput && (
            <input
              type="text"
              className="input-base"
              placeholder="Nome do stream..."
              value={newStreamName}
              onChange={(e) => setNewStreamName(e.target.value)}
              onKeyDown={handleCreateStream}
              style={{ marginBottom: '0.5rem', fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
              autoFocus
            />
          )}

          <ul className="sidebar-nav" style={{ marginBottom: '0.5rem' }}>
            {streams.map((stream) => (
              <li key={stream.id}>
                <button
                  className={`sidebar-nav-item${activeStream?.id === stream.id ? ' active' : ''}`}
                  onClick={() => { setActiveStream(stream); setActiveTopic(null); }}
                >
                  <span className="nav-item-hash">#</span>
                  {stream.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Topics Section */}
        {activeStream && (
          <div className="sidebar-section" style={{ marginTop: '0.5rem' }}>
            <div className="sidebar-section-header">
              <span className="sidebar-section-title">Tópicos</span>
              <button
                className="sidebar-add-btn"
                onClick={() => setShowNewTopicInput(!showNewTopicInput)}
                title="Novo Tópico"
              >
                +
              </button>
            </div>

            {showNewTopicInput && (
              <input
                type="text"
                className="input-base"
                placeholder="Nome do tópico..."
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                onKeyDown={handleCreateTopic}
                style={{ marginBottom: '0.5rem', fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
                autoFocus
              />
            )}

            <ul className="sidebar-nav">
              {topics.map((topic) => (
                <li key={topic.id}>
                  <button
                    className={`sidebar-nav-item topic-item${activeTopic?.id === topic.id ? ' active' : ''}`}
                    onClick={() => setActiveTopic(topic)}
                  >
                    <span className="nav-item-icon">💬</span>
                    {topic.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-avatar">
          {user?.username?.charAt(0).toUpperCase() ?? 'U'}
          <div className="sidebar-avatar-status" />
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-username">{user?.username ?? 'Usuário'}</div>
          <div className="sidebar-status">Online</div>
        </div>
        <button
          className="sidebar-settings-btn"
          onClick={logout}
          title="Sair"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
