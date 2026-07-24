  import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
  import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
  import {
    Check,
    CheckCheck,
    Loader2,
    MoreVertical,
    Paperclip,
    Phone,
    Search,
    Send,
    Smile,
    X,
  } from 'lucide-react';
  import toast from 'react-hot-toast';
  import { useAgentAuthStore } from '../../store/agent/agentAuthStore';
  import api from '../../lib/api';
  import { getPhotoUrl } from '../../lib/profileUtils';
  import { useChatSocket, type IncomingCall, type CallType } from '../../hooks/useChatSocket';
  import ChatOverflowMenu from '../chat/ChatOverflowMenu';
  import CallModal from '../chat/CallModal';

  function normalizeUserId(id?: string | null): string {
    return id ? String(id).trim() : '';
  }

  type ChatContact = {
    userId: string;
    name: string;
    subtitle: string;
    photo?: string;
    lastMessageAt?: string;
    isBlocked?: boolean;
    muted?: boolean;
    onlineStatus?: boolean;
    unreadCount?: number;
  };

  type ChatMessage = {
    id?: string;
    _id?: string;
    senderId: string;
    receiverId?: string;
    content: string;
    type?: string;
    mediaUrl?: string;
    createdAt?: string;
    isRead?: boolean;
  };

  type ChatProps = {
    embedded?: boolean;
    initialUserId?: string | null;
    agentMode?: boolean;
    agentCustomerId?: string;
    agentContacts?: ChatContact[];
    agentMessages?: ChatMessage[];
    onAgentSendMessage?: (payload: { receiverId: string; content: string; type?: string; mediaUrl?: string }) => void;
    onSelectContact?: (userId: string) => void;
    agentLoading?: boolean;
  };

  type DeleteDialogState = {
    messageIds: string[];
    allowEveryone: boolean;
  };

  function MessageBubble({
    message,
    isMine,
    onDelete,
    deleting,
    searchQuery,
  }: {
    message: ChatMessage;
    isMine: boolean;
    onDelete: () => void;
    deleting: boolean;
    searchQuery: string;
  }) {
    const mediaSrc = message.mediaUrl ? getPhotoUrl(message.mediaUrl) : '';
    const time = message.createdAt
      ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    const isCallLog = message.type === 'audio_call' || message.type === 'video_call';
    const isFile = message.type === 'file' || message.type === 'document';

    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
        <button
          type="button"
          onClick={onDelete}
          className={`max-w-[82%] rounded-2xl px-3 py-2 text-left text-sm shadow-sm transition ${
            isCallLog
              ? 'border border-gray-200 bg-gray-50 text-gray-700'
              : isMine
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-900'
          } ${deleting ? 'opacity-70' : ''}`}
        >
          {message.type === 'image' && mediaSrc ? (
            <a href={mediaSrc} target="_blank" rel="noreferrer" className="block">
              <img src={mediaSrc} alt="Shared" className="max-h-48 rounded-lg object-cover" />
            </a>
          ) : message.type === 'video' && mediaSrc ? (
            <video src={mediaSrc} controls className="max-h-48 rounded-lg" />
          ) : isFile && mediaSrc ? (
            <a href={mediaSrc} target="_blank" rel="noreferrer" className={`break-all underline ${isMine ? 'text-white' : 'text-primary-600'}`}>
              📎 {message.content || 'Download attachment'}
            </a>
          ) : (
            <p className="whitespace-pre-wrap break-words">
              <HighlightedText text={message.content} query={searchQuery} />
            </p>
          )}
          {time && (
            <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMine ? 'text-primary-100' : 'text-gray-500'}`}>
              <span>{time}</span>
              {isMine && (message.isRead ? <CheckCheck size={12} /> : <Check size={12} />)}
            </div>
          )}
        </button>
      </div>
    );
  }

  function HighlightedText({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <>{text}</>;

    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'));
    return (
      <>
        {parts.map((part, index) => {
          const isMatch = part.toLowerCase() === query.toLowerCase();
          return (
            <span key={`${part}-${index}`} className={isMatch ? 'rounded bg-yellow-200 px-0.5 text-gray-900' : undefined}>
              {part}
            </span>
          );
        })}
      </>
    );
  }

  export default function Chat({
    embedded = false,
    initialUserId,
    agentMode = false,
    agentCustomerId,
    agentContacts = [],
    agentMessages = [],
    onAgentSendMessage,
    onSelectContact,
    agentLoading = false,
  }: ChatProps) {
    const queryClient = useQueryClient();
    const user = useAgentAuthStore((state) => state.user);
    const currentUserId = agentMode ? (agentCustomerId || user?.id) : user?.id;
    const normalizedCurrentUserId = useMemo(() => normalizeUserId(currentUserId), [currentUserId]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showInChatSearch, setShowInChatSearch] = useState(false);
    const [inChatSearch, setInChatSearch] = useState('');
    const [sharedPanel, setSharedPanel] = useState<'media' | 'docs' | 'links' | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
    const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null);
    const [activeCall, setActiveCall] = useState<{ callId: string; peerId: string; callType: CallType; isIncoming?: boolean } | null>(null);
    const [typingIndicator, setTypingIndicator] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const emojiOptions = ['😊', '😂', '😍', '👍', '❤️', '🎉', '🙏', '🔥'];

    const { data: contacts = [], isLoading: contactsLoading } = useQuery({
      queryKey: ['agent-portal-chat-contacts'],
      retry: false,
      enabled: !agentMode,
      queryFn: async () => {
        try {
          const { data } = await api.get('/chat/contacts');
          return Array.isArray(data) ? (data as ChatContact[]) : [];
        } catch {
          return [] as ChatContact[];
        }
      },
    });

    const contactList = useMemo(() => {
      if (agentMode) return agentContacts;
      const merged = [...agentContacts, ...contacts];
      const map = new Map<string, ChatContact>();
      merged.forEach((contact) => {
        if (!contact.userId) return;
        const existing = map.get(contact.userId);
        map.set(contact.userId, {
          ...(existing || {}),
          ...contact,
          name: contact.name || existing?.name || 'Customer',
          subtitle: contact.subtitle || existing?.subtitle || 'Start a conversation',
          photo: contact.photo || existing?.photo,
          lastMessageAt: contact.lastMessageAt || existing?.lastMessageAt,
          isBlocked: contact.isBlocked ?? existing?.isBlocked,
          muted: contact.muted ?? existing?.muted,
          onlineStatus: contact.onlineStatus ?? existing?.onlineStatus,
          unreadCount: contact.unreadCount ?? existing?.unreadCount,
        });
      });
      return Array.from(map.values()).filter((contact) => contact.userId);
    }, [agentContacts, contacts]);

    const filteredContacts = useMemo(() => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return contactList;
      return contactList.filter((contact) => contact.name.toLowerCase().includes(query));
    }, [contactList, searchQuery]);

    useEffect(() => {
      if (!selectedConversation && contactList.length > 0) {
        const firstId = contactList[0].userId;
        setSelectedConversation(firstId);
        onSelectContact?.(firstId);
      }
    }, [contactList, onSelectContact, selectedConversation]);

    useEffect(() => {
      if (!initialUserId) return;
      setSelectedConversation(initialUserId);
      onSelectContact?.(initialUserId);
    }, [initialUserId, onSelectContact]);

    const activePartnerId = selectedConversation;

    const { data: messagesData } = useQuery({
      queryKey: ['agent-portal-chat-messages', activePartnerId],
      enabled: !!activePartnerId,
      staleTime: 0,
      queryFn: async () => {
        if (!activePartnerId) return { messages: [] as ChatMessage[], isBlocked: false, muted: false, disappearingSeconds: 0 };
        if (agentMode) {
          return { messages: agentMessages, isBlocked: false, muted: false, disappearingSeconds: 0 };
        }
        try {
          const { data } = await api.get(`/chat/messages?userId=${activePartnerId}`);
          return data as { messages: ChatMessage[]; isBlocked?: boolean; muted?: boolean; disappearingSeconds?: number };
        } catch {
          return { messages: [] as ChatMessage[], isBlocked: false, muted: false, disappearingSeconds: 0 };
        }
      },
    });

    const displayMessages = useMemo(() => {
      const list = (messagesData?.messages ?? agentMessages) as ChatMessage[];
      if (!showInChatSearch || !inChatSearch.trim()) return list;
      const query = inChatSearch.toLowerCase();
      return list.filter((message) => (message.content || '').toLowerCase().includes(query));
    }, [agentMessages, inChatSearch, messagesData?.messages, showInChatSearch]);

    const { data: sharedItems = [] } = useQuery({
      queryKey: ['agent-portal-chat-shared', activePartnerId, sharedPanel],
      enabled: !!activePartnerId && !!sharedPanel,
      queryFn: async () => {
        const { data } = await api.get(`/chat/shared?userId=${activePartnerId}&kind=${sharedPanel}`);
        return (data?.items || []) as ChatMessage[];
      },
    });

    useEffect(() => {
      if (!activePartnerId) return;
      const timer = window.setTimeout(() => {
        void api.post('/chat/read', { userId: activePartnerId }).catch(() => undefined);
      }, 300);
      return () => window.clearTimeout(timer);
    }, [activePartnerId, displayMessages.length]);

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [displayMessages.length, showInChatSearch]);

    useChatSocket({
      onNewMessage: (data) => {
        const message = data as ChatMessage;
        const senderId = normalizeUserId(message.senderId);
        const receiverId = normalizeUserId(message.receiverId);
        const partnerId = senderId === normalizeUserId(currentUserId) ? receiverId : senderId;

        if (activePartnerId && partnerId === activePartnerId) {
          queryClient.setQueryData(['agent-portal-chat-messages', activePartnerId], (old: any) => {
            if (!old) return old;
            const existing = (old.messages || []).some(
              (msg: ChatMessage) => (msg.id || msg._id) === (message.id || message._id),
            );
            const nextMessages = existing
              ? (old.messages || []).map((msg: ChatMessage) =>
                  (msg.id || msg._id) === (message.id || message._id) ? message : msg,
                )
              : [...(old.messages || []), message];
            return {
              ...old,
              messages: [...nextMessages].sort((a: ChatMessage, b: ChatMessage) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return aTime - bTime;
              }),
              total: existing ? old.total : (old.total || 0) + 1,
            };
          });
        }

        queryClient.invalidateQueries({ queryKey: ['agent-portal-chat-contacts'] });
      },
      onMessageDeleted: (data) => {
        const partnerId = normalizeUserId(data.senderId) === normalizeUserId(currentUserId)
          ? normalizeUserId(data.receiverId)
          : normalizeUserId(data.senderId);

        if (activePartnerId && partnerId === activePartnerId) {
          queryClient.setQueryData(['agent-portal-chat-messages', activePartnerId], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              messages: (old.messages || []).filter(
                (message: ChatMessage) => (message.id || message._id) !== data.messageId,
              ),
              total: Math.max(0, (old.total || 0) - 1),
            };
          });
        }

        queryClient.invalidateQueries({ queryKey: ['agent-portal-chat-contacts'] });
      },
      onUserTyping: (data) => {
        if (data.userId === activePartnerId) {
          setTypingIndicator(true);
          const timer = window.setTimeout(() => setTypingIndicator(false), 3000);
          return () => window.clearTimeout(timer);
        }
      },
      onIncomingCall: (call: IncomingCall) => {
        setActiveCall({ callId: call.callId, peerId: call.callerId, callType: call.callType, isIncoming: true });
      },
    });

    const selectedContact = useMemo(
      () => contactList.find((contact) => contact.userId === activePartnerId) || null,
      [activePartnerId, contactList],
    );

    const isBlockedThread = !!(messagesData?.isBlocked || selectedContact?.isBlocked);
    const threadMuted = !!(messagesData?.muted || selectedContact?.muted);
    const disappearingSeconds = messagesData?.disappearingSeconds ?? 0;

    const sendMessageMutation = useMutation({
      mutationFn: async ({ content, type, mediaUrl }: { content: string; type?: string; mediaUrl?: string }) => {
        if (!activePartnerId) return;
        if (agentMode && onAgentSendMessage) {
          onAgentSendMessage({ receiverId: activePartnerId, content, type, mediaUrl });
          return;
        }
        await api.post('/chat/messages', {
          receiverId: activePartnerId,
          content,
          type: type || 'text',
          mediaUrl,
        });
      },
      onSuccess: () => {
        setMessageInput('');
        setShowEmojiPicker(false);
        queryClient.invalidateQueries({ queryKey: ['agent-portal-chat-messages', activePartnerId] });
        queryClient.invalidateQueries({ queryKey: ['agent-portal-chat-contacts'] });
      },
      onError: () => toast.error('Unable to send message'),
    });

    const deleteMessageMutation = useMutation({
      mutationFn: async ({ messageIds, mode }: { messageIds: string[]; mode: 'me' | 'everyone' }) => {
        if (messageIds.length === 0) return;
        await Promise.all(messageIds.map((id) => api.delete(`/chat/messages/${id}?mode=${mode}`)));
      },
      onSuccess: () => {
        setDeleteDialog(null);
        setSelectedMessageIds([]);
        setSelectionMode(false);
        queryClient.invalidateQueries({ queryKey: ['agent-portal-chat-messages', activePartnerId] });
        queryClient.invalidateQueries({ queryKey: ['agent-portal-chat-contacts'] });
      },
      onError: () => toast.error('Could not delete message(s)'),
    });

    const uploadMediaMutation = useMutation({
      mutationFn: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/chat/media', formData, {
          onUploadProgress: (event) => {
            if (event.total) setUploadProgress(Math.round((event.loaded / event.total) * 100));
          },
        });
        return data as { mediaUrl: string; type: string };
      },
      onSuccess: (data) => {
        const fileName = fileInputRef.current?.files?.[0]?.name || 'Attachment';
        sendMessageMutation.mutate({
          content: data.type === 'image' ? 'Photo' : data.type === 'video' ? 'Video' : fileName,
          type: data.type,
          mediaUrl: data.mediaUrl,
        });
        setUploading(false);
        setUploadProgress(0);
      },
      onError: () => {
        setUploading(false);
        setUploadProgress(0);
        toast.error('Attachment upload failed');
      },
    });

    const threadSettingsMutation = useMutation({
      mutationFn: async (payload: { muted?: boolean; disappearingSeconds?: number }) => {
        if (!activePartnerId) return;
        await api.put(`/chat/thread-settings/${activePartnerId}`, payload);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['agent-portal-chat-contacts'] });
        queryClient.invalidateQueries({ queryKey: ['agent-portal-chat-messages', activePartnerId] });
      },
      onError: () => toast.error('Could not update chat settings'),
    });

    const reportUserMutation = useMutation({
      mutationFn: async (partnerId: string) => {
        const reason = window.prompt('Why are you reporting this user?') || 'No reason provided';
        await api.post('/chat/report', { userId: partnerId, reason });
      },
      onSuccess: () => toast.success('Report submitted'),
      onError: () => toast.error('Could not submit report'),
    });

    const handleSend = () => {
      if (!messageInput.trim() || !activePartnerId || isBlockedThread) return;
      sendMessageMutation.mutate({ content: messageInput });
    };

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploading(true);
      uploadMediaMutation.mutate(file);
      event.target.value = '';
    };

    const toggleSelection = (messageId?: string) => {
      if (!messageId) return;
      setSelectedMessageIds((current) => {
        const next = current.includes(messageId) ? current.filter((id) => id !== messageId) : [...current, messageId];
        return next;
      });
    };

    const openDeleteDialog = (message: ChatMessage) => {
      const id = message.id || message._id;
      if (!id) return;
      setDeleteDialog({
        messageIds: [id],
        allowEveryone: normalizeUserId(message.senderId) === normalizedCurrentUserId,
      });
    };

    const confirmDelete = (mode: 'me' | 'everyone') => {
      if (!deleteDialog) return;
      deleteMessageMutation.mutate({ messageIds: deleteDialog.messageIds, mode });
    };

    const confirmSelectedDelete = (mode: 'me' | 'everyone') => {
      if (!selectedMessageIds.length) return;
      deleteMessageMutation.mutate({ messageIds: selectedMessageIds, mode });
    };

    const startCall = (callType: CallType) => {
      if (!activePartnerId) return;
      const callId = crypto.randomUUID();
      setActiveCall({ callId, peerId: activePartnerId, callType });
    };

    const toggleThreadSetting = (muted: boolean) => {
      threadSettingsMutation.mutate({ muted });
    };

    const handleClearChat = () => {
      if (!activePartnerId) return;
      if (window.confirm(`Clear chat with ${selectedContact?.name || 'this customer'}?`)) {
        void api.delete(`/chat/conversations/${activePartnerId}`).then(() => {
          queryClient.invalidateQueries({ queryKey: ['agent-portal-chat-contacts'] });
          queryClient.invalidateQueries({ queryKey: ['agent-portal-chat-messages', activePartnerId] });
          toast.success('Chat cleared');
        }).catch(() => toast.error('Could not clear chat'));
      }
    };

    const handleDeleteChat = () => {
      if (!activePartnerId) return;
      if (window.confirm(`Delete chat with ${selectedContact?.name || 'this customer'}?`)) {
        void api.post(`/chat/conversations/${activePartnerId}/hide`).then(() => {
          setSelectedConversation(null);
          queryClient.invalidateQueries({ queryKey: ['agent-portal-chat-contacts'] });
          queryClient.removeQueries({ queryKey: ['agent-portal-chat-messages', activePartnerId] });
          toast.success('Chat deleted');
        }).catch(() => toast.error('Could not delete chat'));
      }
    };

    const handleBlockUser = () => {
      if (!activePartnerId) return;
      if (window.confirm(`Block ${selectedContact?.name || 'this customer'}?`)) {
        void api.post('/matches/block', { userId: activePartnerId }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['agent-portal-chat-contacts'] });
          toast.success('User blocked');
        }).catch(() => toast.error('Could not block user'));
      }
    };

    const handleUnblockUser = () => {
      if (!activePartnerId) return;
      void api.post('/matches/unblock', { userId: activePartnerId }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['agent-portal-chat-contacts'] });
        toast.success('User unblocked');
      }).catch(() => toast.error('Could not unblock user'));
    };

    const handleDisappearing = () => {
  const next = disappearingSeconds > 0 ? 0 : 86400;
  threadSettingsMutation.mutate({ disappearingSeconds: next });
};

// 👇 ADD THIS HERE
console.log("Current User ID =", currentUserId);

displayMessages.forEach((m) => {
  console.log(
    "sender =", m.senderId,
    "receiver =", m.receiverId,
    "isMine =", normalizeUserId(m.senderId) === normalizeUserId(currentUserId)
  );
});

    return (
      <div className={`flex min-h-[34rem] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm ${embedded ? 'h-full' : ''}`}>
        <div className="flex min-h-0 flex-1">
          <aside className="flex w-full max-w-[320px] flex-col border-r border-gray-200 bg-gray-50/70">
            <div className="border-b border-gray-100 p-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search contacts"
                  className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-400"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {agentLoading || contactsLoading ? (
                <div className="p-6 text-center text-sm text-gray-500">Loading contacts…</div>
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => {
                  const isActive = selectedConversation === contact.userId;
                  const hasUnread = (contact.unreadCount || 0) > 0;
                  const isNew = Boolean(contact.lastMessageAt && activePartnerId !== contact.userId && contact.lastMessageAt);
                  return (
                    <button
                      key={contact.userId}
                      type="button"
                      onClick={() => {
                        setSelectedConversation(contact.userId);
                        onSelectContact?.(contact.userId);
                        setShowMenu(false);
                        setSharedPanel(null);
                        setShowInChatSearch(false);
                      }}
                      className={`flex w-full items-center gap-3 border-b border-gray-100 p-3 text-left transition ${isActive ? 'bg-primary-50' : 'hover:bg-white'}`}
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-primary-100">
                        {contact.photo ? (
                          <img src={contact.photo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-base">💬</div>
                        )}
                        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${contact.onlineStatus ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">{contact.name}</p>
                          {hasUnread ? <span className="rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-semibold text-white">{contact.unreadCount}</span> : null}
                        </div>
                        <p className="truncate text-xs text-gray-500">{contact.subtitle}</p>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                          <span>{contact.lastMessageAt ? new Date(contact.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                          {contact.isBlocked ? <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-red-700">Blocked</span> : null}
                        </div>
                      </div>
                      {isNew ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-pink-500" /> : null}
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-sm text-gray-500">No contacts yet.</div>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 flex-1 flex-col">
            {activePartnerId && selectedContact ? (
              <>
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full bg-primary-100">
                      {selectedContact.photo ? <img src={selectedContact.photo} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center">💬</div>}
                      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${selectedContact.onlineStatus ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedContact.name}</p>
                      <p className="text-xs text-gray-500">{selectedContact.onlineStatus ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isBlockedThread && (
                      <button
                        type="button"
                        onClick={() => startCall('audio')}
                        className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600"
                        title="Voice call"
                      >
                        <Phone size={18} />
                      </button>
                    )}
                    <div className="relative">
                      <button type="button" onClick={() => setShowMenu((current) => !current)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
                        <MoreVertical size={18} />
                      </button>
                      {showMenu ? (
                        <ChatOverflowMenu
                          isBlocked={isBlockedThread}
                          muted={threadMuted}
                          disappearingSeconds={disappearingSeconds}
                          busy={threadSettingsMutation.isPending || reportUserMutation.isPending}
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
                          onToggleMute={() => toggleThreadSetting(!threadMuted)}
                          onDisappearing={handleDisappearing}
                          onDeleteForEveryone={() => {
                            setShowMenu(false);
                            if (selectedMessageIds.length) {
                              confirmSelectedDelete('everyone');
                            } else {
                              toast.error('Select at least one message');
                            }
                          }}
                          onDeleteForMe={() => {
                            setShowMenu(false);
                            if (selectedMessageIds.length) {
                              confirmSelectedDelete('me');
                            } else {
                              toast.error('Select at least one message');
                            }
                          }}
                          onReport={() => reportUserMutation.mutate(activePartnerId)}
                          onBlock={handleBlockUser}
                          onClearChat={handleClearChat}
                          onUnblock={handleUnblockUser}
                          onDeleteChat={handleDeleteChat}
                        />
                      ) : null}
                    </div>
                    <button type="button" onClick={() => { setSelectedConversation(null); setShowMenu(false); setShowInChatSearch(false); setSharedPanel(null); }} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" title="Close chat">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {showInChatSearch ? (
                  <div className="border-b border-gray-100 px-4 py-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={inChatSearch}
                        onChange={(event) => setInChatSearch(event.target.value)}
                        placeholder="Search in chat"
                        className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-400"
                      />
                      <button type="button" onClick={() => { setShowInChatSearch(false); setInChatSearch(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : null}

                {sharedPanel ? (
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Shared {sharedPanel}</p>
                      <button type="button" onClick={() => setSharedPanel(null)} className="text-gray-400 hover:text-gray-600">
                        <X size={14} />
                      </button>
                    </div>
                    {sharedItems.length === 0 ? <p className="text-sm text-gray-500">No shared {sharedPanel} yet.</p> : (
                      <ul className="space-y-2">
                        {sharedItems.map((item) => {
                          const src = item.mediaUrl ? getPhotoUrl(item.mediaUrl) : '';
                          return (
                            <li key={item.id || item._id} className="text-sm text-gray-700">
                              {sharedPanel === 'media' && src ? (
                                <a href={src} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">{item.type === 'video' ? '🎬 Video' : '📷 Image'}</a>
                              ) : sharedPanel === 'docs' && src ? (
                                <a href={src} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">📎 {item.content || 'Document'}</a>
                              ) : (
                                <span>{item.content}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : null}

                <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.7),_rgba(246,250,255,0.95))] p-4">
                  {displayMessages.length > 0 ? (
                    <div className="space-y-3">
                      {displayMessages.map((message) => {
                        const id = message.id || message._id || '';
                        const isSelected = selectedMessageIds.includes(id);
                        return (
                          <div key={id || `${message.createdAt}-${message.senderId}`}>
                            <div className={`rounded-2xl p-1 ${selectionMode && id ? 'bg-primary-50' : ''}`}>
                              <MessageBubble
                                message={message}
                                isMine={normalizeUserId(message.senderId) === normalizedCurrentUserId}
                                deleting={deleteMessageMutation.isPending}
                                searchQuery={inChatSearch}
                                onDelete={() => {
                                  if (selectionMode) {
                                    toggleSelection(id);
                                    return;
                                  }
                                  openDeleteDialog(message);
                                }}
                              />
                            </div>
                            {selectionMode && id ? (
                              <div className="mt-1 flex justify-end">
                                <button type="button" onClick={() => toggleSelection(id)} className={`rounded-full px-2 py-1 text-[11px] ${isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                  {isSelected ? 'Selected' : 'Select'}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                      {typingIndicator ? (
                        <div className="flex justify-start">
                          <div className="rounded-2xl bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">Typing…</div>
                        </div>
                      ) : null}
                      <div ref={bottomRef} />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">No messages yet. Start the conversation.</div>
                  )}
                </div>

                <div className="border-t border-gray-200 bg-white p-3">
                  {selectedMessageIds.length > 0 ? (
                    <div className="mb-3 flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                      <span>{selectedMessageIds.length} selected</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setSelectionMode(false)} className="text-gray-500">Cancel</button>
                        <button type="button" onClick={() => setDeleteDialog({ messageIds: selectedMessageIds, allowEveryone: true })} className="rounded-full bg-primary-600 px-3 py-1 text-white">Delete</button>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-end gap-2">
                    <button type="button" onClick={() => setSelectionMode((current) => !current)} className={`rounded-full border px-3 py-2 text-sm ${selectionMode ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>
                      {selectionMode ? 'Done' : 'Select'}
                    </button>
                    <div className="relative flex-1">
                      <textarea
                        value={messageInput}
                        onChange={(event) => setMessageInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Type a message"
                        className="min-h-[44px] w-full rounded-2xl border border-gray-200 px-3 py-2 pr-12 text-sm outline-none focus:border-primary-400"
                      />
                      <button type="button" onClick={() => setShowEmojiPicker((current) => !current)} className="absolute right-2 top-2 rounded-full p-1 text-gray-500 hover:bg-gray-100">
                        <Smile size={16} />
                      </button>
                      {showEmojiPicker ? (
                        <div className="absolute bottom-full right-0 mb-2 flex max-w-[240px] flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                          {emojiOptions.map((emoji) => (
                            <button key={emoji} type="button" onClick={() => { setMessageInput((current) => `${current}${emoji}`); setShowEmojiPicker(false); }} className="rounded-lg p-1 text-xl hover:bg-gray-100">
                              {emoji}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-100" title="Attach file">
                      {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                    </button>
                    <button type="button" onClick={handleSend} disabled={sendMessageMutation.isPending || !messageInput.trim()} className="rounded-full bg-primary-600 p-2 text-white disabled:opacity-60">
                      {sendMessageMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                  {uploading ? <p className="mt-2 text-xs text-gray-500">Uploading {uploadProgress}%</p> : null}
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.txt" onChange={handleFileSelect} />
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-gray-500">
                Select a customer to begin the chat experience.
              </div>
            )}
          </section>
        </div>

        {deleteDialog ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
              <p className="text-lg font-semibold text-gray-900">Delete message</p>
              <div className="mt-4 flex flex-col gap-2">
                <button type="button" onClick={() => confirmDelete('me')} className="rounded-xl border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50">
                  {deleteDialog.messageIds.length > 1 ? 'Delete selected messages for me' : 'Delete for me'}
                </button>
                {deleteDialog.allowEveryone ? (
                  <button type="button" onClick={() => confirmDelete('everyone')} className="rounded-xl border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50">
                    {deleteDialog.messageIds.length > 1 ? 'Delete selected messages for everyone' : 'Delete for everyone'}
                  </button>
                ) : null}
                <button type="button" onClick={() => setDeleteDialog(null)} className="rounded-xl border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        ) : null}

        {activeCall ? (
          <CallModal
            callId={activeCall.callId}
            peerId={activeCall.peerId}
            callType={activeCall.callType}
            isIncoming={activeCall.isIncoming}
            allowVideo={false}
            onCallLog={() => undefined}
            onClose={() => setActiveCall(null)}
          />
        ) : null}
      </div>
    );
  }