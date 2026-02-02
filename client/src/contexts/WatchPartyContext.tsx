import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  createRoom: (name: string, movieUrl: string, movieTitle: string, userName: string) => Promise<string>;
  joinRoom: (roomId: string, userName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  updatePlayback: (currentTime: number, isPlaying: boolean) => Promise<void>;
  addReaction: (emoji: string, timestamp: number) => Promise<void>;
  sendMessage: (text: string, videoTimestamp: number) => void;
  setCurrentUser: (name: string) => void;
}

const WatchPartyContext = createContext<WatchPartyContextType | undefined>(undefined);

export function WatchPartyProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);

  const isHost = room?.host_id === currentUser;

  useEffect(() => {
    if (!room?.id || !currentUser) return;

    // Connect to Socket.IO
    socket.connect();
    socket.emit('join-room', { 
      roomId: room.id, 
      user: { name: currentUser, id: participantId } 
    });

    socket.on('participants-update', (updatedParticipants: any[]) => {
      // Map socket participants to our Participant type if needed
      // For now, we trust the structure or we might need to fetch from Supabase if we want full details
      // But let's assume socket sends enough info.
      // Actually, let's keep Supabase for participants list for now to avoid breaking changes, 
      // but we could use socket for "online" status.
      // The user wants "Sync resilience", so Supabase is good for initial load.
    });

    socket.on('playback-update', (playbackState: { currentTime: number; isPlaying: boolean; timestamp: number }) => {
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          current_time: playbackState.currentTime,
          is_playing: playbackState.isPlaying,
          updated_at: new Date(playbackState.timestamp).toISOString()
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
          const { data } = await supabase
            .from('participants')
            .select('*')
            .eq('room_id', room.id)
            .order('joined_at', { ascending: true });
          if (data) setParticipants(data);
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
      socket.off('playback-update');
      socket.off('new-reaction');
      socket.disconnect();
      roomChannel.unsubscribe();
      clearInterval(heartbeat);
    };
  }, [room?.id, currentUser, participantId]);

  const createRoom = async (name: string, movieUrl: string, movieTitle: string, userName: string) => {
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name,
        host_id: userName,
        movie_url: movieUrl,
        movie_title: movieTitle,
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

    // Emit to Socket.IO
    socket.emit('sync-playback', {
      roomId: room.id,
      playbackState: {
        currentTime,
        isPlaying
      }
    });

    // Optionally persist to Supabase (debounced or on pause)
    // For now, let's update Supabase every time to keep it in sync for late joiners
    // but maybe we should debounce this in a real app.
    // The previous code updated Supabase on every call.
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
