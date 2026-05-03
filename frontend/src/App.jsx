
import React from 'react';
import { useAuth } from './context/AuthContext';
import { useChat } from './context/ChatContext';
import Auth from './Auth.jsx';
import MainLayout from './components/layout/MainLayout';
import Chat from './pages/Chat';
import Meetings from './pages/Meetings';
import Calendar from './pages/Calendar';
import Contacts from './pages/Contacts';
import Invitations from './pages/Invitations';
import MeetingRoom from './pages/MeetingRoom';
import SettingsProfile from './pages/SettingsProfile';
import Modals from './components/modals/Modals';

export default function App() {
  const { user, login } = useAuth();
  const { view, setView } = useChat();

  React.useEffect(() => {
    // Try locking orientation to portrait where supported (secure contexts / installed PWA)
    try {
      if (screen && screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(() => {});
      }
    } catch (e) { /* ignore */ }
  }, []);

  if (!user) {
    return <Auth onLogin={login} />;
  }

  if (view === 'room') {
    return <MeetingRoom />;
  }

  return (
    <MainLayout view={view} setView={setView}>
      {view === 'chat' && <Chat />}
      {view === 'meetings' && <Meetings />}
      {view === 'calendar' && <Calendar />}
      {view === 'contacts' && <Contacts />}
      {view === 'invitations' && <Invitations />}
      {view === 'settings' && <SettingsProfile />}
      <Modals />
    </MainLayout>
  );
}
