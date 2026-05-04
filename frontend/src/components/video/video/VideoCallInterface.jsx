import React, { useState, useEffect } from "react";
import { useChat } from '../../../context/ChatContext';
import { useCallLogic } from '../logic/useCallLogic';
import WebVideoCallInterface from './WebVideoCallInterface';
import MobileVideoCallInterface from './MobileVideoCallInterface';

export default function VideoCallInterface({ roomId, currentUser, socket, onLeave }) {
  const { users, statusConfig, handleInviteToCall } = useChat();
  const {
    allParticipants, localStream, cameraStream, screenSharing, time,
    isMicOn, isVideoOn, isHandRaised, setIsHandRaised,
    messages, toggleMic, toggleVideo, shareScreen, handleSendMessage, handleExit,
    invitedUserIds, inviteUser
  } = useCallLogic({ roomId, currentUser, socket, callType: 'video', onLeave });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCamHidden, setIsCamHidden] = useState(false);
  const [windowIsMobile, setWindowIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setWindowIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const commonProps = {
    roomId, currentUser, allParticipants, localStream, cameraStream, screenSharing, time,
    isMicOn, isVideoOn, isHandRaised, setIsHandRaised,
    messages, toggleMic, toggleVideo, shareScreen, handleSendMessage, handleExit,
    invitedUserIds, inviteUser, users, statusConfig, handleInviteToCall,
    isChatOpen, setIsChatOpen, isPeopleOpen, setIsPeopleOpen, isInviteOpen, setIsInviteOpen
  };

  if (windowIsMobile) {
    return <MobileVideoCallInterface {...commonProps} />;
  }

  return (
    <WebVideoCallInterface 
      {...commonProps}
      isCamHidden={isCamHidden}
      setIsCamHidden={setIsCamHidden}
    />
  );
}
