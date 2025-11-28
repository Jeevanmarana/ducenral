import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, ChatRoom, ChatMessage } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Send, Users } from 'lucide-react';

interface ExtendedChatMessage extends ChatMessage {
  sender_name?: string;
}

interface TypingUser {
  user_id: string;
  name: string;
}

export function Chat() {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>(null);
  const typingChannelRef = useRef<any>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      setMessages([]);
      setTypingUsers(new Map());
      fetchMessages(selectedRoom);
      subscribeToMessages(selectedRoom);
      subscribeToTyping(selectedRoom);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
      }
    };
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at');

    if (!error && data) {
      setRooms(data);
      if (data.length > 0 && !selectedRoom) {
        setSelectedRoom(data[0].id);
      }
    }
    setLoading(false);
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          room_id,
          user_id,
          message,
          created_at,
          profiles (name)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        const formattedMessages: ExtendedChatMessage[] = data.map((msg: any) => ({
          id: msg.id,
          room_id: msg.room_id,
          user_id: msg.user_id,
          message: msg.message,
          created_at: msg.created_at,
          sender_name: msg.profiles?.name || 'Unknown',
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = (roomId: string) => {
    channelRef.current = supabase
      .channel(`room:${roomId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: user?.id },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', payload.new.user_id)
            .maybeSingle();

          const newMsg: ExtendedChatMessage = {
            id: payload.new.id,
            room_id: payload.new.room_id,
            user_id: payload.new.user_id,
            message: payload.new.message,
            created_at: payload.new.created_at,
            sender_name: profileData?.name || 'Unknown',
          };

          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMsg.id);
            return exists ? prev : [...prev, newMsg];
          });

          setTypingUsers((prev) => {
            const updated = new Map(prev);
            updated.delete(payload.new.user_id);
            return updated;
          });
        }
      )
      .subscribe();
  };

  const subscribeToTyping = (roomId: string) => {
    typingChannelRef.current = supabase.channel(`typing:${roomId}`);

    typingChannelRef.current
      .on('broadcast', { event: 'user_typing' }, (payload) => {
        if (payload.payload.user_id !== user?.id) {
          setTypingUsers((prev) => {
            const updated = new Map(prev);
            updated.set(payload.payload.user_id, {
              user_id: payload.payload.user_id,
              name: payload.payload.name,
            });
            return updated;
          });

          setTimeout(() => {
            setTypingUsers((prev) => {
              const updated = new Map(prev);
              updated.delete(payload.payload.user_id);
              return updated;
            });
          }, 3000);
        }
      })
      .subscribe();
  };

  const broadcastTyping = useCallback(async () => {
    if (!selectedRoom || !user || !profile) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingChannelRef.current?.send({
      type: 'broadcast',
      event: 'user_typing',
      payload: {
        user_id: user.id,
        name: profile.name,
        room_id: selectedRoom,
      },
    });

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = undefined;
    }, 3000);
  }, [selectedRoom, user, profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) {
      broadcastTyping();
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || !user || !profile) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;

    const optimisticMessage: ExtendedChatMessage = {
      id: tempId,
      room_id: selectedRoom,
      user_id: user.id,
      message: messageText,
      created_at: new Date().toISOString(),
      sender_name: profile.name,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    setSending(true);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: selectedRoom,
          user_id: user.id,
          message: messageText,
        });

      if (error) {
        console.error('Error sending message:', error);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setNewMessage(messageText);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const currentRoom = rooms.find((room) => room.id === selectedRoom);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-[calc(100vh-12rem)]">
        <div className="grid md:grid-cols-4 h-full">
          <div className="md:col-span-1 border-r border-gray-200 bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Chat Rooms</span>
              </h2>
            </div>

            {loading ? (
              <div className="p-4">
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto h-[calc(100%-4rem)]">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    className={`w-full p-4 text-left hover:bg-white transition border-b border-gray-200 ${
                      selectedRoom === room.id ? 'bg-white border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {room.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {room.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-3 flex flex-col">
            {currentRoom ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-white">
                  <h3 className="text-xl font-bold text-gray-900">{currentRoom.name}</h3>
                  <p className="text-sm text-gray-600">{currentRoom.description}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 text-center">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => {
                        const isOwn = message.user_id === user?.id;
                        const isTempMessage = message.id.startsWith('temp-');
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                              isTempMessage ? 'opacity-60' : 'opacity-100'
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md ${
                                isOwn
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-900 border border-gray-200'
                              } rounded-2xl px-4 py-2 shadow-sm transition-opacity`}
                            >
                              {!isOwn && message.sender_name && (
                                <p className="text-xs font-semibold mb-1 text-gray-600">
                                  {message.sender_name}
                                </p>
                              )}
                              <p className="break-words">{message.message}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isOwn ? 'text-blue-200' : 'text-gray-500'
                                }`}
                              >
                                {isTempMessage ? 'Sending...' : new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                <div className="border-t border-gray-200 bg-white p-4">
                  {typingUsers.size > 0 && (
                    <div className="mb-3 text-xs text-gray-500 italic">
                      {Array.from(typingUsers.values())
                        .map((u) => u.name)
                        .join(', ')}{' '}
                      {typingUsers.size === 1 ? 'is' : 'are'} typing...
                    </div>
                  )}
                  <form onSubmit={sendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleInputChange}
                      placeholder="Type a message..."
                      disabled={sending}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Select a chat room to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
