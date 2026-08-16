import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { CivicNotification } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDateTime } from '../../utils/formatters';

export const CitizenNotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<CivicNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);

  useEffect(() => {
    async function loadNotifications() {
      if (!user) return;
      try {
        const data = await notificationService.getNotifications(user.uid);
        setNotifications(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadNotifications();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filtered = filterUnreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }} className="animate-fade-in">
      <PageHeader
        title="Grievance Notifications &amp; Alerts"
        subtitle="Real-time status updates and departmental notices for your reported issues"
        actions={
          unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} leftIcon={<Check size={14} />}>
              Mark All as Read ({unreadCount})
            </Button>
          )
        }
      />

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => setFilterUnreadOnly(false)}
          className={`btn btn-sm ${!filterUnreadOnly ? 'btn-primary' : 'btn-outline'}`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterUnreadOnly(true)}
          className={`btn btn-sm ${filterUnreadOnly ? 'btn-primary' : 'btn-outline'}`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {isLoading ? (
        <LoadingState message="Fetching notifications..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No notifications found"
          description="You're all caught up! New status changes and department assignments will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((n) => (
            <Card
              key={n.id}
              style={{
                borderLeft: n.isRead ? '4px solid var(--border-subtle)' : '4px solid var(--color-primary-600)',
                backgroundColor: n.isRead ? 'var(--bg-surface)' : 'hsl(215, 100%, 99%)',
              }}
            >
              <CardBody style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div
                      style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: n.type === 'status_change' ? 'var(--color-primary-50)' : 'hsl(45, 100%, 93%)',
                        color: n.type === 'status_change' ? 'var(--color-primary-800)' : 'hsl(35, 95%, 35%)',
                        marginTop: '2px',
                        flexShrink: 0,
                      }}
                    >
                      <Bell size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: n.isRead ? 600 : 700, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.5 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        {formatDateTime(n.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {n.complaintId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleMarkAsRead(n.id);
                          navigate('/citizen/track');
                        }}
                        rightIcon={<ArrowRight size={13} />}
                      >
                        Inspect
                      </Button>
                    )}
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(n.id)}
                        style={{
                          fontSize: '0.6875rem',
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary-600)',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
