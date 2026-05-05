// Wrapper Nativo do WebRTC
export class Peer {
  constructor({ initiator, trickle = true, stream }) {
    this._pc = new RTCPeerConnection({ 
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' },
        { urls: 'stun:stun.apple.com' },
        { urls: 'stun:stun.ekiga.net' },
        { urls: 'stun:stun.ideasip.com' },
        { urls: 'stun:stun.rixtelecom.se' },
        { urls: 'stun:stun.schlund.de' },
        { urls: 'stun:stun.stunprotocol.org' },
        { urls: 'stun:stun.voiparound.com' },
        { urls: 'stun:stun.voipbuster.com' },
        { urls: 'stun:stun.voipstunt.com' }
      ],
      iceCandidatePoolSize: 10
    });
    this.handlers = {};
    this.trickle = trickle;
    this.candidateQueue = [];

    if (stream) {
      console.log("[WebRTC] Adding local tracks to PeerConnection");
      stream.getTracks().forEach(track => this._pc.addTrack(track, stream));
    }

    this._pc.onicecandidate = (e) => {
      try {
        console.log('[WebRTC] onicecandidate event:', e.candidate ? 'candidate' : 'null-end');
        if (e.candidate) console.log('[WebRTC] Candidate snippet:', (e.candidate.candidate || '').slice(0, 120));
      } catch (err) {}
      if (!this.trickle) {
        if (!e.candidate) {
          console.log('[WebRTC] Emitting bundled localDescription (non-trickle)');
          this.emit("signal", this._pc.localDescription);
        }
      } else {
        // Envia o candidato (mesmo que seja null, para sinalizar o fim da coleta)
        this.emit("signal", { candidate: e.candidate });
      }
    };

    this._pc.ontrack = (e) => {
      console.log("[WebRTC] Track received:", e.track.kind);
      if (e.streams && e.streams[0]) {
        this.emit("stream", e.streams[0]);
      } else {
        // Fallback para navegadores que não agrupam tracks em streams automaticamente
        const inboundStream = new MediaStream([e.track]);
        this.emit("stream", inboundStream);
      }
    };

    this._pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE Connection State:", this._pc.iceConnectionState);
    };

    if (initiator) {
      this._pc.createOffer().then(offer => {
        return this._pc.setLocalDescription(offer).then(() => {
          if (this.trickle) this.emit("signal", offer);
        });
      }).catch(err => console.error(err));
    }
  }

  on(event, fn) { this.handlers[event] = fn; }
  emit(event, data) { if (this.handlers[event]) this.handlers[event](data); }

  signal(data) {
    if (!data) return;
    if (data.type === 'offer' || data.type === 'answer') {
      try { console.log('[WebRTC] signal() received remote description:', data.type, 'sdpLen=', data.sdp ? data.sdp.length : 0); } catch(e) {}
      this._pc.setRemoteDescription(new RTCSessionDescription(data))
        .then(() => {
          // Process queued candidates
          this.candidateQueue.forEach(candidate => {
            if (candidate) {
              this._pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => console.error(err));
            } else {
              console.log("[WebRTC] Processed queued end-of-candidates marker");
            }
          });
          this.candidateQueue = [];

          if (data.type === 'offer') {
            return this._pc.createAnswer().then(answer => {
              return this._pc.setLocalDescription(answer).then(() => {
                if (this.trickle) this.emit("signal", answer);
              });
            });
          }
        })
        .catch(err => console.error(err));
    } else if ('candidate' in data) {
      if (this._pc.remoteDescription) {
        if (data.candidate) {
          this._pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(err => console.error(err));
        } else {
          console.log("[WebRTC] End of candidates reached");
        }
      } else {
        // Queue all candidates including null (end-of-candidates marker)
        this.candidateQueue.push(data.candidate);
      }
    }
  }

  addStream(stream) {
    if (!stream) return;
    stream.getTracks().forEach(track => {
      this._pc.addTrack(track, stream);
    });

    // Trigger re-negotiation
    this._pc.createOffer().then(offer => {
      try { console.log('[WebRTC] addStream created offer sdpLen=', offer.sdp ? offer.sdp.length : 0); } catch(e) {}
      return this._pc.setLocalDescription(offer).then(() => {
        this.emit("signal", offer);
      });
    }).catch(err => console.error("Error creating offer during addStream:", err));
  }

  removeStream(stream) {
    if (!stream) return;
    const senders = this._pc.getSenders();
    stream.getTracks().forEach(track => {
      const sender = senders.find(s => s.track === track);
      if (sender) {
        this._pc.removeTrack(sender);
      }
    });

    // Trigger re-negotiation
    this._pc.createOffer().then(offer => {
      try { console.log('[WebRTC] removeStream created offer sdpLen=', offer.sdp ? offer.sdp.length : 0); } catch(e) {}
      return this._pc.setLocalDescription(offer).then(() => {
        this.emit("signal", offer);
      });
    }).catch(err => console.error("Error creating offer during removeStream:", err));
  }

  destroy() {
    this._pc.close();
  }
}
