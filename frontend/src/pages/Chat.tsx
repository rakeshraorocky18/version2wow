import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Send, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { getPhotoUrl } from '../lib/profileUtils';
import { useAuthStore } from '../store/authStore';
import { useAcceptedInterests } from '../hooks/useMatchmaking';

function getOtherParticipant(
  conv: { participants?: string[]; participant1?: string; participant2?: string },
  currentUserId?: string,
) {
  if (conv.participants?.length) {
    return conv.participants.find((id) => id !== currentUserId) || conv.participants[0] || '';
  }
  if (conv.participant1 && conv.participant2) {
    return conv.participant1 === currentUserId ? conv.participant2 : conv.participant1;
  }
  return '';
}

export default function Chat() {
  const [searchParams] = useSearchParams();
  const preselectedUserId = searchParams.get('userId');
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const queryClient = useQueryClient();

  const { data: acceptedMatches = [] } = useAcceptedInterests();

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

  const contactList = useMemo(() => {
    const map = new Map<string, { userId: string; name: string; subtitle: string; photo?: string }>();

    (acceptedMatches as Array<{ partnerUserId?: string; partnerProfile?: { firstName?: string; lastName?: string; photos?: string[]; wizardProfile?: { profilePhoto?: string } } }>).forEach((m) => {
      if (!m.partnerUserId) return;
      const p = m.partnerProfile;
      const name = p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : 'Match';
      map.set(m.partnerUserId, {
        userId: m.partnerUserId,
        name: name || 'Mutual match',
        subtitle: 'Mutual match — say hello!',
        photo: getPhotoUrl(p?.photos?.[0] || p?.wizardProfile?.profilePhoto || ''),
      });
    });

    (conversations || []).forEach((conv: {
      participants?: string[];
      participant1?: string;
      participant2?: string;
      lastMessage?: string;
      _id?: string;
      id?: string;
    }) => {
      const otherId = getOtherParticipant(conv, currentUserId);
      if (!otherId) return;
      const existing = map.get(otherId);
      map.set(otherId, {
        userId: otherId,
        name: existing?.name || 'Conversation',
        subtitle: conv.lastMessage || existing?.subtitle || 'Start chatting',
        photo: existing?.photo,
      });
    });

    return Array.from(map.values());
  }, [acceptedMatches, conversations, currentUserId]);

  const { data: messagesData } = useQuery({
    queryKey: ['messages', selectedConversation],
    enabled: !!selectedConversation,
    queryFn: async () => {
      const { data } = await api.get(`/chat/messages?userId=${selectedConversation}`);
      return data;
    },
  });

  const selectedContact = contactList.find((c) => c.userId === selectedConversation);

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
            {contactList.length > 0 ? (
              contactList.map((contact) => (
                <button
                  key={contact.userId}
                  type="button"
                  onClick={() => setSelectedConversation(contact.userId)}
                  className={`w-full text-left p-4 hover:bg-gray-50 border-b border-gray-50 flex items-center gap-3 ${
                    selectedConversation === contact.userId ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary-100 flex items-center justify-center text-lg">
                    {contact.photo ? (
                      <img src={contact.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      '💬'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{contact.subtitle}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                <p>No matches to chat with yet.</p>
                <Link to="/app/matches?tab=interests" className="mt-2 inline-block text-primary-600 hover:underline">
                  View accepted matches
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{selectedContact?.name || 'Chat'}</h3>
                {selectedContact && (
                  <Link
                    to={`/app/matches?tab=interests&interest=accepted`}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    View match
                  </Link>
                )}
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messagesData?.messages?.length > 0 ? (
                  [...messagesData.messages].reverse().map((message: { id?: string; _id?: string; senderId: string; content: string }) => {
                    const isMine = message.senderId === currentUserId;
                    return (
                      <div
                        key={message.id || message._id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                            isMine ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
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
                    type="button"
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
              <p>Select a match to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
