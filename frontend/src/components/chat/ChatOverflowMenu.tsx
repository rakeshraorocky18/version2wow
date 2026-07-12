import { useState } from 'react';
import {
  Ban,
  BellOff,
  ChevronRight,
  Clock,
  FileText,
  Flag,
  Image as ImageIcon,
  Link2,
  Search,
  Trash2,
  Eraser,
} from 'lucide-react';

type Props = {
  isBlocked: boolean;
  muted: boolean;
  disappearingSeconds: number;
  onSearch: () => void;
  onMedia: () => void;
  onLinks: () => void;
  onDocs: () => void;
  onToggleMute: () => void;
  onDisappearing: () => void;
  onDeleteForEveryone: () => void;
  onDeleteForMe: () => void;
  onReport: () => void;
  onBlock: () => void;
  onClearChat: () => void;
  onUnblock: () => void;
  onDeleteChat: () => void;
  busy?: boolean;
};

export default function ChatOverflowMenu({
  isBlocked,
  muted,
  disappearingSeconds,
  onSearch,
  onMedia,
  onLinks,
  onDocs,
  onToggleMute,
  onDisappearing,
  onDeleteForEveryone,
  onDeleteForMe,
  onReport,
  onBlock,
  onClearChat,
  onUnblock,
  onDeleteChat,
  busy,
}: Props) {
  const [showMore, setShowMore] = useState(false);

  if (isBlocked) {
    return (
      <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
        <button
          type="button"
          onClick={onUnblock}
          disabled={busy}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 disabled:opacity-60"
        >
          Unblock user
        </button>
        <button
          type="button"
          onClick={onDeleteChat}
          disabled={busy}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          <Trash2 size={14} /> Delete chat
        </button>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-full z-20 mt-1 w-60 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
      {!showMore ? (
        <>
          <button type="button" onClick={onSearch} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Search size={14} /> Search
          </button>
          <button type="button" onClick={onMedia} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <ImageIcon size={14} /> Media
          </button>
          <button type="button" onClick={onLinks} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Link2 size={14} /> Links
          </button>
          <button type="button" onClick={onDocs} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <FileText size={14} /> Docs
          </button>
          <button type="button" onClick={onToggleMute} disabled={busy} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            <BellOff size={14} /> {muted ? 'Unmute notifications' : 'Mute notifications'}
          </button>
          <button type="button" onClick={onDisappearing} disabled={busy} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            <Clock size={14} /> Disappearing messages{disappearingSeconds > 0 ? ' · On' : ''}
          </button>
          <button type="button" onClick={onDeleteForEveryone} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Delete for everyone
          </button>
          <button type="button" onClick={onDeleteForMe} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
            <Eraser size={14} /> Delete for me
          </button>
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="flex w-full items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            More <ChevronRight size={14} />
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={() => setShowMore(false)} className="w-full px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
            ← Back
          </button>
          <button type="button" onClick={onReport} disabled={busy} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            <Flag size={14} /> Report
          </button>
          <button type="button" onClick={onBlock} disabled={busy} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60">
            <Ban size={14} /> Block
          </button>
          <button type="button" onClick={onClearChat} disabled={busy} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60">
            <Eraser size={14} /> Clear chat
          </button>
        </>
      )}
    </div>
  );
}
