import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { socket } from '../lib/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ],
};

export function VoiceChat() {
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  
  const userStream = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});

  useEffect(() => {
    const initVoice = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        userStream.current = stream;
        setIsConnected(true);

        socket.on('existing-users', (users: any[]) => {
          users.forEach(user => {
            createPeer(user.id, socket.id!, stream);
          });
        });

        socket.on('user-joined', (payload: { userId: string }) => {
          // We wait for them to call us, or we call them?
          // If we follow "New user calls existing", we just wait for offer.
          // But to be robust, let's stick to "New user creates offers".
        });

        socket.on('offer', async (payload) => {
          const peer = addPeer(payload.callerId, stream);
          await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          
          socket.emit('answer', {
            target: payload.callerId,
            callerId: socket.id,
            sdp: answer
          });
        });

        socket.on('answer', async (payload) => {
          const peer = peersRef.current[payload.callerId];
          if (peer) {
            await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          }
        });

        socket.on('ice-candidate', async (payload) => {
          const peer = peersRef.current[payload.callerId];
          if (peer && payload.candidate) {
            await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
        });

        socket.on('user-left', (payload) => {
            if (peersRef.current[payload.userId]) {
                peersRef.current[payload.userId].close();
                delete peersRef.current[payload.userId];
                setPeers(prev => prev.filter(id => id !== payload.userId));
            }
        });

      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    };

    initVoice();

    return () => {
      userStream.current?.getTracks().forEach(track => track.stop());
      Object.values(peersRef.current).forEach(peer => peer.close());
      socket.off('existing-users');
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-left');
    };
  }, []);

  function createPeer(targetId: string, myId: string, stream: MediaStream) {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[targetId] = peer;
    setPeers(prev => [...prev, targetId]);

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', {
          target: targetId,
          callerId: myId,
          candidate: e.candidate
        });
      }
    };

    peer.ontrack = (e) => {
      const audio = new Audio();
      audio.srcObject = e.streams[0];
      audio.play();
    };

    peer.createOffer().then(offer => {
      peer.setLocalDescription(offer);
      socket.emit('offer', {
        target: targetId,
        callerId: myId,
        sdp: offer
      });
    });

    return peer;
  }

  function addPeer(incomingUserId: string, stream: MediaStream) {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[incomingUserId] = peer;
    setPeers(prev => [...prev, incomingUserId]);

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', {
          target: incomingUserId,
          callerId: socket.id,
          candidate: e.candidate
        });
      }
    };

    peer.ontrack = (e) => {
      const audio = new Audio();
      audio.srcObject = e.streams[0];
      audio.play();
    };

    return peer;
  }

  const toggleMute = () => {
    if (userStream.current) {
      userStream.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  if (!isConnected) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
        <div className="bg-green-500/20 p-2 rounded-full">
            <Volume2 size={20} className="text-green-500" />
        </div>
        <div className="flex-1">
            <p className="text-white text-sm font-medium">Voice Chat</p>
            <p className="text-gray-400 text-xs">{peers.length} connected</p>
        </div>
        <button 
            onClick={toggleMute}
            className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
        >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
    </div>
  );
}
