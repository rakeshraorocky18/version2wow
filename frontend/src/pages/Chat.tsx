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
  X,
  Ban,
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
import ChatOverflowMenu from '../components/chat/ChatOverflowMenu';

type ChatMessage = {
  id?: string;
  _id?: string;
  senderId: string;
  content: string;
  type?: string;
  mediaUrl?: string;
  createdAt?: string;
};

type CallLogPayload = {
  callType: CallType;
  status: 'missed' | 'ended';
};

function MessageBubble({
  message,
  isMine,
  onDeleteForMe,
  onDeleteForEveryone,
  deleting,
}: {
  message: ChatMessage;
  isMine: boolean;
  onDeleteForMe: () => void;
  onDeleteForEveryone?: () => void;
  deleting: boolean;
}) {
  const mediaSrc = message.mediaUrl ? getPhotoUrl(message.mediaUrl) : '';
  const isCallLog = message.type === 'audio_call' || message.type === 'video_call';
  const messageTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[75%] px-3 py-2 rounded-lg text-sm ${
          isCallLog
            ? 'border border-gray-200 bg-gray-50 text-gray-700'
            : isMine
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div
          className={`absolute -top-2 ${isMine ? '-left-2' : '-right-2'} flex gap-0.5 opacity-0 transition group-hover:opacity-100`}
        >
          <button
            type="button"
            onClick={onDeleteForMe}
            disabled={deleting}
            className="rounded-full border border-gray-200 bg-white p-1 text-gray-500 shadow-sm hover:text-red-600 disabled:opacity-60"
            title="Delete for me"
          >
            <Trash2 size={12} />
          </button>
          {isMine && onDeleteForEveryone && (
            <button
              type="button"
              onClick={onDeleteForEveryone}
              disabled={deleting}
              className="rounded-full border border-gray-200 bg-white p-1 text-gray-500 shadow-sm hover:text-red-700 disabled:opacity-60"
              title="Delete for everyone"
            >
              <Ban size={12} />
            </button>
          )}
        </div>
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
        {messageTime && (
          <p
            className={`mt-1 text-[10px] ${
              isCallLog ? 'text-gray-500' : isMine ? 'text-primary-100' : 'text-gray-500'
            }`}
          >
            {messageTime}
          </p>
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
  isBlocked?: boolean;
  muted?: boolean;
};

function buildContactsFromAccepted(
  acceptedMatches: Array<{
    partnerUserId?: string | null;
    partnerProfile?: {
      id?: string;
      userId?: string;
      firstName?: string;
      lastName?: string;
      profilePhoto?: string;
      photos?: string[];
      wizardProfile?: { profilePhoto?: string; personalDetails?: { firstName?: string; lastName?: string } };
    } | null;
  }>,
): ChatContact[] {
  return acceptedMatches.flatMap((m) => {
    const userId = m.partnerUserId ?? undefined;
    if (!userId) return [];

    const p = m.partnerProfile;
    const pd = p?.wizardProfile?.personalDetails;
    const name = p
      ? `${pd?.firstName || p.firstName || ''} ${pd?.lastName || p.lastName || ''}`.trim()
      : '';

    return [
      {
        userId,
        name: name || 'Mutual match',
        subtitle: 'Mutual match — say hello!',
        photo: p?.profilePhoto || p?.wizardProfile?.profilePhoto || p?.photos?.[0],
      },
    ];
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
  const [inChatSearch, setInChatSearch] = useState('');
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [sharedPanel, setSharedPanel] = useState<'media' | 'links' | 'docs' | null>(null);
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
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
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
      map.set(
        c.userId,
        existing
          ? {
              ...existing,
              subtitle: c.subtitle || existing.subtitle,
              lastMessageAt: c.lastMessageAt || existing.lastMessageAt,
              isBlocked: c.isBlocked ?? existing.isBlocked,
              muted: c.muted ?? existing.muted,
              photo: c.photo || existing.photo,
            }
          : c,
      );
    });

    return Array.from(map.values()).map((c) => ({
      userId: c.userId,
      name: c.name,
      subtitle: c.subtitle,
      photo: c.photo ? getPhotoUrl(c.photo) : undefined,
      lastMessageAt: c.lastMessageAt,
      isBlocked: !!c.isBlocked,
      muted: !!c.muted,
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
      return data as {
        messages: ChatMessage[];
        cleared?: boolean;
        isBlocked?: boolean;
        muted?: boolean;
        disappearingSeconds?: number;
      };
    },
  });

  const displayMessages = useMemo(() => {
    const msgs = messagesData?.messages ?? [];
    if (!showInChatSearch || !inChatSearch.trim()) return msgs;
    const q = inChatSearch.toLowerCase();
    return msgs.filter((m) => (m.content || '').toLowerCase().includes(q));
  }, [messagesData?.messages, showInChatSearch, inChatSearch]);

  const isBlockedThread = !!(
    messagesData?.isBlocked ||
    contactList.find((c) => c.userId === activePartnerId)?.isBlocked
  );
  const threadMuted = !!(
    messagesData?.muted ||
    contactList.find((c) => c.userId === activePartnerId)?.muted
  );
  const disappearingSeconds = messagesData?.disappearingSeconds ?? 0;

  const { data: sharedItems = [] } = useQuery({
    queryKey: ['chat-shared', activePartnerId, sharedPanel],
    enabled: !!activePartnerId && !!sharedPanel,
    queryFn: async () => {
      const { data } = await api.get(`/chat/shared?userId=${activePartnerId}&kind=${sharedPanel}`);
      return (data?.items || []) as ChatMessage[];
    },
  });

  useEffect(() => {
    if (!activePartnerId || !messagesData) return;
    let cancelled = false;
    (async () => {
      try {
        await api.post('/chat/read', { userId: activePartnerId });
        if (cancelled) return;
        // Optimistically clear then confirm from server
        queryClient.setQueryData(['chat-unread'], (prev: number | undefined) =>
          typeof prev === 'number' && prev > 0 ? Math.max(0, prev - 1) : 0,
        );
        await queryClient.refetchQueries({ queryKey: ['chat-unread'] });
      } catch {
        // ignore — getMessages also marks read on the server
        queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activePartnerId, messagesData, queryClient]);

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

  const sendCallLogMessage = (payload: CallLogPayload) => {
    const contentPrefix = payload.callType === 'video' ? 'Video call' : 'Audio call';
    const content =
      payload.status === 'missed'
        ? `Missed ${payload.callType} call`
        : `${contentPrefix} ended`;

    sendMessageMutation.mutate({
      content,
      type: payload.callType === 'video' ? 'video_call' : 'audio_call',
    });
  };

  const deleteChatMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      await api.delete(`/chat/conversations/${partnerId}`);
    },
    onSuccess: (_, partnerId) => {
      toast.success('Chat cleared');
      setShowMenu(false);
      queryClient.setQueryData(['messages', partnerId], (prev: Record<string, unknown> | undefined) => ({
        ...(prev || {}),
        messages: [],
        total: 0,
        cleared: true,
      }));
      queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['messages', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
    },
    onError: () => toast.error('Could not clear chat'),
  });

  const hideChatMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      await api.post(`/chat/conversations/${partnerId}/hide`);
    },
    onSuccess: (_, partnerId) => {
      toast.success('Chat deleted');
      setShowMenu(false);
      setSelectedConversation(null);
      queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
      queryClient.removeQueries({ queryKey: ['messages', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
    },
    onError: () => toast.error('Could not delete chat'),
  });

  const blockUserMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      await api.post('/matches/block', { userId: partnerId });
    },
    onSuccess: (_, partnerId) => {
      toast.success('User blocked');
      setShowMenu(false);
      queryClient.setQueryData(['messages', partnerId], (prev: Record<string, unknown> | undefined) => ({
        ...(prev || { messages: [] }),
        isBlocked: true,
      }));
      queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['messages', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['matches-accepted'] });
      queryClient.invalidateQueries({ queryKey: ['matches-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['matches-search'] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
    },
    onError: () => toast.error('Could not block user'),
  });

  const unblockUserMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      await api.post('/matches/unblock', { userId: partnerId });
    },
    onSuccess: (_, partnerId) => {
      toast.success('User unblocked');
      setShowMenu(false);
      queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['messages', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['matches-accepted'] });
    },
    onError: () => toast.error('Could not unblock user'),
  });

  const threadSettingsMutation = useMutation({
    mutationFn: async (payload: { muted?: boolean; disappearingSeconds?: number }) => {
      if (!activePartnerId) return;
      await api.put(`/chat/thread-settings/${activePartnerId}`, payload);
    },
    onSuccess: () => {
      setShowMenu(false);
      queryClient.invalidateQueries({ queryKey: ['messages', activePartnerId] });
      queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
    },
    onError: () => toast.error('Could not update chat settings'),
  });

  const reportUserMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const reason = window.prompt('Why are you reporting this user?') || 'No reason provided';
      await api.post('/chat/report', { userId: partnerId, reason });
    },
    onSuccess: () => {
      toast.success('Report submitted');
      setShowMenu(false);
    },
    onError: () => toast.error('Could not submit report'),
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async ({ messageId, mode }: { messageId: string; mode: 'me' | 'everyone' }) => {
      await api.delete(`/chat/messages/${messageId}?mode=${mode}`);
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
    if (!messageInput.trim() || !activePartnerId || isBlockedThread) return;
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
        `Clear chat with ${label}? Previous messages will be removed for you.`,
      )
    ) {
      deleteChatMutation.mutate(partnerId);
    }
  };

  const handleDeleteChat = () => {
    if (!activePartnerId) return;
    const label = selectedContact?.name || 'this contact';
    if (
      window.confirm(
        `Delete chat with ${label}? It will be removed from your chat list.`,
      )
    ) {
      hideChatMutation.mutate(activePartnerId);
    }
  };

  const handleBlockUser = () => {
    if (!activePartnerId) return;
    const label = selectedContact?.name || 'this user';
    if (
      window.confirm(
        `Block ${label}? They will stay in chat but cannot message you. You can unblock later.`,
      )
    ) {
      blockUserMutation.mutate(activePartnerId);
    }
  };

  const handleUnblockUser = () => {
    if (!activePartnerId) return;
    unblockUserMutation.mutate(activePartnerId);
  };

  const handleDeleteSingleMessage = (message: ChatMessage, mode: 'me' | 'everyone') => {
    const id = message.id || message._id;
    if (!id) {
      toast.error('Message id is missing');
      return;
    }
    const label = mode === 'everyone' ? 'Delete this message for everyone?' : 'Delete this message for you?';
    if (window.confirm(label)) {
      deleteMessageMutation.mutate({ messageId: id, mode });
    }
  };

  const handleDeleteAllForMe = () => {
    if (!activePartnerId) return;
    if (!window.confirm('Delete all visible messages for you only?')) return;
    const mine = displayMessages;
    Promise.all(
      mine.map((m) => {
        const id = m.id || m._id;
        if (!id) return Promise.resolve();
        return api.delete(`/chat/messages/${id}?mode=me`);
      }),
    )
      .then(() => {
        toast.success('Messages deleted for you');
        setShowMenu(false);
        queryClient.invalidateQueries({ queryKey: ['messages', activePartnerId] });
      })
      .catch(() => toast.error('Could not delete messages'));
  };

  const handleDeleteAllForEveryone = () => {
    if (!activePartnerId) return;
    if (!window.confirm('Delete your messages in this chat for everyone?')) return;
    const mine = displayMessages.filter((m) => m.senderId === currentUserId);
    Promise.all(
      mine.map((m) => {
        const id = m.id || m._id;
        if (!id) return Promise.resolve();
        return api.delete(`/chat/messages/${id}?mode=everyone`);
      }),
    )
      .then(() => {
        toast.success('Your messages deleted for everyone');
        setShowMenu(false);
        queryClient.invalidateQueries({ queryKey: ['messages', activePartnerId] });
        queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
      })
      .catch(() => toast.error('Could not delete messages'));
  };

  const handleDisappearing = () => {
    const next = disappearingSeconds > 0 ? 0 : 86400;
    threadSettingsMutation.mutate(
      { disappearingSeconds: next },
      {
        onSuccess: () =>
          toast.success(next > 0 ? 'Disappearing messages enabled (24h)' : 'Disappearing messages off'),
      },
    );
  };

  useEffect(() => {
    if (!activePartnerId) return;
    const contact = contactList.find((c) => c.userId === activePartnerId);
    markSeen(activePartnerId, contact?.lastMessageAt);
  }, [activePartnerId, displayMessages.length, contactList]);

  return (
    <div
      className={
        selectedConversation
          ? 'flex min-h-[28rem] flex-col'
          : 'h-auto'
      }
      style={
        selectedConversation
          ? { height: 'calc(100vh - 17rem)', maxHeight: 'calc(100vh - 17rem)' }
          : undefined
      }
    >
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

      <div
        className={`card flex min-h-0 overflow-hidden p-0 ${
          selectedConversation ? 'min-h-0 flex-1' : 'mx-auto mt-2 w-full max-w-2xl'
        }`}
      >
        <div
          className={`flex flex-col ${
            selectedConversation
              ? 'w-1/3 border-r border-gray-200'
              : 'w-full max-h-[24rem] min-h-[18rem]'
          }`}
        >
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
                        {contact.isBlocked && (
                          <span className="rounded bg-red-100 px-1 py-0.5 text-[9px] font-semibold uppercase text-red-700">
                            Blocked
                          </span>
                        )}
                        {(contact.lastMessageAt &&
                          !contact.isBlocked &&
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

        {selectedConversation && (
          <div className="flex-1 flex flex-col min-h-0">
            <>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {selectedContact?.name || 'Chat'}
                    {isBlockedThread && (
                      <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                        Blocked
                      </span>
                    )}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  {!isBlockedThread && (
                    <>
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
                    </>
                  )}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMenu(!showMenu)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {showMenu && (
                      <ChatOverflowMenu
                        isBlocked={isBlockedThread}
                        muted={threadMuted}
                        disappearingSeconds={disappearingSeconds}
                        busy={
                          blockUserMutation.isPending ||
                          unblockUserMutation.isPending ||
                          hideChatMutation.isPending ||
                          deleteChatMutation.isPending ||
                          threadSettingsMutation.isPending ||
                          reportUserMutation.isPending
                        }
                        onSearch={() => {
                          setShowMenu(false);
                          setShowInChatSearch(true);
                          setSharedPanel(null);
                        }}
                        onMedia={() => {
                          setShowMenu(false);
                          setSharedPanel('media');
                          setShowInChatSearch(false);
                        }}
                        onLinks={() => {
                          setShowMenu(false);
                          setSharedPanel('links');
                          setShowInChatSearch(false);
                        }}
                        onDocs={() => {
                          setShowMenu(false);
                          setSharedPanel('docs');
                          setShowInChatSearch(false);
                        }}
                        onToggleMute={() => {
                          threadSettingsMutation.mutate(
                            { muted: !threadMuted },
                            {
                              onSuccess: () =>
                                toast.success(threadMuted ? 'Notifications unmuted' : 'Notifications muted'),
                            },
                          );
                        }}
                        onDisappearing={handleDisappearing}
                        onDeleteForEveryone={handleDeleteAllForEveryone}
                        onDeleteForMe={handleDeleteAllForMe}
                        onReport={() => activePartnerId && reportUserMutation.mutate(activePartnerId)}
                        onBlock={handleBlockUser}
                        onClearChat={() =>
                          activePartnerId && handleClearHistory(activePartnerId, selectedContact?.name)
                        }
                        onUnblock={handleUnblockUser}
                        onDeleteChat={handleDeleteChat}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConversation(null);
                      setShowMenu(false);
                      setShowInChatSearch(false);
                      setSharedPanel(null);
                    }}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                    title="Close chat"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {isBlockedThread && (
                <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-800">
                  You blocked this user. They cannot message you. Use the menu to unblock or delete this chat.
                </div>
              )}

              {showInChatSearch && (
                <div className="border-b border-gray-100 px-4 py-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={inChatSearch}
                      onChange={(e) => setInChatSearch(e.target.value)}
                      placeholder="Search in chat..."
                      className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-8 text-sm outline-none focus:border-primary-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowInChatSearch(false);
                        setInChatSearch('');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              {sharedPanel && (
                <div className="border-b border-gray-100 max-h-40 overflow-y-auto bg-gray-50 px-4 py-2">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Shared {sharedPanel}
                    </p>
                    <button type="button" onClick={() => setSharedPanel(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  </div>
                  {sharedItems.length === 0 ? (
                    <p className="text-xs text-gray-400">Nothing shared yet.</p>
                  ) : (
                    <ul className="space-y-1">
                      {sharedItems.map((item) => {
                        const src = item.mediaUrl ? getPhotoUrl(item.mediaUrl) : '';
                        return (
                          <li key={item.id || item._id} className="truncate text-xs text-gray-700">
                            {sharedPanel === 'media' && src ? (
                              <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                {item.type === 'video' ? '🎬 Video' : '📷 Photo'}
                              </a>
                            ) : sharedPanel === 'docs' && src ? (
                              <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                📎 {item.content || 'Document'}
                              </a>
                            ) : (
                              item.content
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {upcomingMeetings.length > 0 && !isBlockedThread && (
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
                      deleting={deleteMessageMutation.isPending}
                      onDeleteForMe={() => handleDeleteSingleMessage(message, 'me')}
                      onDeleteForEveryone={
                        message.senderId === currentUserId
                          ? () => handleDeleteSingleMessage(message, 'everyone')
                          : undefined
                      }
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
                )}
              </div>

              <div className="p-4 border-t border-gray-200">
                {isBlockedThread ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleUnblockUser}
                      disabled={unblockUserMutation.isPending}
                      className="btn-primary flex-1 py-2 text-sm disabled:opacity-60"
                    >
                      Unblock user
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteChat}
                      disabled={hideChatMutation.isPending}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Delete chat
                    </button>
                  </div>
                ) : (
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
                )}
              </div>
            </>
          </div>
        )}
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
          onCallLog={sendCallLogMessage}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
