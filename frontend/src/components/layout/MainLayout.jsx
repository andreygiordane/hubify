
import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import MeetingToasts from '../common/MeetingToasts';
import SuccessModal from '../common/SuccessModal';
import DocumentPreviewModal from '../common/DocumentPreviewModal';

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-[#FDFDFD] overflow-hidden text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 relative">
        <MeetingToasts />
        <SuccessModal />
        <DocumentPreviewModal />
        {children}
      </main>
    </div>
  );
}
