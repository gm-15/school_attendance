import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AuditLogView = () => {
  const { accessToken } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    target_type: '',
    target_id: '',
    user_id: '',
    start_date: '',
    end_date: ''
  });
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`/api/audits?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setLogs(response.data || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setError('감사 로그를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    setFilters({
      target_type: '',
      target_id: '',
      user_id: '',
      start_date: '',
      end_date: ''
    });
  };

  const getActionLabel = (action) => {
    const actionMap = {
      'attendance_change': '출석 변경',
      'attendance_create': '출석 생성',
      'excuse_approve': '공결 승인',
      'excuse_reject': '공결 거부',
      'appeal_approve': '이의제기 승인',
      'appeal_reject': '이의제기 거부',
      'session_create': '세션 생성',
      'session_update': '세션 수정',
      'session_delete': '세션 삭제',
      'session_open': '세션 시작',
      'session_close': '세션 종료',
      'session_pause': '세션 일시정지',
      'policy_change': '정책 변경',
      'user_create': '사용자 생성',
      'user_update': '사용자 수정',
      'user_delete': '사용자 삭제',
      'course_create': '과목 생성',
      'course_update': '과목 수정',
      'course_delete': '과목 삭제',
      'enrollment_create': '수강신청 생성',
      'enrollment_delete': '수강신청 삭제'
    };
    return actionMap[action] || action;
  };

  const getTargetTypeLabel = (type) => {
    const typeMap = {
      'Attendance': '출석',
      'ExcuseRequest': '공결 신청',
      'Appeal': '이의제기',
      'ClassSession': '수업 세션',
      'AttendancePolicy': '출석 정책',
      'User': '사용자',
      'Course': '과목',
      'Enrollment': '수강신청'
    };
    return typeMap[type] || type;
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>감사 로그</h2>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>필터</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              대상 타입
            </label>
            <select
              name="target_type"
              value={filters.target_type}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">전체</option>
              <option value="Attendance">출석</option>
              <option value="ExcuseRequest">공결 신청</option>
              <option value="Appeal">이의제기</option>
              <option value="ClassSession">수업 세션</option>
              <option value="AttendancePolicy">출석 정책</option>
              <option value="User">사용자</option>
              <option value="Course">과목</option>
              <option value="Enrollment">수강신청</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              대상 ID
            </label>
            <input
              type="number"
              name="target_id"
              value={filters.target_id}
              onChange={handleFilterChange}
              className="input"
              placeholder="대상 ID"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              사용자 ID
            </label>
            <input
              type="number"
              name="user_id"
              value={filters.user_id}
              onChange={handleFilterChange}
              className="input"
              placeholder="사용자 ID"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              시작 날짜
            </label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="input"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              종료 날짜
            </label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="input"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button className="btn" onClick={fetchLogs} style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
            검색
          </button>
          <button className="btn" onClick={handleReset} style={{ backgroundColor: 'var(--border)', color: 'var(--text)' }}>
            초기화
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">감사 로그를 불러오는 중...</div>
      ) : (
        <div className="card">
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>로그 목록 ({logs.length}건)</h3>
          </div>

          {logs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              감사 로그가 없습니다.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>시간</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>사용자</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>작업</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>대상</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>이전 값</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>변경 값</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>IP 주소</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        {new Date(log.createdAt).toLocaleString('ko-KR')}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{log.user?.name || 'N/A'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {log.user?.email || ''} ({log.user?.role || ''})
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{getTargetTypeLabel(log.target_type)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ID: {log.target_id}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.75rem', maxWidth: '200px' }}>
                        {log.old_value ? (
                          <div
                            onClick={() => setModalData({ title: '이전 값', data: log.old_value, type: 'old' })}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#fef2f2',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              border: '1px solid #fecaca',
                              transition: 'background-color 0.2s',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                            title="클릭하여 상세 보기"
                          >
                            <div style={{ fontWeight: 'bold', color: '#dc2626', marginBottom: '0.25rem' }}>
                              이전 값 보기
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              {Object.keys(log.old_value).length}개 필드
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.75rem', maxWidth: '200px' }}>
                        {log.new_value ? (
                          <div
                            onClick={() => setModalData({ title: '변경 값', data: log.new_value, type: 'new' })}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#f0fdf4',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              border: '1px solid #86efac',
                              transition: 'background-color 0.2s',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dcfce7'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                            title="클릭하여 상세 보기"
                          >
                            <div style={{ fontWeight: 'bold', color: '#16a34a', marginBottom: '0.25rem' }}>
                              변경 값 보기
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              {Object.keys(log.new_value).length}개 필드
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modalData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setModalData(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              maxWidth: '800px',
              maxHeight: '90vh',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: modalData.type === 'old' ? '#dc2626' : '#16a34a' }}>
                {modalData.title}
              </h3>
              <button
                onClick={() => setModalData(null)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--border)',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '1rem',
                backgroundColor: modalData.type === 'old' ? '#fef2f2' : '#f0fdf4',
                borderRadius: '0.375rem',
                border: `1px solid ${modalData.type === 'old' ? '#fecaca' : '#86efac'}`
              }}
            >
              <pre style={{
                margin: 0,
                fontSize: '0.875rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace'
              }}>
                {JSON.stringify(modalData.data, null, 2)}
              </pre>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(modalData.data, null, 2));
                  alert('클립보드에 복사되었습니다.');
                }}
                className="btn"
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
              >
                복사
              </button>
              <button
                onClick={() => setModalData(null)}
                className="btn"
                style={{ backgroundColor: 'var(--border)', color: 'var(--text)', marginLeft: '0.5rem' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogView;

