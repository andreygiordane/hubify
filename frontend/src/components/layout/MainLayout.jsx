import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MeetingToasts from '../common/MeetingToasts';
import SuccessModal from '../common/SuccessModal';
import DocumentPreviewModal from '../common/DocumentPreviewModal';

export default function MainLayout({ children }) {
  return (
    <div className="app-viewport bg-app text-ink">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 relative">
          <MeetingToasts />
          <SuccessModal />
          <DocumentPreviewModal />
          {children}
        </main>
      </div>
    </div>
  );
}
