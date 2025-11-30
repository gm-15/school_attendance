import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AttendanceManagement = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weekSessions, setWeekSessions] = useState([]);
  const [attendances, setAttendances] = useState({}); // { sessionId: [attendances] }
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchSessions();
      fetchEnrolledStudents();
    }
  }, [courseId]);

  useEffect(() => {
    if (selectedWeek) {
      const weekSess = sessions.filter(s => s.week === selectedWeek).sort((a, b) => a.session_number - b.session_number);
      setWeekSessions(weekSess);
      fetchAttendancesForWeek(weekSess);
    }
  }, [selectedWeek, sessions]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/sessions`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const sess = response.data || [];
      setSessions(sess);
      if (sess.length > 0) {
        const uniqueWeeks = [...new Set(sess.map(s => s.week))].sort((a, b) => a - b);
        if (uniqueWeeks.length > 0) {
          setSelectedWeek(uniqueWeeks[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setError('수업 세션 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      const response = await axios.get(`/api/enrollments/courses/${courseId}/enrollments`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setEnrolledStudents(response.data.map(e => e.user || e));
    } catch (error) {
      console.error('Failed to fetch enrolled students:', error);
    }
  };

  const fetchAttendancesForWeek = async (weekSess) => {
    const attendancesMap = {};
    for (const session of weekSess) {
      try {
        const response = await axios.get(`/api/attendance/sessions/${session.id}/attendance`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        attendancesMap[session.id] = response.data;
      } catch (error) {
        console.error(`Failed to fetch attendances for session ${session.id}:`, error);
        attendancesMap[session.id] = [];
      }
    }
    setAttendances(attendancesMap);
  };

  const handleUpdateAttendance = async (attendanceId, sessionId, status, lateMinutes) => {
    try {
      await axios.patch(`/api/attendance/${attendanceId}`, {
        status,
        late_minutes: lateMinutes
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      // 해당 세션의 출석 정보 다시 가져오기
      const response = await axios.get(`/api/attendance/sessions/${sessionId}/attendance`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setAttendances(prev => ({ ...prev, [sessionId]: response.data }));
    } catch (error) {
      setError(error.response?.data?.error || '출석 수정에 실패했습니다.');
    }
  };

  const handleRollCall = async (studentId, sessionId, status, lateMinutes = 0) => {
    try {
      await axios.post(`/api/attendance/sessions/${sessionId}/roll-call`, {
        student_id: studentId,
        status,
        late_minutes: lateMinutes
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      // 해당 세션의 출석 정보 다시 가져오기
      const response = await axios.get(`/api/attendance/sessions/${sessionId}/attendance`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setAttendances(prev => ({ ...prev, [sessionId]: response.data }));
    } catch (error) {
      setError(error.response?.data?.error || '호명 출석 체크에 실패했습니다.');
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

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>출석 관리</h2>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>주차 선택</label>
        <select
          className="input"
          value={selectedWeek || ''}
          onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
        >
          {[...new Set(sessions.map(s => s.week))].sort((a, b) => a - b).map(week => (
            <option key={week} value={week}>
              {week}주차
            </option>
          ))}
        </select>
      </div>

      {selectedWeek && weekSessions.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>학번</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>이름</th>
                {weekSessions.map(session => (
                  <th key={session.id} style={{ padding: '0.75rem', textAlign: 'left' }}>
                    {session.session_number}교시
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enrolledStudents.map((student) => (
                <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>{student.student_id || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{student.name || 'N/A'}</td>
                  {weekSessions.map(session => {
                    const sessionAttendances = attendances[session.id] || [];
                    const attendance = sessionAttendances.find(a => a.student_id === student.id);
                    
                    return (
                      <td key={session.id} style={{ padding: '0.75rem' }}>
                        {attendance ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <select
                              value={attendance.status}
                              onChange={(e) => handleUpdateAttendance(attendance.id, session.id, parseInt(e.target.value), attendance.late_minutes)}
                              style={{ padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                            >
                              <option value={0}>미정</option>
                              <option value={1}>출석</option>
                              <option value={2}>지각</option>
                              <option value={3}>결석</option>
                              <option value={4}>공결</option>
                            </select>
                            {attendance.status === 2 && (
                              <input
                                type="number"
                                value={attendance.late_minutes || 0}
                                onChange={(e) => handleUpdateAttendance(attendance.id, session.id, attendance.status, parseInt(e.target.value) || 0)}
                                style={{ width: '60px', padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                                min="0"
                                placeholder="지각(분)"
                              />
                            )}
                          </div>
                        ) : (
                          <button
                            className="btn"
                            onClick={() => handleRollCall(student.id, session.id, 1, 0)}
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                          >
                            호명 출석
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {enrolledStudents.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              수강생이 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;


