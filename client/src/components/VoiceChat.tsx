import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { socket } from '../lib/socket';
import SimplePeer from 'simple-peer';

export function VoiceChat() {
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState<{ peerId: string; peer: SimplePeer.Instance }[]>([]);
  const userStream = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [key: string]: SimplePeer.Instance }>({});

  useEffect(() => {
    const initVoice = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        userStream.current = stream;
        setIsConnected(true);

        socket.on('existing-users', (users: { id: string }[]) => {
          users.forEach(user => {
            createPeer(user.id, socket.id!, stream);
          });
        });

        socket.on('signal', (payload: { sender: string; signal: SimplePeer.SignalData }) => {
           const { sender, signal } = payload;
           const peer = peersRef.current[sender];
           
           if (peer) {
             peer.signal(signal);
           } else {
             // Incoming call (we are not the initiator)
             addPeer(sender, socket.id!, signal, stream);
           }
        });
        
        // Also handle the legacy/separate events if needed, but 'signal' covers it.
        // But wait, the server emits 'participants-update' then 'existing-users'.
        // If a new user joins, existing users get 'participants-update'.
        // They need to know to initiate? 
        // No, with the pattern "New user initiates to everyone", existing users just wait.
        // My server sends 'existing-users' to the NEW user. So NEW user initiates.
        // Existing users receive 'signal' (offer) and answer.
        // So this logic holds.

        socket.on('user-left', (payload) => {
           const peer = peersRef.current[payload.userId];
           if (peer) {
             peer.destroy();
             delete peersRef.current[payload.userId];
             setPeers(prev => prev.filter(p => p.peerId !== payload.userId));
           }
        });

      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    };

    initVoice();

    return () => {
      userStream.current?.getTracks().forEach(track => track.stop());
      Object.values(peersRef.current).forEach(peer => peer.destroy());
      socket.off('existing-users');
      socket.off('signal');
      socket.off('user-left');
    };
  }, []);

  function createPeer(targetId: string, callerId: string, stream: MediaStream) {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('signal', { target: targetId, signal, callerId });
    });

    peer.on('error', (err) => {
        console.error('Peer error:', err);
    });

    peersRef.current[targetId] = peer;
    setPeers(prev => [...prev, { peerId: targetId, peer }]);
  }

  function addPeer(incomingSignalId: string, callerId: string, incomingSignal: SimplePeer.SignalData, stream: MediaStream) {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('signal', { target: incomingSignalId, signal, callerId });
    });
    
    peer.on('error', (err) => {
        console.error('Peer error:', err);
    });

    peer.signal(incomingSignal);

    peersRef.current[incomingSignalId] = peer;
    setPeers(prev => [...prev, { peerId: incomingSignalId, peer }]);
  }

  const toggleMute = () => {
    if (userStream.current) {
      userStream.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 flex items-center justify-between mb-2">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isConnected ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
           <Volume2 size={20} />
        </div>
        <div>
          <h3 className="text-white font-medium text-sm">Voice Chat</h3>
          <p className="text-gray-400 text-xs">
            {isConnected ? `${peers.length + 1} connected` : 'Connecting...'}
          </p>
        </div>
      </div>
      
      <button
        onClick={toggleMute}
        className={`p-2 rounded-lg transition-colors ${
          isMuted 
            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
      </button>

      {/* Render Audio elements for peers */}
      {peers.map((peerObj) => (
        <Audio key={peerObj.peerId} peer={peerObj.peer} />
      ))}
    </div>
  );
}

const Audio = ({ peer }: { peer: SimplePeer.Instance }) => {
  const ref = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    peer.on('stream', stream => {
        if (ref.current) {
            ref.current.srcObject = stream;
        }
    });
  }, [peer]);

  return <audio ref={ref} autoPlay />;
};
