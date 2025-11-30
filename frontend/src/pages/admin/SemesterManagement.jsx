import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const SemesterManagement = () => {
  const { accessToken } = useAuth();
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ year: '', term: '1', start_date: '', end_date: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const response = await axios.get('/api/semesters', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSemesters(response.data);
    } catch (error) {
      console.error('Failed to fetch semesters:', error);
      setError('학기 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await axios.put(`/api/semesters/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } else {
        await axios.post('/api/semesters', formData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ year: '', term: '1', start_date: '', end_date: '' });
      fetchSemesters();
    } catch (error) {
      setError(error.response?.data?.error || '저장에 실패했습니다.');
    }
  };

  const handleEdit = (semester) => {
    setFormData({
      year: semester.year.toString(),
      term: semester.term,
      start_date: semester.start_date,
      end_date: semester.end_date
    });
    setEditingId(semester.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/api/semesters/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchSemesters();
    } catch (error) {
      setError(error.response?.data?.error || '삭제에 실패했습니다.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>학기 관리</h2>
        <button className="btn" onClick={() => { setShowForm(true); setEditingId(null); setFormData({ year: '', term: '1', start_date: '', end_date: '' }); }}>
          + 학기 추가
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem', backgroundColor: 'var(--gray-50)' }}>
          <h3>{editingId ? '학기 수정' : '학기 추가'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>연도</label>
              <input
                type="number"
                className="input"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
                min="2020"
                max="2100"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>학기</label>
              <select
                className="input"
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                required
              >
                <option value="1">1학기</option>
                <option value="2">2학기</option>
                <option value="여름">여름학기</option>
                <option value="겨울">겨울학기</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>시작일</label>
              <input
                type="date"
                className="input"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>종료일</label>
              <input
                type="date"
                className="input"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn">저장</button>
              <button type="button" className="btn" onClick={() => { setShowForm(false); setEditingId(null); setFormData({ year: '', term: '1', start_date: '', end_date: '' }); }}>
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>연도</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>학기</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>시작일</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>종료일</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {semesters.map((semester) => (
              <tr key={semester.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem' }}>{semester.id}</td>
                <td style={{ padding: '0.75rem' }}>{semester.year}</td>
                <td style={{ padding: '0.75rem' }}>{semester.term}</td>
                <td style={{ padding: '0.75rem' }}>{semester.start_date}</td>
                <td style={{ padding: '0.75rem' }}>{semester.end_date}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button className="btn" onClick={() => handleEdit(semester)} style={{ marginRight: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                    수정
                  </button>
                  <button className="btn" onClick={() => handleDelete(semester.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--error)', color: 'white' }}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {semesters.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            등록된 학기가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default SemesterManagement;

