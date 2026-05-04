// Wrapper Nativo do WebRTC
export class Peer {
  constructor({ initiator, trickle = true, stream }) {
    this._pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    this.handlers = {};
    this.trickle = trickle;
    this.candidateQueue = [];
    
    if (stream) stream.getTracks().forEach(track => this._pc.addTrack(track, stream));
    
    this._pc.onicecandidate = (e) => {
      if (!this.trickle && !e.candidate) this.emit("signal", this._pc.localDescription);
      else if (this.trickle && e.candidate) this.emit("signal", { candidate: e.candidate });
    };
    
    this._remoteStreamIds = new Set();
    this._pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        const stream = e.streams[0];
        if (!this._remoteStreamIds.has(stream.id)) {
          this._remoteStreamIds.add(stream.id);
          this.emit("stream", stream);
        }
      }
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
      this._pc.setRemoteDescription(new RTCSessionDescription(data))
        .then(() => { 
           // Process queued candidates
           this.candidateQueue.forEach(candidate => {
               this._pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => console.error(err));
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
    } else if (data.candidate) {
      if (this._pc.remoteDescription) {
        this._pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(err => console.error(err));
      } else {
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
      return this._pc.setLocalDescription(offer).then(() => {
        this.emit("signal", offer);
      });
    }).catch(err => console.error("Error creating offer during removeStream:", err));
  }
  
  destroy() {
    this._pc.close();
  }
}
