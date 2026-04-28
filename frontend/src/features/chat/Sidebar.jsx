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
        const response = await api.post('/streams', { name: newStreamName.trim() });
        // Assume parent component will re-fetch streams or we just update local state
        // For simplicity, doing a full page reload or calling a prop fetchStreams would be better.
        // Let's just reload for now to keep it simple, or update state if passed down.
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
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>Hubify</h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Streams</h4>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setShowNewStreamInput(!showNewStreamInput)}>+</button>
        </div>
        
        {showNewStreamInput && (
          <input 
            type="text" 
            className="input-base" 
            placeholder="New stream..." 
            value={newStreamName}
            onChange={(e) => setNewStreamName(e.target.value)}
            onKeyDown={handleCreateStream}
            style={{ marginBottom: '1rem', padding: '0.4rem', fontSize: '0.85rem' }}
            autoFocus
          />
        )}

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0' }}>
          {streams.map((stream) => (
            <li key={stream.id}>
              <button 
                onClick={() => { setActiveStream(stream); setActiveTopic(null); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.5rem',
                  background: activeStream?.id === stream.id ? 'var(--bg-tertiary)' : 'transparent',
                  border: 'none',
                  color: activeStream?.id === stream.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontWeight: activeStream?.id === stream.id ? '500' : 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span style={{ color: 'var(--accent-color)' }}>#</span> {stream.name}
              </button>
            </li>
          ))}
        </ul>

        {activeStream && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Topics in {activeStream.name}</h4>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setShowNewTopicInput(!showNewTopicInput)}>+</button>
            </div>

            {showNewTopicInput && (
              <input 
                type="text" 
                className="input-base" 
                placeholder="New topic..." 
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                onKeyDown={handleCreateTopic}
                style={{ marginBottom: '1rem', padding: '0.4rem', fontSize: '0.85rem' }}
                autoFocus
              />
            )}

            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {topics.map((topic) => (
                <li key={topic.id}>
                  <button 
                    onClick={() => setActiveTopic(topic)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.4rem 0.5rem 0.4rem 2rem',
                      background: activeTopic?.id === topic.id ? 'rgba(92, 111, 255, 0.1)' : 'transparent',
                      border: 'none',
                      color: activeTopic?.id === topic.id ? 'var(--accent-color)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    {topic.name}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          {user?.username.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 500, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.username}</div>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
