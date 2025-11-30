import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AttendanceCheck = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [openSessions, setOpenSessions] = useState([]);
  const [attendanceCode, setAttendanceCode] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchSessions();
      // 5초마다 세션 상태 업데이트
      const interval = setInterval(fetchSessions, 5000);
      return () => clearInterval(interval);
    }
  }, [courseId]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/sessions`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const allSessions = response.data || [];
      setSessions(allSessions);
      
      // 출석이 열려있는 세션만 필터링
      const open = allSessions.filter(s => s.status === 'open');
      setOpenSessions(open);
      
      if (open.length > 0 && !selectedSession) {
        setSelectedSession(open[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttend = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedSession) {
      setError('세션을 선택해주세요.');
      return;
    }

    try {
      await axios.post(`/api/attendance/sessions/${selectedSession}/attend`, {
        attendance_code: attendanceCode
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSuccess('출석 체크가 완료되었습니다.');
      setAttendanceCode('');
      fetchSessions();
    } catch (error) {
      setError(error.response?.data?.error || '출석 체크에 실패했습니다.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>출석 체크</h2>

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

      {openSessions.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          현재 출석 체크 가능한 세션이 없습니다.
        </div>
      ) : (
        <form onSubmit={handleAttend}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>세션 선택</label>
            <select
              className="input"
              value={selectedSession || ''}
              onChange={(e) => setSelectedSession(parseInt(e.target.value))}
              required
            >
              {openSessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.week}주차 {session.session_number}회차 - {new Date(session.start_at).toLocaleString('ko-KR')}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>인증번호 (6자리)</label>
            <input
              type="text"
              className="input"
              value={attendanceCode}
              onChange={(e) => setAttendanceCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="인증번호를 입력하세요"
              required
              maxLength={6}
              style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', textAlign: 'center' }}
            />
          </div>

          <button type="submit" className="btn" style={{ width: '100%' }}>
            출석 체크
          </button>
        </form>
      )}
    </div>
  );
};

export default AttendanceCheck;

