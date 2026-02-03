import { createContext, useContext, useEffect, useState, useRef, ReactNode, Dispatch, SetStateAction } from 'react';
import { supabase } from '../lib/supabase';
import type { Room, Participant, Reaction } from '../lib/supabase';
import { socket } from '../lib/socket';

export interface Message {
  id: string;
  user_name: string;
  text: string;
  video_timestamp: number;
  created_at: string;
}

interface WatchPartyContextType {
  room: Room | null;
  participants: Participant[];
  reactions: Reaction[];
  messages: Message[];
  currentUser: string | null;
  isHost: boolean;
  kickUser: (participantId: string) => void;
  endParty: () => void;
  createRoom: (name: string, movieUrl: string, movieTitle: string, userName: string, subtitlesUrl?: string) => Promise<string>;
  joinRoom: (roomId: string, userName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  updatePlayback: (currentTime: number, isPlaying: boolean) => Promise<void>;
  addReaction: (emoji: string, timestamp: number) => Promise<void>;
  sendMessage: (text: string, videoTimestamp: number) => void;
  setCurrentUser: (name: string) => void;
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

const WatchPartyContext = createContext<WatchPartyContextType | undefined>(undefined);

export function WatchPartyProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const lastEmitTime = useRef<number>(0);

  // Sync isHost with room creator initially, but allow socket update
  useEffect(() => {
    if (room?.host_id && currentUser) {
      setIsHost(room.host_id === currentUser);
    }
  }, [room?.host_id, currentUser]);

  useEffect(() => {
    if (!room?.id || !currentUser) return;

    // Connect to Socket.IO
    socket.connect();

    // Generate or retrieve a stable user ID for this session
    // This prevents "ghost users" when the socket reconnects (e.g. WiFi flicker)
    let stableUserId = sessionStorage.getItem('watch_party_user_id');
    if (!stableUserId) {
        // Use auth ID if available (needs to be passed in, but for now we use random UUID for stability)
        // If we had the real auth user ID here, we should use it.
        // Since we don't have it easily accessible in this scope without prop drilling, 
        // a session-based UUID is fine for preventing ghosts in the current session.
        stableUserId = crypto.randomUUID();
        sessionStorage.setItem('watch_party_user_id', stableUserId);
    }

    const joinPayload = { 
      roomId: room.id, 
      user: { 
        id: stableUserId, // Send stable ID
        name: currentUser,
        user_name: currentUser,
        room_id: room.id,
        is_online: true,
        joined_at: new Date().toISOString()
      } 
    };

    socket.emit('join-room', joinPayload);

    // Re-join on reconnection
    socket.on('connect', () => {
        console.log('Socket reconnected, re-joining room...');
        socket.emit('join-room', joinPayload);
    });

    socket.on('participants-update', (data: any) => {
      // Update participants list from server (Source of Truth for presence)
      if (data.participants) {
        setParticipants(data.participants);
      }
      
      // Handle host update
      if (data.hostId) {
        if (socket.id === data.hostId) {
          setIsHost(true);
        } else {
          setIsHost(false);
        }
      }
    });

    socket.on('kicked', () => {
      alert('You have been kicked from the room.');
      leaveRoom();
      window.location.href = '/';
    });

    socket.on('party-ended', () => {
      alert('The host has ended the party.');
      leaveRoom();
      window.location.href = '/';
    });

    // We keep Supabase as the source of truth for initial loading, but Socket for live updates.

    socket.on('playback-update', (playbackState: { currentTime: number; isPlaying: boolean; timestamp: number }) => {
      setRoom((prev) => {
        if (!prev) return null;
        
        // FIX: Removed server-client clock diff calculation which caused major desync due to clock skew.
        // Instead, we trust the host's timestamp and assume a small network latency buffer (150ms).
        const NETWORK_LATENCY_BUFFER = 0.15;
        const estimatedTime = playbackState.isPlaying 
          ? playbackState.currentTime + NETWORK_LATENCY_BUFFER
          : playbackState.currentTime;

        return {
          ...prev,
          current_time: estimatedTime,
          is_playing: playbackState.isPlaying,
          updated_at: new Date().toISOString() // Use local time for last update
        };
      });
    });

    socket.on('new-reaction', (reaction: Reaction) => {
      setReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 5000);
    });

    socket.on('new-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Supabase subscriptions (keep for room metadata updates and initial participant loading)
    const roomChannel = supabase
      .channel(`room:${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
             // Only update non-playback fields from Supabase to avoid conflicts, 
             // or allow Supabase to be the source of truth if socket fails.
             // For now, let's merge carefully.
             const newRoom = payload.new as Room;
             setRoom((prev) => prev ? { ...prev, ...newRoom } : newRoom);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${room.id}` },
        async () => {
          // We now rely on Socket.IO for the live participants list to handle disconnects/ghosts correctly.
          // Supabase is used only for initial load or historical data.
          // keeping this here just in case we want to merge, but for now we ignore it to prevent conflict.
          /*
          const { data } = await supabase
            .from('participants')
            .select('*')
            .eq('room_id', room.id)
            .order('joined_at', { ascending: true });
          if (data) setParticipants(data);
          */
        }
      )
      .subscribe();

    const heartbeat = setInterval(async () => {
      if (participantId) {
        await supabase
          .from('participants')
          .update({ last_seen: new Date().toISOString(), is_online: true })
          .eq('id', participantId);
      }
    }, 5000);

    return () => {
      socket.off('participants-update');
      socket.off('kicked');
      socket.off('playback-update');
      socket.off('new-reaction');
      socket.disconnect();
      roomChannel.unsubscribe();
      clearInterval(heartbeat);
    };
  }, [room?.id, currentUser, participantId]);

  const kickUser = (targetParticipantId: string) => {
    if (room?.id) {
      socket.emit('kick-user', { roomId: room.id, targetUserId: targetParticipantId });
    }
  };

  const endParty = () => {
    if (room?.id && isHost) {
      socket.emit('end-party', { roomId: room.id });
    }
  };

  const createRoom = async (name: string, movieUrl: string, movieTitle: string, userName: string, subtitlesUrl?: string) => {
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name,
        host_id: userName,
        movie_url: movieUrl,
        movie_title: movieTitle,
        subtitles_url: subtitlesUrl,
      })
      .select()
      .single();

    if (error) throw error;

    setRoom(data);
    setCurrentUser(userName);

    const { data: participant } = await supabase
      .from('participants')
      .insert({ room_id: data.id, user_name: userName })
      .select()
      .single();

    if (participant) setParticipantId(participant.id);

    return data.id;
  };

  const joinRoom = async (roomId: string, userName: string) => {
    const { data: roomData, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) throw error;

    setRoom(roomData);
    setCurrentUser(userName);

    const { data: participant } = await supabase
      .from('participants')
      .insert({ room_id: roomId, user_name: userName })
      .select()
      .single();

    if (participant) setParticipantId(participant.id);

    const { data: participantsData } = await supabase
      .from('participants')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (participantsData) setParticipants(participantsData);
  };

  const leaveRoom = async () => {
    if (participantId) {
      await supabase.from('participants').delete().eq('id', participantId);
    }
    setRoom(null);
    setParticipants([]);
    setReactions([]);
    setParticipantId(null);
    socket.disconnect();
  };

  const updatePlayback = async (currentTime: number, isPlaying: boolean) => {
    if (!room || !isHost) return;

    // Optimistic update
    setRoom((prev) => prev ? { ...prev, playback_time: currentTime, is_playing: isPlaying } : null);

    // Throttle socket emission to once per second unless play state changes
    const now = Date.now();
    if (isPlaying === room.is_playing && now - lastEmitTime.current < 1000) {
      return;
    }
    lastEmitTime.current = now;

    // Emit to Socket.IO
    socket.emit('sync-playback', {
      roomId: room.id,
      playbackState: {
        currentTime,
        isPlaying
      }
    });

    // Optionally persist to Supabase (debounced or on pause)
    if (!isPlaying || Math.floor(currentTime) % 5 === 0) { // Update DB less frequently
        await supabase
        .from('rooms')
        .update({
            current_time: currentTime,
            is_playing: isPlaying,
            updated_at: new Date().toISOString(),
        })
        .eq('id', room.id);
    }
  };

  const addReaction = async (emoji: string, timestamp: number) => {
    if (!room || !currentUser) return;

    const reaction = {
        id: crypto.randomUUID(), // Generate a temporary ID
        room_id: room.id,
        user_name: currentUser,
        emoji,
        timestamp,
        created_at: new Date().toISOString()
    };

    // Emit to socket
    socket.emit('send-reaction', { roomId: room.id, reaction });

    // Persist to Supabase for history
    await supabase.from('reactions').insert({
      room_id: room.id,
      user_name: currentUser,
      emoji,
      timestamp,
    });
  };

  const sendMessage = (text: string, videoTimestamp: number) => {
    if (!room || !currentUser) return;

    const message: Message = {
      id: crypto.randomUUID(),
      user_name: currentUser,
      text,
      video_timestamp: videoTimestamp,
      created_at: new Date().toISOString(),
    };

    socket.emit('send-message', { roomId: room.id, message });
  };

  return (
    <WatchPartyContext.Provider
      value={{
        room,
        participants,
        reactions,
        messages,
        currentUser,
        isHost,
        createRoom,
        joinRoom,
        leaveRoom,
        updatePlayback,
        addReaction,
        sendMessage,
        setCurrentUser,
        setMessages,
        kickUser,
      }}
    >
      {children}
    </WatchPartyContext.Provider>
  );
}

export function useWatchParty() {
  const context = useContext(WatchPartyContext);
  if (!context) {
    throw new Error('useWatchParty must be used within WatchPartyProvider');
  }
  return context;
}
