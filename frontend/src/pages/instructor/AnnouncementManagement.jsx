import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AnnouncementManagement = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_pinned: false
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.content) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      if (editingId) {
        await axios.put(`/api/announcements/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setSuccess('공지사항이 수정되었습니다.');
      } else {
        await axios.post(`/api/announcements/courses/${courseId}/announcements`, formData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setSuccess('공지사항이 작성되었습니다.');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', content: '', is_pinned: false });
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to save announcement:', error);
      setError(error.response?.data?.error || '공지사항 저장에 실패했습니다.');
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      is_pinned: announcement.is_pinned || false
    });
    setEditingId(announcement.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSuccess('공지사항이 삭제되었습니다.');
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      setError(error.response?.data?.error || '공지사항 삭제에 실패했습니다.');
    }
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>공지사항 관리</h2>
        <button
          className="btn"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ title: '', content: '', is_pinned: false });
            setError('');
            setSuccess('');
          }}
        >
          {showForm ? '취소' : '+ 공지사항 작성'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '0.375rem' }}>
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>{editingId ? '공지사항 수정' : '공지사항 작성'}</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              제목 *
            </label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="공지사항 제목을 입력하세요"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              내용 *
            </label>
            <textarea
              className="input"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              placeholder="공지사항 내용을 입력하세요"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_pinned}
                onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
              />
              <span>상단 고정</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn">
              {editingId ? '수정하기' : '작성하기'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({ title: '', content: '', is_pinned: false });
                setError('');
                setSuccess('');
              }}
              style={{ backgroundColor: 'var(--gray-400)' }}
            >
              취소
            </button>
          </div>
        </form>
      )}

      <div>
        <h3 style={{ marginBottom: '1rem' }}>공지사항 목록</h3>
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
                  borderLeft: announcement.is_pinned ? '4px solid var(--primary)' : '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      {announcement.is_pinned && (
                        <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          고정
                        </span>
                      )}
                      <h4 style={{ margin: 0, fontWeight: 'bold' }}>{announcement.title}</h4>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      작성자: {announcement.instructor?.name || 'N/A'} | 작성일: {new Date(announcement.created_at).toLocaleString('ko-KR')}
                      {announcement.updated_at !== announcement.created_at && (
                        <> | 수정일: {new Date(announcement.updated_at).toLocaleString('ko-KR')}</>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn"
                      onClick={() => handleEdit(announcement)}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                    >
                      수정
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleDelete(announcement.id)}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--error)', color: 'white' }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem', whiteSpace: 'pre-wrap' }}>
                  {announcement.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementManagement;

