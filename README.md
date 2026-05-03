# Hubify - Corporate Collaboration Platform v3.0

Hubify is a high-performance, real-time corporate communication and collaboration platform. Built with a focus on professional productivity, it integrates secure messaging, group coordination, and high-fidelity video meetings into a single, unified ecosystem.

## 🚀 Version 3.0 Highlights

This version represents a major leap in communication flexibility and professional tooling:

### 💬 Advanced Messaging Suite
- **Interactive Message Management**: Unified "three-dots" menu for intuitive message control.
- **Smart Editing**: Fix typos or update information within a 5-minute window after sending.
- **Contextual Replies**: Threaded-style replies with quoted message previews and "jump-to" navigation.
- **Content Forwarding**: Multi-select and share messages across different conversations (DMs and Groups) with origin tagging.
- **Cloud Clipboard**: Instant "Copy to Clipboard" for fast text sharing.
- **Reliable Deletion**: Real-time synchronization for message removal across all participants.

### 📞 Real-time Signaling & Calls
- **Robust Call Synchronization**: Cancellations are now synchronized instantly; canceling a call as the caller immediately clears the interface for all recipients.
- **Dynamic Dialing Screen**: New visual feedback for both 1:1 and group calls with stylized initials-based avatars.
- **Mute Preferences**: Integrated "Silent Mode" that strictly respects room-specific notification preferences.

### 👥 Collaboration & UI
- **Group Management**: Membership hierarchy (Admin/Member) with invite/remove capabilities.
- **Real-time Status**: Live connection indicators (Online/Offline) across the entire platform.
- **Professional Aesthetics**: Premium dark-mode themed interface with glassmorphism effects and modern typography.

---

## 🛠 Tech Stack

- **Frontend**: React.js, Tailwind CSS, Lucide Icons, Vite.
- **Backend**: Java (Spring Boot), PostgreSQL.
- **Real-time Engine**: Firestore / Realtime Database logic for instant signaling.
- **Video Services**: WebRTC with a dedicated Node.js signaling server.
- **Infrastructure**: Docker & Docker Compose for containerized deployment.

---

## 📦 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (for local development)
- Java 17 (for local backend development)

### Running with Docker (Recommended)
1. Clone the repository:
   ```bash
   git clone git@github.com:andreygiordane/hubify.git
   ```
2. Build and start the containers:
   ```bash
   docker-compose up --build -d
   ```
3. Access the application at `http://localhost:3000`.

---

## 📂 Architecture Overview

- `/frontend`: React application containing the UI and state management.
- `/backend`: Spring Boot REST API for user management, groups, and persistence.
- `/video-server`: Node.js signaling server for WebRTC handshakes.
- `docker-compose.yml`: Orchestration for Database, Backend, Frontend, and Video services.

---

## 👤 Author
**Andrey Giordane**
Email: [andreycostaa@gmail.com](mailto:andreycostaa@gmail.com)
GitHub: [@andreygiordane](https://github.com/andreygiordane)

---

Developed with ❤️ for Hubify v3.0
