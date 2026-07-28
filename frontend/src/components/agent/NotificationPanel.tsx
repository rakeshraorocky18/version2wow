import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { agentService } from "../../services/agent/agentService";
import { useAgentAuthStore } from "../../store/agent/agentAuthStore";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  onNotificationRead?: () => void;
}

interface AgentNotificationItem {
  id: number;
  userId: string;
  customerId?: string;
  customerName?: string;
  profileId?: string;
  profileName?: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function NotificationPanel({
  open,
  onClose,
  onNotificationRead,
}: NotificationPanelProps) {
  const navigate = useNavigate();
  const user = useAgentAuthStore((state) => state.user);

  const [notifications, setNotifications] = useState<AgentNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user?.id) return;
    void loadNotifications();
  }, [open, user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setError(null);
      setLoading(true);
      const data = await agentService.getNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications", err);
      setError('Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: AgentNotificationItem) => {
    try {
      await agentService.markNotificationRead(notification.id);
      void loadNotifications();
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }

    if (notification.customerId) {
      navigate(`/app/clients/${notification.customerId}`, {
        state: {
          openTab: 'requests',
          profileId: notification.profileId,
          notificationId: notification.id,
          source: 'notification',
        },
      });
    } else {
      navigate('/app/clients');
    }
    onClose();
  };

  if (!open) return null;

    return (
  <>
    {/* Background Overlay */}
    <div
      className="fixed inset-0 z-40"
      onClick={onClose}
    />

    {/* Notification Popup */}
    <div className="fixed top-20 right-6 z-50 w-[380px] max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">

      <div className="flex items-center justify-between border-b px-5 py-4">

        <div>
          <h3 className="text-lg font-semibold">
            Notifications
          </h3>

          <p className="text-sm text-gray-500">
            Customer notifications
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xl text-gray-500 hover:text-black"
        >
          ✕
        </button>

      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-500">Loading notifications...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-500">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No notifications yet.</div>
      ) : (
        <div className="space-y-2 p-4">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => void handleNotificationClick(notification)}
              className={`w-full rounded-xl border p-4 text-left transition duration-150 hover:shadow-lg hover:border-pink-300 ${
                notification.isRead
                  ? 'border-gray-200 bg-white text-gray-700'
                  : 'border-rose-200 bg-rose-50 text-gray-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{notification.title}</p>
                  <p className="mt-2 text-sm text-wow-muted">{notification.message}</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-wow-muted">
                  {notification.isRead ? 'Read' : 'New'}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm">
                {notification.profileName && (
                  <p className="text-gray-700">
                    <span className="font-medium">From:</span> {notification.profileName}
                  </p>
                )}
                {notification.customerName && (
                  <p className="text-gray-700">
                    <span className="font-medium">To:</span> {notification.customerName}
                  </p>
                )}
              </div>
              <p className="mt-3 text-xs text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p>
            </button>
          ))}
        </div>
           )}
    </div>
  </>
);
}
export default NotificationPanel;