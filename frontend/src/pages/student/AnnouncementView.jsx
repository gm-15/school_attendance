import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AnnouncementView = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchAnnouncements();
    }
  }, [courseId]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/announcements/courses/${courseId}/announcements`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setAnnouncements(response.data || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      const errorMessage = error.response?.data?.error || error.message || '공지사항을 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>공지사항</h2>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      {announcements.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          공지사항이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {announcements.map(announcement => (
            <div
              key={announcement.id}
              style={{
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                borderLeft: announcement.is_pinned ? '4px solid var(--primary)' : '1px solid var(--border)',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedAnnouncement(selectedAnnouncement?.id === announcement.id ? null : announcement)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {announcement.is_pinned && (
                  <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    고정
                  </span>
                )}
                <h4 style={{ margin: 0, fontWeight: 'bold', flex: 1 }}>{announcement.title}</h4>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {selectedAnnouncement?.id === announcement.id ? '▼' : '▶'}
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                작성자: {announcement.instructor?.name || 'N/A'} | 작성일: {new Date(announcement.created_at).toLocaleString('ko-KR')}
              </div>
              {selectedAnnouncement?.id === announcement.id && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem', whiteSpace: 'pre-wrap' }}>
                  {announcement.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementView;

