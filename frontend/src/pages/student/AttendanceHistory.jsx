import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AttendanceHistory = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchAttendances();
    }
  }, [courseId]);

  const fetchAttendances = async () => {
    try {
      const response = await axios.get(`/api/attendance/courses/${courseId}/attendance`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setAttendances(response.data);
    } catch (error) {
      console.error('Failed to fetch attendances:', error);
      setError('출석 현황을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  const statusLabels = {
    0: '미정',
    1: '출석',
    2: '지각',
    3: '결석',
    4: '공결'
  };

  const statusColors = {
    0: '#9ca3af',
    1: '#16a34a',
    2: '#eab308',
    3: '#dc2626',
    4: '#3b82f6'
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

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>출석 현황</h2>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      {Object.keys(groupedByWeek).length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          출석 기록이 없습니다.
        </div>
      ) : (
        <div>
          {Object.keys(groupedByWeek).sort((a, b) => parseInt(a) - parseInt(b)).map(week => {
            const weekAttendances = groupedByWeek[week];
            const firstSession = weekAttendances[0]?.session;
            const maxSessionNumber = Math.max(...weekAttendances.map(a => a.session?.session_number || 0));
            
            // 세션 번호별로 출석 정보 매핑
            const sessionMap = {};
            weekAttendances.forEach(att => {
              const sessionNum = att.session?.session_number;
              if (sessionNum) {
                sessionMap[sessionNum] = att;
              }
            });

            return (
              <div key={week} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>
                  {week}주차
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {firstSession?.start_at ? new Date(firstSession.start_at).toLocaleDateString('ko-KR') : 'N/A'}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {Array.from({ length: maxSessionNumber }, (_, i) => i + 1).map(sessionNum => {
                    const attendance = sessionMap[sessionNum];
                    return (
                      <div 
                        key={sessionNum} 
                        style={{ 
                          flex: '1 1 auto',
                          minWidth: '100px',
                          padding: '0.75rem', 
                          backgroundColor: 'white', 
                          borderRadius: '0.375rem',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                          {sessionNum}교시
                        </div>
                        {attendance ? (
                          <div>
                            <div style={{ marginBottom: '0.25rem' }}>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                backgroundColor: statusColors[attendance.status] + '20',
                                color: statusColors[attendance.status],
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                display: 'inline-block'
                              }}>
                                {statusLabels[attendance.status]}
                              </span>
                            </div>
                            {attendance.late_minutes > 0 && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                {attendance.late_minutes}분 지각
                              </div>
                            )}
                            {attendance.checked_at && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                {new Date(attendance.checked_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            기록 없음
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;

