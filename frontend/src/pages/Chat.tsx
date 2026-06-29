import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function Chat() {
  const [searchParams] = useSearchParams();
  const preselectedUserId = searchParams.get('userId');
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (preselectedUserId) {
      setSelectedConversation(preselectedUserId);
    }
  }, [preselectedUserId]);

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data;
    },
  });

  const { data: messagesData } = useQuery({
    queryKey: ['messages', selectedConversation],
    enabled: !!selectedConversation,
    queryFn: async () => {
      const { data } = await api.get(`/chat/messages?userId=${selectedConversation}`);
      return data;
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!messageInput.trim() || !selectedConversation) return;
      await api.post('/chat/messages', {
        receiverId: selectedConversation,
        content: messageInput,
      });
    },
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => {
      toast.error('Unable to send message right now');
    },
  });

  const handleSend = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    sendMessageMutation.mutate();
  };

  return (
    <div className="h-[calc(100vh-12rem)]">
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">Messages</h1>

      <div className="card h-full flex overflow-hidden p-0">
        {/* Conversation list */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-400 outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations?.length > 0 ? (
              conversations.map((conv: any) => (
                <button
                  key={conv.id || conv._id}
                  onClick={() => {
                    const otherUserId =
                      conv.participant1 === currentUserId ? conv.participant2 : conv.participant1;
                    setSelectedConversation(otherUserId);
                  }}
                  className={`w-full text-left p-4 hover:bg-gray-50 border-b border-gray-50 ${
                    selectedConversation ===
                    (conv.participant1 === currentUserId ? conv.participant2 : conv.participant1)
                      ? 'bg-primary-50'
                      : ''
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">Conversation</p>
                  <p className="text-xs text-gray-500 truncate mt-1">{conv.lastMessage}</p>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                No conversations yet. Match with someone to start chatting!
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Chat</h3>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messagesData?.messages?.length > 0 ? (
                  [...messagesData.messages].reverse().map((message: any) => {
                    const isMine = message.senderId === currentUserId;
                    return (
                      <div
                        key={message.id || message._id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                            isMine
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
                )}
              </div>
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 input-field text-sm py-2"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sendMessageMutation.isPending}
                    className="btn-primary px-4 py-2 disabled:opacity-60"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
