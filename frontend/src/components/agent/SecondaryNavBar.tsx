import {
  ArrowLeft,
  Heart,
  MessageCircle,
  History,
  Bell,
} from "lucide-react";

type SecondaryNavProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setNotificationOpen: (value: boolean) => void;
};

export default function SecondaryNav({
  activeTab,
  setActiveTab,
  setNotificationOpen,
}: SecondaryNavProps) {
  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-3 mt-4">
      <div className="flex items-center justify-between">

        {/* Left - Back */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-rose-600 font-medium hover:text-rose-700 transition"
        >
          <ArrowLeft size={18} />
          <span>Back to Clients</span>
        </button>

        {/* Center - Navigation */}
        <div className="flex items-center gap-4">

          <button
            onClick={() => setActiveTab("matches")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === "matches"
                ? "bg-rose-100 text-rose-600 font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Heart size={18} />
            <span>Matches</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === "chat"
                ? "bg-rose-100 text-rose-600 font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <MessageCircle size={18} />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === "history"
                ? "bg-rose-100 text-rose-600 font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <History size={18} />
            <span>History</span>
          </button>

        </div>

        {/* Right - Notifications */}
        <button
          onClick={() => setNotificationOpen(true)}
          className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
        >
          <Bell size={18} />
          <span>Notifications</span>

          <span className="absolute top-1 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            3
          </span>
        </button>

      </div>
    </div>
  );
}