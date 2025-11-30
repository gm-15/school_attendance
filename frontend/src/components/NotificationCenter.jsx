import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const NotificationCenter = () => {
  const { accessToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // 30초마다 알림 업데이트
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setNotifications(response.data || []);
      const unread = response.data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => 
          axios.patch(`/api/notifications/${n.id}/read`, {}, {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
        )
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'attendance_open':
        return '📝';
      case 'attendance_close':
        return '✅';
      case 'excuse_result':
        return '📋';
      case 'appeal_result':
        return '⚖️';
      case 'announcement':
        return '📢';
      case 'poll':
        return '📊';
      case 'absence_warning':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'attendance_open':
        return '#3b82f6';
      case 'attendance_close':
        return '#10b981';
      case 'excuse_result':
        return '#8b5cf6';
      case 'appeal_result':
        return '#f59e0b';
      case 'announcement':
        return '#ef4444';
      case 'poll':
        return '#06b6d4';
      case 'absence_warning':
        return '#f97316';
      default:
        return '#6b7280';
    }
  };

  return (
    <div ref={notificationRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: '0.5rem',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.5rem'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '1.25rem',
              height: '1.25rem',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '0.5rem',
            width: '400px',
            maxHeight: '600px',
            backgroundColor: 'white',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold' }}>알림</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                모두 읽음
              </button>
            )}
          </div>

          <div
            style={{
              overflowY: 'auto',
              flex: 1
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}
              >
                알림이 없습니다.
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: notification.is_read ? 'white' : '#f0f9ff',
                    cursor: notification.is_read ? 'default' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!notification.is_read) {
                      e.currentTarget.style.backgroundColor = '#e0f2fe';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!notification.is_read) {
                      e.currentTarget.style.backgroundColor = '#f0f9ff';
                    }
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        flexShrink: 0
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.25rem'
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            color: notification.is_read ? 'var(--text-secondary)' : 'var(--text-primary)'
                          }}
                        >
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <span
                            style={{
                              width: '0.5rem',
                              height: '0.5rem',
                              borderRadius: '50%',
                              backgroundColor: getNotificationColor(notification.type),
                              flexShrink: 0
                            }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '0.25rem',
                          lineHeight: '1.4'
                        }}
                      >
                        {notification.content}
                      </div>
                      <div
                        style={{
                          fontSize: '0.625rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {new Date(notification.createdAt).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

