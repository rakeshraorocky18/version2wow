import { useEffect, useMemo, useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Send,
  Search,
  Paperclip,
  Phone,
  Video,
  Calendar,
  MoreVertical,
  Trash2,
  Shield,
  Image as ImageIcon,
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { getPhotoUrl } from '../lib/profileUtils';
import { resolveCanonicalPartnerId } from '../lib/chatPartnerIds';
import { useAuthStore } from '../store/authStore';
import { useAcceptedInterests } from '../hooks/useMatchmaking';
import { useChatSocket, type IncomingCall, type CallType } from '../hooks/useChatSocket';
import CallModal from '../components/chat/CallModal';
import ScheduleMeetingModal from '../components/chat/ScheduleMeetingModal';
import ChatPrivacySettingsModal from '../components/chat/ChatPrivacySettingsModal';

type ChatMessage = {
  id?: string;
  _id?: string;
  senderId: string;
  content: string;
  type?: string;
  mediaUrl?: string;
  createdAt?: string;
};

function MessageBubble({
  message,
  isMine,
  canDelete,
  onDelete,
  deleting,
}: {
  message: ChatMessage;
  isMine: boolean;
  canDelete: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  const mediaSrc = message.mediaUrl ? getPhotoUrl(message.mediaUrl) : '';

  return (
    <div className={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[75%] px-3 py-2 rounded-lg text-sm ${
          isMine ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
        }`}
      >
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className={`absolute -top-2 ${isMine ? '-left-2' : '-right-2'} rounded-full border border-gray-200 bg-white p-1 text-gray-500 opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-red-600 disabled:opacity-60`}
            title="Delete this message"
          >
            <Trash2 size={12} />
          </button>
        )}
        {message.type === 'image' && mediaSrc ? (
          <a href={mediaSrc} target="_blank" rel="noopener noreferrer">
            <img src={mediaSrc} alt="Shared" className="max-h-48 rounded-md object-cover" />
          </a>
        ) : message.type === 'video' && mediaSrc ? (
          <video src={mediaSrc} controls className="max-h-48 rounded-md" />
        ) : message.type === 'file' && mediaSrc ? (
          <a
            href={mediaSrc}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline ${isMine ? 'text-white' : 'text-primary-600'}`}
          >
            📎 {message.content || 'Download file'}
          </a>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
}

type ChatContact = {
  userId: string;
  name: string;
  subtitle: string;
  photo?: string;
  lastMessageAt?: string;
};

function buildContactsFromAccepted(
  acceptedMatches: Array<{
    partnerUserId?: string;
    partnerProfile?: {
      firstName?: string;
      lastName?: string;
      profilePhoto?: string;
      photos?: string[];
      wizardProfile?: { profilePhoto?: string; personalDetails?: { firstName?: string; lastName?: string } };
    };
  }>,
): ChatContact[] {
  return acceptedMatches
    .filter((m) => m.partnerUserId)
    .map((m) => {
      const p = m.partnerProfile;
      const pd = p?.wizardProfile?.personalDetails;
      const name = p
        ? `${pd?.firstName || p.firstName || ''} ${pd?.lastName || p.lastName || ''}`.trim()
        : '';
      return {
        userId: m.partnerUserId!,
        name: name || 'Mutual match',
        subtitle: 'Mutual match — say hello!',
        photo: p?.profilePhoto || p?.wizardProfile?.profilePhoto || p?.photos?.[0],
      };
    });
}

export default function Chat() {
  const SEEN_STORAGE_KEY = 'wow_chat_seen';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedUserId = searchParams.get('userId');
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [activeCall, setActiveCall] = useState<{ callId: string; peerId: string; callType: CallType; isIncoming?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [seenMap, setSeenMap] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(SEEN_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });

  const { data: acceptedMatches = [], isLoading: matchesLoading } = useAcceptedInterests();

  const { data: serverContacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['chat-contacts', currentUserId],
    enabled: !!currentUserId,
    retry: false,
    queryFn: async () => {
      try {
        const { data } = await api.get('/chat/contacts');
        return Array.isArray(data) ? (data as ChatContact[]) : [];
      } catch {
        return [];
      }
    },
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ['chat-meetings'],
    retry: false,
    queryFn: async () => {
      try {
        const { data } = await api.get('/chat/meetings');
        return data;
      } catch {
        return [];
      }
    },
  });

  useEffect(() => {
    if (!preselectedUserId) return;
    const canonical = resolveCanonicalPartnerId(preselectedUserId, acceptedMatches);
    setSelectedConversation(canonical);
    if (canonical !== preselectedUserId) {
      navigate(`/app/chat?userId=${canonical}`, { replace: true });
    }
  }, [preselectedUserId, acceptedMatches, navigate]);

  const activePartnerId = useMemo(
    () =>
      selectedConversation
        ? resolveCanonicalPartnerId(selectedConversation, acceptedMatches)
        : null,
    [selectedConversation, acceptedMatches],
  );

  useEffect(() => {
    if (!selectedConversation || !activePartnerId) return;
    if (activePartnerId !== selectedConversation) {
      setSelectedConversation(activePartnerId);
    }
  }, [selectedConversation, activePartnerId]);

  useChatSocket({
    onNewMessage: () => {
      if (activePartnerId) {
        queryClient.invalidateQueries({ queryKey: ['messages', activePartnerId] });
      }
      queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
    },
    onIncomingCall: (call: IncomingCall) => {
      setActiveCall({
        callId: call.callId,
        peerId: call.callerId,
        callType: call.callType,
        isIncoming: true,
      });
    },
  });

  const contactList = useMemo(() => {
    const fromMatches = buildContactsFromAccepted(acceptedMatches);
    const map = new Map<string, ChatContact>();

    fromMatches.forEach((c) => {
      if (c.userId) map.set(c.userId, c);
    });

    serverContacts.forEach((c) => {
      if (!c.userId) return;
      const existing = map.get(c.userId);
      map.set(c.userId, existing ? { ...existing, subtitle: c.subtitle } : c);
    });

    return Array.from(map.values()).map((c) => ({
      userId: c.userId,
      name: c.name,
      subtitle: c.subtitle,
      photo: c.photo ? getPhotoUrl(c.photo) : undefined,
      lastMessageAt: c.lastMessageAt,
    }));
  }, [serverContacts, acceptedMatches]);

  const listLoading = matchesLoading || contactsLoading;

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contactList;
    const q = searchQuery.toLowerCase();
    return contactList.filter((c) => c.name.toLowerCase().includes(q));
  }, [contactList, searchQuery]);

  const resolvedSelectedContact = useMemo(() => {
    if (!activePartnerId) return null;
    const inList = contactList.find((c) => c.userId === activePartnerId);
    if (inList) return inList;

    const match = acceptedMatches.find(
      (m) =>
        m.partnerUserId === activePartnerId ||
        m.partnerProfile?.id === selectedConversation ||
        m.partnerProfile?.userId === activePartnerId,
    );
    if (match) {
      const built = buildContactsFromAccepted([match])[0];
      return {
        ...built,
        photo: built.photo ? getPhotoUrl(built.photo) : undefined,
      };
    }

    return {
      userId: activePartnerId,
      name: 'Chat',
      subtitle: '',
      photo: undefined,
    };
  }, [activePartnerId, selectedConversation, contactList, acceptedMatches]);

  const { data: messagesData } = useQuery({
    queryKey: ['messages', activePartnerId],
    enabled: !!activePartnerId,
    staleTime: 0,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data } = await api.get(`/chat/messages?userId=${activePartnerId}`);
      return data as { messages: ChatMessage[]; cleared?: boolean };
    },
  });

  const displayMessages = messagesData?.messages ?? [];

  const markSeen = (partnerId: string, seenAt?: string) => {
    const timestamp = seenAt || new Date().toISOString();
    setSeenMap((prev) => {
      const next = { ...prev, [partnerId]: timestamp };
      localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const selectedContact = resolvedSelectedContact;
  const upcomingMeetings = (meetings as Array<{ participantId: string; organizerId: string; title: string; scheduledAt: string; status: string }>)
    .filter((m) => m.status !== 'cancelled' && (m.participantId === activePartnerId || m.organizerId === activePartnerId));

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: { content: string; type?: string; mediaUrl?: string }) => {
      if (!activePartnerId) return;
      await api.post('/chat/messages', {
        receiverId: activePartnerId,
        content: payload.content,
        type: payload.type || 'text',
        mediaUrl: payload.mediaUrl,
      });
    },
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['messages', activePartnerId] });
      queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Unable to send message');
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      await api.delete(`/chat/conversations/${partnerId}`);
    },
    onSuccess: (_, partnerId) => {
      toast.success('Chat history cleared');
      setShowMenu(false);
      queryClient.setQueryData(['messages', partnerId], { messages: [], total: 0, cleared: true });
      queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['messages', partnerId] });
    },
    onError: () => toast.error('Could not clear chat history'),
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await api.delete(`/chat/messages/${messageId}`);
    },
    onSuccess: () => {
      toast.success('Message deleted');
      queryClient.invalidateQueries({ queryKey: ['messages', activePartnerId] });
      queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
    },
    onError: () => toast.error('Could not delete message'),
  });

  const uploadMediaMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/chat/media', formData);
      return data as { mediaUrl: string; type: string };
    },
    onSuccess: (data) => {
      sendMessageMutation.mutate({
        content: data.type === 'image' ? 'Photo' : data.type === 'video' ? 'Video' : fileInputRef.current?.files?.[0]?.name || 'File',
        type: data.type,
        mediaUrl: data.mediaUrl,
      });
    },
    onError: () => toast.error('Could not upload file'),
  });

  const handleSend = () => {
    if (!messageInput.trim() || !activePartnerId) return;
    sendMessageMutation.mutate({ content: messageInput });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMediaMutation.mutate(file);
    e.target.value = '';
  };

  const startCall = (callType: CallType) => {
    if (!activePartnerId) return;
    const callId = crypto.randomUUID();
    setActiveCall({ callId, peerId: activePartnerId, callType });
  };

  const handleClearHistory = (partnerId: string, contactName?: string) => {
    const label = contactName || 'this contact';
    if (
      window.confirm(
        `Clear chat history with ${label}? Previous messages will be removed for you.`,
      )
    ) {
      deleteChatMutation.mutate(partnerId);
    }
  };

  const handleDeleteChat = () => {
    if (!activePartnerId) return;
    handleClearHistory(activePartnerId, selectedContact?.name);
  };

  const handleDeleteSingleMessage = (message: ChatMessage) => {
    const id = message.id || message._id;
    if (!id) {
      toast.error('Message id is missing');
      return;
    }
    if (window.confirm('Delete this message?')) {
      deleteMessageMutation.mutate(id);
    }
  };

  useEffect(() => {
    if (!activePartnerId) return;
    const contact = contactList.find((c) => c.userId === activePartnerId);
    markSeen(activePartnerId, contact?.lastMessageAt);
  }, [activePartnerId, displayMessages.length, contactList]);

  return (
    <div className="h-[calc(100vh-12rem)]">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">Messages</h1>
        <button
          type="button"
          onClick={() => setShowPrivacy(true)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Shield size={16} /> Privacy
        </button>
      </div>

      <div className="card h-full flex overflow-hidden p-0">
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-400 outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <div
                  key={contact.userId}
                  className={`flex items-center border-b border-gray-50 ${
                    selectedConversation === contact.userId || activePartnerId === contact.userId
                      ? 'bg-primary-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConversation(contact.userId);
                      markSeen(contact.userId, contact.lastMessageAt);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary-100 flex items-center justify-center text-lg">
                      {contact.photo ? (
                        <img src={contact.photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        '💬'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                        {(contact.lastMessageAt &&
                          new Date(contact.lastMessageAt).getTime() >
                            new Date(seenMap[contact.userId] || 0).getTime() &&
                          activePartnerId !== contact.userId) && (
                          <span className="h-2 w-2 rounded-full bg-pink-500" title="New message" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{contact.subtitle}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClearHistory(contact.userId, contact.name)}
                    disabled={deleteChatMutation.isPending}
                    className="mr-3 shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Clear chat history"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
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
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startCall('audio')}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600"
                    title="Voice call"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => startCall('video')}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600"
                    title="Video call"
                  >
                    <Video size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSchedule(true)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600"
                    title="Schedule meeting"
                  >
                    <Calendar size={18} />
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMenu(!showMenu)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {showMenu && (
                      <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                        <Link
                          to="/app/matches?tab=interests&interest=accepted"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowMenu(false)}
                        >
                          View match
                        </Link>
                        <button
                          type="button"
                          onClick={handleDeleteChat}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Clear history
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {upcomingMeetings.length > 0 && (
                <div className="border-b border-gray-100 bg-blue-50 px-4 py-2 text-xs text-blue-800">
                  <Calendar size={12} className="mr-1 inline" />
                  Upcoming: {upcomingMeetings.map((m) => `${m.title} — ${new Date(m.scheduledAt).toLocaleString()}`).join(' · ')}
                </div>
              )}

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {displayMessages.length > 0 ? (
                  [...displayMessages].reverse().map((message: ChatMessage) => (
                    <MessageBubble
                      key={message.id || message._id}
                      message={message}
                      isMine={message.senderId === currentUserId}
                      canDelete={message.senderId === currentUserId}
                      deleting={deleteMessageMutation.isPending}
                      onDelete={() => handleDeleteSingleMessage(message)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
                )}
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMediaMutation.isPending}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-60"
                    title="Share media"
                  >
                    {uploadMediaMutation.isPending ? (
                      <ImageIcon size={18} className="animate-pulse" />
                    ) : (
                      <Paperclip size={18} />
                    )}
                  </button>
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

      {showPrivacy && <ChatPrivacySettingsModal onClose={() => setShowPrivacy(false)} />}
      {showSchedule && activePartnerId && selectedContact && (
        <ScheduleMeetingModal
          participantId={activePartnerId}
          participantName={selectedContact.name}
          onClose={() => setShowSchedule(false)}
        />
      )}
      {activeCall && (
        <CallModal
          callId={activeCall.callId}
          peerId={activeCall.peerId}
          callType={activeCall.callType}
          isIncoming={activeCall.isIncoming}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
