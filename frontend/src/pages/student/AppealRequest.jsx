import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AppealRequest = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [attendances, setAttendances] = useState([]);
  const [myAppeals, setMyAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [formData, setFormData] = useState({
    message: ''
  });

  useEffect(() => {
    if (courseId) {
      fetchAttendances();
      fetchMyAppeals();
    }
  }, [courseId]);

  const fetchAttendances = async () => {
    try {
      const response = await axios.get(`/api/attendance/courses/${courseId}/attendance`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setAttendances(response.data || []);
    } catch (error) {
      console.error('Failed to fetch attendances:', error);
      setError('출석 현황을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAppeals = async () => {
    try {
      const response = await axios.get('/api/appeals', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      // 현재 과목의 출석에 대한 이의제기만 필터링
      const attendanceIds = attendances.map(a => a.id);
      const filtered = response.data.filter(appeal => 
        attendanceIds.includes(appeal.attendance_id)
      );
      setMyAppeals(filtered);
    } catch (error) {
      console.error('Failed to fetch appeals:', error);
    }
  };

  useEffect(() => {
    if (courseId && attendances.length > 0) {
      fetchMyAppeals();
    }
  }, [attendances, courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedAttendance) {
      setError('출석 기록을 선택해주세요.');
      return;
    }

    if (!formData.message || formData.message.trim() === '') {
      setError('이의제기 사유를 입력해주세요.');
      return;
    }

    try {
      await axios.post(`/api/appeals/attendance/${selectedAttendance.id}/appeals`, {
        message: formData.message
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setSuccess('이의제기가 신청되었습니다.');
      setShowForm(false);
      setFormData({ message: '' });
      setSelectedAttendance(null);
      fetchMyAppeals();
      fetchAttendances();
    } catch (error) {
      console.error('Failed to submit appeal:', error);
      setError(error.response?.data?.error || '이의제기 신청에 실패했습니다.');
    }
  };

  const statusLabels = {
    pending: '대기중',
    approved: '승인',
    rejected: '반려'
  };

  const statusColors = {
    pending: '#9ca3af',
    approved: '#16a34a',
    rejected: '#dc2626'
  };

  const attendanceStatusLabels = {
    0: '미정',
    1: '출석',
    2: '지각',
    3: '결석',
    4: '공결'
  };

  const attendanceStatusColors = {
    0: '#9ca3af',
    1: '#16a34a',
    2: '#eab308',
    3: '#dc2626',
    4: '#3b82f6'
  };

  // 출석 기록에 이미 이의제기가 있는지 확인
  const hasAppeal = (attendanceId) => {
    return myAppeals.some(a => a.attendance_id === attendanceId);
  };

  // 주차별로 그룹화
  const groupedByWeek = {};
  attendances.forEach(att => {
    const week = att.session?.week;
    if (!week) return;
    
    if (!groupedByWeek[week]) {
      groupedByWeek[week] = [];
    }
    groupedByWeek[week].push(att);
  });

  // 각 주차별로 세션 번호 순으로 정렬
  Object.keys(groupedByWeek).forEach(week => {
    groupedByWeek[week].sort((a, b) => {
      const sessionA = a.session?.session_number || 0;
      const sessionB = b.session?.session_number || 0;
      return sessionA - sessionB;
    });
  });

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>이의제기</h2>
        <button 
          className="btn" 
          onClick={() => {
            setShowForm(!showForm);
            setError('');
            setSuccess('');
          }}
        >
          {showForm ? '취소' : '신청하기'}
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
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              출석 기록 선택 *
            </label>
            <select
              className="input"
              value={selectedAttendance?.id || ''}
              onChange={(e) => {
                const att = attendances.find(a => a.id === parseInt(e.target.value));
                setSelectedAttendance(att);
              }}
              required
            >
              <option value="">출석 기록을 선택하세요</option>
              {Object.keys(groupedByWeek).sort((a, b) => parseInt(a) - parseInt(b)).map(week => {
                const weekAttendances = groupedByWeek[week];
                return weekAttendances.map(att => {
                  const hasAppealForThis = hasAppeal(att.id);
                  return (
                    <option 
                      key={att.id} 
                      value={att.id}
                      disabled={hasAppealForThis}
                    >
                      {week}주차 {att.session?.session_number}교시 - {attendanceStatusLabels[att.status]} {hasAppealForThis ? '(이미 신청됨)' : ''}
                    </option>
                  );
                });
              })}
            </select>
            {selectedAttendance && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>현재 상태:</strong>{' '}
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: attendanceStatusColors[selectedAttendance.status] + '20',
                    color: attendanceStatusColors[selectedAttendance.status],
                    fontWeight: 'bold'
                  }}>
                    {attendanceStatusLabels[selectedAttendance.status]}
                  </span>
                </div>
                {selectedAttendance.late_minutes > 0 && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <strong>지각 시간:</strong> {selectedAttendance.late_minutes}분
                  </div>
                )}
                {selectedAttendance.checked_at && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <strong>출석 체크 시간:</strong> {new Date(selectedAttendance.checked_at).toLocaleString('ko-KR')}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              이의제기 사유 *
            </label>
            <textarea
              className="input"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              placeholder="이의제기 사유를 상세히 입력해주세요."
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%' }}
          >
            신청하기
          </button>
        </form>
      )}

      <div>
        <h3 style={{ marginBottom: '1rem' }}>내 이의제기 내역</h3>
        {myAppeals.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            이의제기 내역이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myAppeals.map(appeal => {
              const attendance = attendances.find(a => a.id === appeal.attendance_id);
              return (
                <div 
                  key={appeal.id} 
                  style={{ 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {attendance?.session ? `${attendance.session.week}주차 ${attendance.session.session_number}교시` : '출석 기록 없음'}
                      </div>
                      {attendance && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          출석 상태: {attendanceStatusLabels[attendance.status]}
                          {attendance.late_minutes > 0 && ` (${attendance.late_minutes}분 지각)`}
                        </div>
                      )}
                    </div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      backgroundColor: statusColors[appeal.status] + '20',
                      color: statusColors[appeal.status],
                      fontWeight: 'bold',
                      fontSize: '0.875rem'
                    }}>
                      {statusLabels[appeal.status]}
                    </span>
                  </div>
                  
                  <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>이의제기 사유:</strong>
                      <div style={{ marginTop: '0.25rem', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem' }}>
                        {appeal.message}
                      </div>
                    </div>
                    {appeal.instructor_comment && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem' }}>
                        <strong>교원 코멘트:</strong> {appeal.instructor_comment}
                      </div>
                    )}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      신청일: {new Date(appeal.submitted_at).toLocaleString('ko-KR')}
                      {appeal.reviewed_at && (
                        <> | 처리일: {new Date(appeal.reviewed_at).toLocaleString('ko-KR')}</>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppealRequest;

